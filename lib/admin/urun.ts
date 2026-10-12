// Ürün yönetimi (admin). Her yazma denetimli() içinde çağrılır:
//   await denetimli(URUN_ISLEM.guncelle, (vt, a) => urunGuncelle(vt, a, id, girdi), ["admin"]);
//
// Para ve miktar lib/money.ts ile okunur (tr-TR: "1.234,56"). KDV oranı lib/kdv.ts listesinden
// seçilir; düzenlemede ürünün mevcut (listede artık olmayan) oranı korunabilir.
// Fotoğraf linkine sunucudan istek ATILMAZ (SSRF): yalnız biçim denetlenir.

import { z } from "zod";
import { GirisHatasi, IslemHatasi } from "@/lib/hatalar";
import { KDV_ORANLARI } from "@/lib/kdv";
import { dbMiktar, dbOran, dbPara, miktarOku, paraOku } from "@/lib/money";
import type { Aktor, KapsamliDb } from "@/lib/scope-cekirdek";
import { adminGerekli, alanHatasi, metinVeyaNull } from "./ortak";

export const URUN_ISLEM = {
  olustur: "urun.olustur",
  guncelle: "urun.guncelle",
  durum: "urun.durum",
} as const;

export const FOTOGRAF_URL_EN_FAZLA = 2000;
const HTTPS_LINK = /^https:\/\/[^\s]+$/;

export const urunSemasi = z.object({
  kod: z.string().trim().min(1, "Ürün kodu zorunlu.").max(50, "Ürün kodu en fazla 50 karakter."),
  ad: z.string().trim().min(1, "Ürün adı zorunlu.").max(200, "Ürün adı en fazla 200 karakter."),
  aciklama: z.string().max(5000, "Açıklama en fazla 5000 karakter.").optional(),
  kategori: z.string().trim().max(100, "Kategori en fazla 100 karakter.").optional(),
  birim: z.string().trim().min(1, "Birim zorunlu.").max(30, "Birim en fazla 30 karakter."),
  koliAdedi: z
    .string()
    .trim()
    .refine((s) => s === "" || /^[1-9]\d{0,5}$/.test(s), "Koli adedi pozitif bir tamsayı olmalı.")
    .optional(),
  minSiparis: z.string().trim().optional(),
  listeFiyat: z.string().trim().min(1, "Liste fiyatı zorunlu."),
  kdvOrani: z.string().trim().min(1, "KDV oranı seçin."),
  fotografUrl: z
    .string()
    .trim()
    .refine((s) => s === "" || HTTPS_LINK.test(s), "Fotoğraf linki https:// ile başlamalı ve boşluk içermemeli.")
    .refine((s) => s.length <= FOTOGRAF_URL_EN_FAZLA, `Fotoğraf linki en fazla ${FOTOGRAF_URL_EN_FAZLA} karakter.`)
    .optional(),
});
export type UrunGirdisi = z.input<typeof urunSemasi>;

/** Girdiyi doğrular, para/miktarı okur; tüm alan hatalarını birlikte döndürür. */
function urunVerisi(girdi: unknown, mevcutKdv: string | null) {
  const p = urunSemasi.safeParse(girdi);
  if (!p.success) throw alanHatasi(p.error);
  const g = p.data;
  const hatalar: Record<string, string> = {};

  let listeFiyat: string | undefined;
  try {
    const f = paraOku(g.listeFiyat);
    if (f.isNegative()) hatalar.listeFiyat = "Liste fiyatı negatif olamaz.";
    else listeFiyat = dbPara(f);
  } catch (e) {
    hatalar.listeFiyat = (e as Error).message;
  }

  let kdvOrani: string | undefined;
  try {
    const k = dbOran(g.kdvOrani.replace(",", "."));
    // Yeni ya da değiştirilen oran listeden; ürünün mevcut oranı listede olmasa da korunabilir.
    if ((KDV_ORANLARI as readonly string[]).includes(k) || k === mevcutKdv) kdvOrani = k;
    else hatalar.kdvOrani = "KDV oranı listeden seçilmeli.";
  } catch {
    hatalar.kdvOrani = "KDV oranı listeden seçilmeli.";
  }

  let minSiparis: string | null = null;
  if (g.minSiparis) {
    try {
      minSiparis = dbMiktar(miktarOku(g.minSiparis, g.birim), g.birim);
    } catch (e) {
      hatalar.minSiparis = (e as Error).message;
    }
  }

  if (Object.keys(hatalar).length) throw new GirisHatasi(hatalar);
  return {
    kod: g.kod,
    ad: g.ad,
    aciklama: metinVeyaNull(g.aciklama),
    kategori: metinVeyaNull(g.kategori),
    birim: g.birim,
    koli_adedi: g.koliAdedi ? Number(g.koliAdedi) : null,
    min_siparis: minSiparis,
    liste_fiyat: listeFiyat!,
    kdv_orani: kdvOrani!,
    fotograf_url: metinVeyaNull(g.fotografUrl),
  };
}

async function kodTekrariniDenetle(vt: KapsamliDb, firmaId: number, kod: string, haricId?: number) {
  const varolan = await vt.urun.findFirst({
    where: { firma_id: firmaId, kod: { equals: kod, mode: "insensitive" }, ...(haricId ? { NOT: { id: haricId } } : {}) },
    select: { kod: true, ad: true },
  });
  if (varolan) {
    throw new GirisHatasi({ kod: `Bu tedarikçide "${varolan.kod}" kodlu ürün zaten var (${varolan.ad}).` });
  }
}

/** Yeni ürün. Dönüş: ürün kimliği. */
export async function urunOlustur(vt: KapsamliDb, aktor: Aktor, firmaId: number, girdi: unknown): Promise<number> {
  adminGerekli(aktor);
  const veri = urunVerisi(girdi, null);
  const firma = await vt.firma.findUnique({ where: { id: firmaId }, select: { tip: true } });
  if (!firma || firma.tip === "alici") throw new GirisHatasi({ firmaId: "Tedarikçi firma seçin." });
  await kodTekrariniDenetle(vt, firmaId, veri.kod);
  const u = await vt.urun.create({ data: { ...veri, firma_id: firmaId }, select: { id: true } });
  return u.id;
}

/** Ürün düzenleme. Tedarikçi değiştirilemez. */
export async function urunGuncelle(vt: KapsamliDb, aktor: Aktor, id: number, girdi: unknown): Promise<void> {
  adminGerekli(aktor);
  const mevcut = await vt.urun.findUnique({ where: { id }, select: { firma_id: true, kdv_orani: true } });
  if (!mevcut) throw new IslemHatasi("Ürün bulunamadı.");
  const veri = urunVerisi(girdi, dbOran(mevcut.kdv_orani));
  await kodTekrariniDenetle(vt, mevcut.firma_id, veri.kod, id);
  await vt.urun.update({ where: { id }, data: veri });
}

/** Aktif / pasif. Silme yoktur; pasif ürün katalogda görünmez, admin listesinde kalır. */
export async function urunDurumDegistir(vt: KapsamliDb, aktor: Aktor, id: number, aktif: boolean): Promise<void> {
  adminGerekli(aktor);
  const r = await vt.urun.updateMany({ where: { id, aktif: !aktif }, data: { aktif } });
  if (r.count !== 1) {
    const varMi = await vt.urun.count({ where: { id } });
    throw new IslemHatasi(varMi ? `Ürün zaten ${aktif ? "aktif" : "pasif"}.` : "Ürün bulunamadı.");
  }
}

/** Otomatik tamamlama: mevcut kategoriler ve birimler (tekrarsız, alfabetik). */
export async function urunOnerileri(vt: KapsamliDb, aktor: Aktor): Promise<{ kategoriler: string[]; birimler: string[] }> {
  adminGerekli(aktor);
  const [k, b] = await Promise.all([
    vt.urun.findMany({ where: { kategori: { not: null } }, distinct: ["kategori"], select: { kategori: true } }),
    vt.urun.findMany({ distinct: ["birim"], select: { birim: true } }),
  ]);
  const sirala = (a: string[]) => a.sort((x, y) => x.localeCompare(y, "tr"));
  return {
    kategoriler: sirala(k.flatMap((x) => (x.kategori ? [x.kategori] : []))),
    birimler: sirala([...new Set(["adet", "kg", "koli", "paket", "lt", ...b.map((x) => x.birim)])]),
  };
}

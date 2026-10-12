import { z } from "zod";
import { GirisHatasi, alanHatasi, metinVeyaNull } from "@/lib/admin/eylem";
import { KDV_ORANLARI } from "@/lib/kdv";
import { dbMiktar, dbOran, dbPara, miktarOku, paraOku } from "@/lib/money";
import type { Db } from "@/lib/db";

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

async function kodTekrariniDenetle(vt: Db, kod: string, haricId?: number) {
  const varolan = await vt.urun.findFirst({
    where: { kod: { equals: kod, mode: "insensitive" }, ...(haricId ? { NOT: { id: haricId } } : {}) },
    select: { kod: true, ad: true },
  });
  if (varolan) {
    throw new GirisHatasi({ kod: `"${varolan.kod}" kodlu ürün zaten var (${varolan.ad}).` });
  }
}

export async function urunOlustur(vt: Db, girdi: unknown): Promise<number> {
  const veri = urunVerisi(girdi, null);
  await kodTekrariniDenetle(vt, veri.kod);
  const u = await vt.urun.create({ data: veri, select: { id: true } });
  return u.id;
}

export async function urunGuncelle(vt: Db, id: number, girdi: unknown): Promise<void> {
  const mevcut = await vt.urun.findUnique({ where: { id }, select: { kdv_orani: true } });
  if (!mevcut) throw new Error("Ürün bulunamadı.");
  const veri = urunVerisi(girdi, dbOran(mevcut.kdv_orani));
  await kodTekrariniDenetle(vt, veri.kod, id);
  await vt.urun.update({ where: { id }, data: veri });
}

export async function urunDurumDegistir(vt: Db, id: number, aktif: boolean): Promise<void> {
  const r = await vt.urun.updateMany({ where: { id, aktif: !aktif }, data: { aktif } });
  if (r.count !== 1) {
    const varMi = await vt.urun.count({ where: { id } });
    throw new Error(varMi ? `Ürün zaten ${aktif ? "aktif" : "pasif"}.` : "Ürün bulunamadı.");
  }
}

export async function urunSil(vt: Db, id: number): Promise<void> {
  await vt.urun.delete({ where: { id } });
}

export async function urunOnerileri(vt: Db): Promise<{ kategoriler: string[]; birimler: string[] }> {
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

// Katalog sorguları (alıcı ve tedarikçi ekranları). Kapsamlı istemciyle çalışır:
//   - Alıcı: kapsam katmanı yalnız aktif tedarikçilerin aktif ürünlerini döndürür; tedarikçiden
//     yalnız vitrin alanları (ünvan, adres, telefon) seçilebilir, vergi no hiç seçilmez.
//   - Tedarikçi: kapsam katmanı yalnız kendi ürünlerini (pasifler dahil) döndürür.
// Para değerleri string döner; KDV dahil fiyat lib/money.ts ile hesaplanır.

import { z } from "zod";
import { urunAramaKosulu } from "@/lib/arama";
import { dbOran, dbPara, satirHesapla } from "@/lib/money";
import type { Aktor, KapsamliDb } from "@/lib/scope-cekirdek";
import { YetkiHatasi } from "@/lib/scope-cekirdek";

export const KATALOG_SAYFA_BOYU = 24;

type Arama = Record<string, string | string[] | undefined>;
const tek = (sp: Arama) => Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

const filtreSemasi = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  tedarikci: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().positive().optional()).catch(undefined),
  kategori: z.string().trim().max(100).optional().catch(undefined),
  sayfa: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().positive().optional()).catch(undefined),
});
export type KatalogFiltresi = z.infer<typeof filtreSemasi>;
export const katalogFiltresiOku = (sp: Arama): KatalogFiltresi => filtreSemasi.parse(tek(sp));

export type KatalogUrunu = {
  id: number;
  kod: string;
  ad: string;
  kategori: string | null;
  birim: string;
  /** KDV hariç, "389.90" */
  listeFiyat: string;
  kdvOrani: string;
  kdvDahil: string;
  fotografUrl: string | null;
  tedarikci: string;
  tedarikciId: number;
  aktif: boolean;
};

function katalogaYetkili(aktor: Aktor) {
  if (aktor.tip !== "alici" && aktor.tip !== "tedarikci") throw new YetkiHatasi("Katalog alıcı ve tedarikçi içindir.");
}

const URUN_SECIMI = {
  id: true,
  kod: true,
  ad: true,
  kategori: true,
  birim: true,
  liste_fiyat: true,
  kdv_orani: true,
  fotograf_url: true,
  aktif: true,
  firma_id: true,
  // Vitrin alanları: alıcı için kapsam katmanı bunun dışını zaten reddeder.
  firma: { select: { unvan: true } },
} as const;

type UrunKaydi = {
  id: number;
  kod: string;
  ad: string;
  kategori: string | null;
  birim: string;
  liste_fiyat: { toString(): string };
  kdv_orani: { toString(): string };
  fotograf_url: string | null;
  aktif: boolean;
  firma_id: number;
  firma: { unvan: string };
};

function donustur(u: UrunKaydi): KatalogUrunu {
  const s = satirHesapla({ adet: "1", birim: "adet", birimFiyat: u.liste_fiyat, kdvOrani: u.kdv_orani });
  return {
    id: u.id,
    kod: u.kod,
    ad: u.ad,
    kategori: u.kategori,
    birim: u.birim,
    listeFiyat: dbPara(u.liste_fiyat),
    kdvOrani: dbOran(u.kdv_orani),
    kdvDahil: dbPara(s.kdvDahil),
    fotografUrl: u.fotograf_url,
    tedarikci: u.firma.unvan,
    tedarikciId: u.firma_id,
    aktif: u.aktif,
  };
}

export async function katalogListesi(vt: KapsamliDb, aktor: Aktor, f: KatalogFiltresi) {
  katalogaYetkili(aktor);
  const ve: object[] = [];
  const arama = f.q ? urunAramaKosulu(f.q) : null;
  if (arama) ve.push(arama);
  if (f.tedarikci) ve.push({ firma_id: f.tedarikci });
  if (f.kategori) ve.push({ kategori: f.kategori });
  const where = ve.length ? { AND: ve } : {};
  const sayfa = f.sayfa ?? 1;
  const [toplam, kayitlar] = await Promise.all([
    vt.urun.count({ where }),
    vt.urun.findMany({
      where,
      orderBy: [{ ad: "asc" }, { id: "asc" }],
      skip: (sayfa - 1) * KATALOG_SAYFA_BOYU,
      take: KATALOG_SAYFA_BOYU,
      select: URUN_SECIMI,
    }),
  ]);
  // eslint-disable-next-line no-restricted-syntax -- sayfa sayısı, para değil
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / KATALOG_SAYFA_BOYU));
  return { urunler: kayitlar.map(donustur), toplam, sayfa, sayfaSayisi };
}

/** Filtre seçenekleri: görünür ürünü olan tedarikçiler ve kategoriler. */
export async function katalogSecenekleri(vt: KapsamliDb, aktor: Aktor) {
  katalogaYetkili(aktor);
  const [t, k] = await Promise.all([
    vt.urun.findMany({ distinct: ["firma_id"], select: { firma_id: true, firma: { select: { unvan: true } } } }),
    vt.urun.findMany({ where: { kategori: { not: null } }, distinct: ["kategori"], select: { kategori: true } }),
  ]);
  return {
    tedarikciler: t.map((x) => ({ id: x.firma_id, unvan: x.firma.unvan })).sort((a, b) => a.unvan.localeCompare(b.unvan, "tr")),
    kategoriler: k.flatMap((x) => (x.kategori ? [x.kategori] : [])).sort((a, b) => a.localeCompare(b, "tr")),
  };
}

export type KatalogDetayi = KatalogUrunu & {
  aciklama: string | null;
  koliAdedi: number | null;
  minSiparis: string | null;
  tedarikciBilgisi: { unvan: string; adres: string | null; telefon: string | null };
};

/** Ürün detayı. Kapsam dışı (pasif ürün, başka tedarikçinin ürünü) → null. */
export async function katalogDetayi(vt: KapsamliDb, aktor: Aktor, id: number): Promise<KatalogDetayi | null> {
  katalogaYetkili(aktor);
  const u = await vt.urun.findUnique({
    where: { id },
    select: {
      ...URUN_SECIMI,
      aciklama: true,
      koli_adedi: true,
      min_siparis: true,
      firma: { select: { unvan: true, adres: true, telefon: true } },
    },
  });
  if (!u) return null;
  return {
    ...donustur(u),
    aciklama: u.aciklama,
    koliAdedi: u.koli_adedi,
    minSiparis: u.min_siparis?.toString() ?? null,
    tedarikciBilgisi: { unvan: u.firma.unvan, adres: u.firma.adres, telefon: u.firma.telefon },
  };
}

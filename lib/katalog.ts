import { z } from "zod";
import { dbOran, dbPara, satirHesapla } from "@/lib/money";
import type { Db } from "@/lib/db";

export const KATALOG_SAYFA_BOYU = 24;

type Arama = Record<string, string | string[] | undefined>;
const tek = (sp: Arama) => Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

const filtreSemasi = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
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
  listeFiyat: string;
  kdvOrani: string;
  kdvDahil: string;
  fotografUrl: string | null;
  aktif: boolean;
};

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
    aktif: u.aktif,
  };
}

export async function katalogListesi(vt: Db, f: KatalogFiltresi) {
  const ve: object[] = [{ aktif: true }];
  if (f.q) {
    const q = f.q.toLowerCase();
    ve.push({ OR: [{ ad: { contains: q, mode: "insensitive" } }, { kod: { contains: q, mode: "insensitive" } }] });
  }
  if (f.kategori) ve.push({ kategori: f.kategori });
  const where = { AND: ve };
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
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / KATALOG_SAYFA_BOYU));
  return { urunler: kayitlar.map(donustur), toplam, sayfa, sayfaSayisi };
}

export async function katalogSecenekleri(vt: Db) {
  const k = await vt.urun.findMany({
    where: { aktif: true, kategori: { not: null } },
    distinct: ["kategori"],
    select: { kategori: true },
  });
  return {
    kategoriler: k.flatMap((x) => (x.kategori ? [x.kategori] : [])).sort((a, b) => a.localeCompare(b, "tr")),
  };
}

export type KatalogDetayi = KatalogUrunu & {
  aciklama: string | null;
  koliAdedi: number | null;
  minSiparis: string | null;
};

export async function katalogDetayi(vt: Db, id: number): Promise<KatalogDetayi | null> {
  const u = await vt.urun.findUnique({
    where: { id, aktif: true },
    select: {
      ...URUN_SECIMI,
      aciklama: true,
      koli_adedi: true,
      min_siparis: true,
    },
  });
  if (!u) return null;
  return {
    ...donustur(u),
    aciklama: u.aciklama,
    koliAdedi: u.koli_adedi,
    minSiparis: u.min_siparis?.toString() ?? null,
  };
}

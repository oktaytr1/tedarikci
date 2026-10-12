// Admin listeleri: ürün, firma, kullanıcı. Filtre, arama, sıralama ve sayfalama sunucuda;
// parametreler URL'den okunur, geçersiz değerler yok sayılır. Para değerleri string döner.

import { z } from "zod";
import { urunAramaKosulu } from "@/lib/arama";
import type { FirmaTip, Rol } from "@/generated/prisma/enums";
import { dbOran, dbPara } from "@/lib/money";
import type { Aktor, KapsamliDb } from "@/lib/scope-cekirdek";
import { adminGerekli } from "./ortak";

export const SAYFA_BOYU = 50;

type Arama = Record<string, string | string[] | undefined>;
const tek = (sp: Arama) => Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
const pozitifSayi = z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().int().positive().optional());
const arama = z.string().trim().max(100).optional();
const yon = z.enum(["artan", "azalan"]).optional();

function sayfalama(toplam: number, sayfa: number) {
  // eslint-disable-next-line no-restricted-syntax -- sayfa sayısı, para değil
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / SAYFA_BOYU));
  return { toplam, sayfa, sayfaSayisi };
}

// ---------------------------------------------------------------------------
// Ürünler
// ---------------------------------------------------------------------------

export const URUN_SIRALAMA = ["kod", "ad", "liste_fiyat", "kategori", "guncelleme"] as const;

const urunFiltreSemasi = z.object({
  q: arama.catch(undefined),
  tedarikci: pozitifSayi.catch(undefined),
  kategori: z.string().trim().max(100).optional().catch(undefined),
  durum: z.enum(["aktif", "pasif"]).optional().catch(undefined),
  sirala: z.enum(URUN_SIRALAMA).optional().catch(undefined),
  yon: yon.catch(undefined),
  sayfa: pozitifSayi.catch(undefined),
});
export type UrunFiltresi = z.infer<typeof urunFiltreSemasi>;
export const urunFiltresiOku = (sp: Arama): UrunFiltresi => urunFiltreSemasi.parse(tek(sp));

export type UrunSatiri = {
  id: number;
  kod: string;
  ad: string;
  kategori: string | null;
  birim: string;
  listeFiyat: string;
  kdvOrani: string;
  aktif: boolean;
  tedarikci: string;
  tedarikciPasif: boolean;
  fotografVar: boolean;
};

export async function urunListesi(vt: KapsamliDb, aktor: Aktor, f: UrunFiltresi) {
  adminGerekli(aktor);
  const ve: object[] = [];
  const arama = f.q ? urunAramaKosulu(f.q) : null;
  if (arama) ve.push(arama);
  if (f.tedarikci) ve.push({ firma_id: f.tedarikci });
  if (f.kategori) ve.push({ kategori: f.kategori });
  if (f.durum) ve.push({ aktif: f.durum === "aktif" });
  const where = ve.length ? { AND: ve } : {};
  const sirala = f.sirala ?? "kod";
  const y = f.yon === "azalan" ? "desc" : "asc";
  const sayfa = f.sayfa ?? 1;
  const [toplam, kayitlar] = await Promise.all([
    vt.urun.count({ where }),
    vt.urun.findMany({
      where,
      orderBy: [{ [sirala]: y }, { id: "asc" }],
      skip: (sayfa - 1) * SAYFA_BOYU,
      take: SAYFA_BOYU,
      select: {
        id: true,
        kod: true,
        ad: true,
        kategori: true,
        birim: true,
        liste_fiyat: true,
        kdv_orani: true,
        aktif: true,
        fotograf_url: true,
        firma: { select: { unvan: true, durum: true } },
      },
    }),
  ]);
  const satirlar = kayitlar.map(
    (u): UrunSatiri => ({
      id: u.id,
      kod: u.kod,
      ad: u.ad,
      kategori: u.kategori,
      birim: u.birim,
      listeFiyat: dbPara(u.liste_fiyat),
      kdvOrani: dbOran(u.kdv_orani),
      aktif: u.aktif,
      tedarikci: u.firma.unvan,
      tedarikciPasif: u.firma.durum !== "aktif",
      fotografVar: !!u.fotograf_url,
    }),
  );
  return { satirlar, ...sayfalama(toplam, sayfa) };
}

// ---------------------------------------------------------------------------
// Firmalar
// ---------------------------------------------------------------------------

export const FIRMA_SIRALAMA = ["unvan", "vergi_no", "olusturma"] as const;

const firmaFiltreSemasi = z.object({
  q: arama.catch(undefined),
  tip: z.enum(["tedarikci", "alici", "her_ikisi"]).optional().catch(undefined),
  durum: z.enum(["aktif", "pasif"]).optional().catch(undefined),
  sirala: z.enum(FIRMA_SIRALAMA).optional().catch(undefined),
  yon: yon.catch(undefined),
  sayfa: pozitifSayi.catch(undefined),
});
export type FirmaFiltresi = z.infer<typeof firmaFiltreSemasi>;
export const firmaFiltresiOku = (sp: Arama): FirmaFiltresi => firmaFiltreSemasi.parse(tek(sp));

export type FirmaSatiri = {
  id: number;
  unvan: string;
  vergiNo: string;
  tip: FirmaTip;
  aktif: boolean;
  telefon: string | null;
  kullaniciSayisi: number;
  urunSayisi: number;
};

export async function firmaListesi(vt: KapsamliDb, aktor: Aktor, f: FirmaFiltresi) {
  adminGerekli(aktor);
  const ve: object[] = [];
  if (f.q) ve.push({ OR: [{ unvan: { contains: f.q, mode: "insensitive" } }, { vergi_no: { contains: f.q } }] });
  if (f.tip) ve.push({ tip: f.tip });
  if (f.durum) ve.push({ durum: f.durum });
  const where = ve.length ? { AND: ve } : {};
  const sirala = f.sirala ?? "unvan";
  const y = f.yon === "azalan" ? "desc" : "asc";
  const sayfa = f.sayfa ?? 1;
  const [toplam, kayitlar] = await Promise.all([
    vt.firma.count({ where }),
    vt.firma.findMany({
      where,
      orderBy: [{ [sirala]: y }, { id: "asc" }],
      skip: (sayfa - 1) * SAYFA_BOYU,
      take: SAYFA_BOYU,
      select: {
        id: true,
        unvan: true,
        vergi_no: true,
        tip: true,
        durum: true,
        telefon: true,
        _count: { select: { kullanicilar: true, urunler: true } },
      },
    }),
  ]);
  const satirlar = kayitlar.map(
    (x): FirmaSatiri => ({
      id: x.id,
      unvan: x.unvan,
      vergiNo: x.vergi_no,
      tip: x.tip,
      aktif: x.durum === "aktif",
      telefon: x.telefon,
      kullaniciSayisi: x._count.kullanicilar,
      urunSayisi: x._count.urunler,
    }),
  );
  return { satirlar, ...sayfalama(toplam, sayfa) };
}

// ---------------------------------------------------------------------------
// Kullanıcılar (parola özeti hiçbir zaman seçilmez)
// ---------------------------------------------------------------------------

export const KULLANICI_SIRALAMA = ["email", "rol", "olusturma"] as const;

const kullaniciFiltreSemasi = z.object({
  q: arama.catch(undefined),
  rol: z.enum(["admin", "tedarikci", "alici"]).optional().catch(undefined),
  firma: pozitifSayi.catch(undefined),
  durum: z.enum(["aktif", "pasif"]).optional().catch(undefined),
  sirala: z.enum(KULLANICI_SIRALAMA).optional().catch(undefined),
  yon: yon.catch(undefined),
  sayfa: pozitifSayi.catch(undefined),
});
export type KullaniciFiltresi = z.infer<typeof kullaniciFiltreSemasi>;
export const kullaniciFiltresiOku = (sp: Arama): KullaniciFiltresi => kullaniciFiltreSemasi.parse(tek(sp));

export type KullaniciSatiri = {
  id: number;
  email: string;
  rol: Rol;
  firma: string | null;
  firmaPasif: boolean;
  aktif: boolean;
  olusturma: string;
};

export async function kullaniciListesi(vt: KapsamliDb, aktor: Aktor, f: KullaniciFiltresi) {
  adminGerekli(aktor);
  const ve: object[] = [];
  if (f.q) ve.push({ email: { contains: f.q, mode: "insensitive" } });
  if (f.rol) ve.push({ rol: f.rol });
  if (f.firma) ve.push({ firma_id: f.firma });
  if (f.durum) ve.push({ aktif: f.durum === "aktif" });
  const where = ve.length ? { AND: ve } : {};
  const sirala = f.sirala ?? "email";
  const y = f.yon === "azalan" ? "desc" : "asc";
  const sayfa = f.sayfa ?? 1;
  const [toplam, kayitlar] = await Promise.all([
    vt.kullanici.count({ where }),
    vt.kullanici.findMany({
      where,
      orderBy: [{ [sirala]: y }, { id: "asc" }],
      skip: (sayfa - 1) * SAYFA_BOYU,
      take: SAYFA_BOYU,
      select: { id: true, email: true, rol: true, aktif: true, olusturma: true, firma: { select: { unvan: true, durum: true } } },
    }),
  ]);
  const satirlar = kayitlar.map(
    (k): KullaniciSatiri => ({
      id: k.id,
      email: k.email,
      rol: k.rol,
      firma: k.firma?.unvan ?? null,
      firmaPasif: k.firma ? k.firma.durum !== "aktif" : false,
      aktif: k.aktif,
      olusturma: k.olusturma.toISOString(),
    }),
  );
  return { satirlar, ...sayfalama(toplam, sayfa) };
}

/** Form ve filtre seçenekleri: firmalar (tipine göre süzülebilir). */
export async function firmaSecenekleri(vt: KapsamliDb, aktor: Aktor) {
  adminGerekli(aktor);
  const f = await vt.firma.findMany({
    select: { id: true, unvan: true, tip: true, durum: true },
    orderBy: { unvan: "asc" },
  });
  return f.map((x) => ({ id: x.id, unvan: x.unvan, tip: x.tip, aktif: x.durum === "aktif" }));
}

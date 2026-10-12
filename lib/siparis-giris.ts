// Sipariş girişi ve "girildi" iken düzeltme (bölüm 3).
//
// Tarayıcıdan gelen hiçbir tutara güvenilmez: istemci yalnız ürün, miktar ve birim fiyat gönderir.
// Ürün adı, birimi ve KDV oranı veritabanından satıra KOPYALANIR; satır ve sipariş tutarları
// lib/money.ts ile sunucuda yeniden hesaplanır. KDV oranı siparişte değiştirilemez (ürün düzeltilir).

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import {
  dbMiktar,
  dbOran,
  dbPara,
  miktarOku,
  oranOku,
  paraOku,
  satirHesapla,
  siparisToplamlari,
  type SatirSonucu,
} from "@/lib/money";
import type { Aktor, KapsamliDb } from "@/lib/scope-cekirdek";
import { siparisDuzenlemeDenetle } from "@/lib/siparis-durum";
import { GirisHatasi, IslemHatasi } from "@/lib/hatalar";
import { gecerliGunMu, gunEkle, gunTarih } from "@/lib/tarih";

export const EN_FAZLA_SATIR = 200;
export const EN_FAZLA_VADE_GUN = 365;

const satirSemasi = z.object({
  /** Düzenlemede mevcut satırın kimliği; yeni satırda yok. */
  satirId: z.number().int().positive().optional(),
  urunId: z.number().int().positive(),
  adet: z.string().trim().min(1, "Miktar zorunlu."),
  birimFiyat: z.string().trim().min(1, "Birim fiyat zorunlu."),
});

export const siparisGirdiSemasi = z
  .object({
    aliciFirmaId: z.number({ message: "Alıcı seçin." }).int().positive("Alıcı seçin."),
    saticiFirmaId: z.number({ message: "Tedarikçi seçin." }).int().positive("Tedarikçi seçin."),
    tarih: z.string().refine(gecerliGunMu, "Sipariş tarihi geçersiz."),
    odemeTipi: z.enum(["pesin", "vadeli"]),
    vadeGun: z.string().trim(),
    /** Zorunlu; boş ile "0" farklıdır. */
    komisyonOran: z.string(),
    satirlar: z
      .array(satirSemasi)
      .min(1, "En az bir satır girin.")
      .max(EN_FAZLA_SATIR, `En fazla ${EN_FAZLA_SATIR} satır girilebilir.`),
  })
  .superRefine((g, ctx) => {
    if (g.aliciFirmaId === g.saticiFirmaId) {
      ctx.addIssue({ code: "custom", path: ["saticiFirmaId"], message: "Alıcı ve tedarikçi aynı firma olamaz." });
    }
    if (g.odemeTipi === "vadeli") {
      const n = Number(g.vadeGun);
      if (!/^\d+$/.test(g.vadeGun) || n < 1 || n > EN_FAZLA_VADE_GUN) {
        ctx.addIssue({ code: "custom", path: ["vadeGun"], message: `Vade 1–${EN_FAZLA_VADE_GUN} gün arasında bir tamsayı olmalı.` });
      }
    }
  });

export type SiparisGirdisi = z.infer<typeof siparisGirdiSemasi>;

export { GirisHatasi };

type UrunKaydi = {
  id: number;
  firma_id: number;
  ad: string;
  birim: string;
  kdv_orani: Prisma.Decimal;
  aktif: boolean;
};

type HesaplanmisSatir = SatirSonucu & { satirId?: number; urunId: number; ad: string; birim: string };

/** Girdiyi doğrular ve hesaplar; tüm alan hatalarını birlikte toplar. */
function dogrulaVeHesapla(
  hamGirdi: unknown,
  urunler: Map<number, UrunKaydi>,
  mevcutSatirlar: Map<number, { urun_id: number; ad: string; birim: string; kdv_orani: Prisma.Decimal }>,
) {
  const p = siparisGirdiSemasi.safeParse(hamGirdi);
  const hatalar: Record<string, string> = {};

  // Komisyon şemadan bağımsız denetlenir: şema hatası olsa da kullanıcı tüm hataları birlikte görsün.
  const hamKomisyon = (hamGirdi as { komisyonOran?: unknown } | null)?.komisyonOran;
  let komisyonOran;
  try {
    komisyonOran = oranOku(typeof hamKomisyon === "string" ? hamKomisyon : "");
  } catch (e) {
    hatalar.komisyonOran =
      typeof hamKomisyon !== "string" || hamKomisyon.trim() === ""
        ? "Komisyon oranı zorunlu (komisyonsuz iş için 0 girin)."
        : (e as Error).message;
  }

  if (!p.success) {
    for (const i of p.error.issues) hatalar[i.path.join(".") || "genel"] ??= i.message;
    throw new GirisHatasi(hatalar);
  }
  const g = p.data;

  const satirlar: HesaplanmisSatir[] = [];
  g.satirlar.forEach((s, i) => {
    // Mevcut satır: kopyalanmış ad/birim/KDV korunur (ürün sonradan değişmiş olabilir).
    const mevcut = s.satirId !== undefined ? mevcutSatirlar.get(s.satirId) : undefined;
    if (s.satirId !== undefined && !mevcut) {
      hatalar[`satirlar.${i}.urunId`] = "Satır bu siparişe ait değil ya da iptal edilmiş.";
      return;
    }
    if (mevcut && mevcut.urun_id !== s.urunId) {
      hatalar[`satirlar.${i}.urunId`] = "Mevcut satırın ürünü değiştirilemez; satırı iptal edip yenisini ekleyin.";
      return;
    }
    const urun = urunler.get(s.urunId);
    if (!mevcut && (!urun || urun.firma_id !== g.saticiFirmaId)) {
      hatalar[`satirlar.${i}.urunId`] = "Ürün bu tedarikçiye ait değil.";
      return;
    }
    if (!mevcut && urun && !urun.aktif) {
      hatalar[`satirlar.${i}.urunId`] = `"${urun.ad}" pasif; yeni satırda seçilemez.`;
      return;
    }
    const kaynak = mevcut ?? urun!;
    try {
      const adet = miktarOku(s.adet, kaynak.birim);
      let birimFiyat;
      try {
        birimFiyat = paraOku(s.birimFiyat);
      } catch (e) {
        hatalar[`satirlar.${i}.birimFiyat`] = (e as Error).message;
        return;
      }
      if (birimFiyat.isNegative()) {
        hatalar[`satirlar.${i}.birimFiyat`] = "Birim fiyat negatif olamaz.";
        return;
      }
      satirlar.push({
        ...satirHesapla({ adet, birim: kaynak.birim, birimFiyat, kdvOrani: kaynak.kdv_orani }),
        satirId: s.satirId,
        urunId: s.urunId,
        ad: kaynak.ad,
        birim: kaynak.birim,
      });
    } catch (e) {
      hatalar[`satirlar.${i}.adet`] = (e as Error).message;
    }
  });

  if (Object.keys(hatalar).length) throw new GirisHatasi(hatalar);
  const toplamlar = siparisToplamlari(satirlar, komisyonOran!);
  const vadeGun = g.odemeTipi === "vadeli" ? Number(g.vadeGun) : null;
  return {
    g,
    satirlar,
    toplamlar,
    vadeGun,
    vadeTarihi: vadeGun === null ? null : gunTarih(gunEkle(g.tarih, vadeGun)),
  };
}

async function firmalariDogrula(vt: KapsamliDb, aliciId: number, saticiId: number) {
  const firmalar = await vt.firma.findMany({
    where: { id: { in: [aliciId, saticiId] } },
    select: { id: true, tip: true, durum: true, unvan: true },
  });
  const alici = firmalar.find((f) => f.id === aliciId);
  const satici = firmalar.find((f) => f.id === saticiId);
  const hatalar: Record<string, string> = {};
  if (!alici || alici.tip === "tedarikci") hatalar.aliciFirmaId = "Alıcı firma geçersiz.";
  else if (alici.durum !== "aktif") hatalar.aliciFirmaId = `${alici.unvan} pasif.`;
  if (!satici || satici.tip === "alici") hatalar.saticiFirmaId = "Tedarikçi firma geçersiz.";
  else if (satici.durum !== "aktif") hatalar.saticiFirmaId = `${satici.unvan} pasif.`;
  if (Object.keys(hatalar).length) throw new GirisHatasi(hatalar);
}

async function urunleriGetir(vt: KapsamliDb, girdi: unknown): Promise<Map<number, UrunKaydi>> {
  const idler = (siparisGirdiSemasi.safeParse(girdi).data?.satirlar ?? []).map((s) => s.urunId);
  const urunler = await vt.urun.findMany({
    where: { id: { in: idler } },
    select: { id: true, firma_id: true, ad: true, birim: true, kdv_orani: true, aktif: true },
  });
  return new Map(urunler.map((u) => [u.id, u]));
}

function siparisBaslik(h: ReturnType<typeof dogrulaVeHesapla>) {
  return {
    alici_firma_id: h.g.aliciFirmaId,
    tarih: gunTarih(h.g.tarih),
    odeme_tipi: h.g.odemeTipi,
    vade_gun: h.vadeGun,
    vade_tarihi: h.vadeTarihi,
    ara_toplam: dbPara(h.toplamlar.araToplam),
    kdv_toplam: dbPara(h.toplamlar.kdvToplam),
    genel_toplam: dbPara(h.toplamlar.genelToplam),
    komisyon_oran: dbOran(h.toplamlar.komisyonOran),
    komisyon_tutar: dbPara(h.toplamlar.komisyonTutar),
  };
}

function satirVerisi(s: HesaplanmisSatir) {
  return {
    adet: dbMiktar(s.adet, s.birim),
    birim_fiyat: dbPara(s.birimFiyat),
    kdv_tutar: dbPara(s.kdvTutar),
    satir_toplam: dbPara(s.satirToplam),
  };
}

/** Yeni sipariş (yalnız admin). Dönüş: sipariş no. */
export async function siparisOlustur(vt: KapsamliDb, aktor: Aktor, girdi: unknown): Promise<number> {
  if (aktor.tip !== "admin") throw new IslemHatasi("Siparişi yalnız admin girer.");
  const urunler = await urunleriGetir(vt, girdi);
  const h = dogrulaVeHesapla(girdi, urunler, new Map());
  await firmalariDogrula(vt, h.g.aliciFirmaId, h.g.saticiFirmaId);

  const s = await vt.siparis.create({
    data: {
      ...siparisBaslik(h),
      satici_firma_id: h.g.saticiFirmaId,
      satirlar: {
        create: h.satirlar.map((x) => ({
          urun_id: x.urunId,
          ad: x.ad,
          birim: x.birim,
          kdv_orani: dbOran(x.kdvOrani),
          ...satirVerisi(x),
        })),
      },
    },
    select: { id: true },
  });
  return s.id;
}

/**
 * "Girildi" iken düzeltme: girdideki satırlar siparişin yeni hâlidir.
 *   - satirId'li satır: miktar/fiyat güncellenir (ad, birim, KDV kopyası korunur)
 *   - satirId'siz satır: üründen yeni satır
 *   - girdide olmayan mevcut satır: iptal edilir (silinmez)
 * Tedarikçi değiştirilemez (yeni sipariş girilir).
 */
export async function siparisGuncelle(vt: KapsamliDb, aktor: Aktor, id: number, girdi: unknown): Promise<void> {
  const mevcut = await vt.siparis.findUnique({
    where: { id },
    select: {
      durum: true,
      iptal_mi: true,
      satici_firma_id: true,
      satirlar: {
        where: { iptal_mi: false },
        select: { id: true, urun_id: true, ad: true, birim: true, kdv_orani: true, adet: true, birim_fiyat: true },
      },
    },
  });
  if (!mevcut) throw new IslemHatasi("Sipariş bulunamadı.");
  const k = siparisDuzenlemeDenetle(aktor.tip, mevcut);
  if (!k.izin) throw new IslemHatasi(k.neden);

  const ham = siparisGirdiSemasi.safeParse(girdi).data;
  if (ham && ham.saticiFirmaId !== mevcut.satici_firma_id) {
    throw new GirisHatasi({ saticiFirmaId: "Kayıtlı siparişin tedarikçisi değiştirilemez; yeni sipariş girin." });
  }

  const urunler = await urunleriGetir(vt, girdi);
  const h = dogrulaVeHesapla(girdi, urunler, new Map(mevcut.satirlar.map((s) => [s.id, s])));
  await firmalariDogrula(vt, h.g.aliciFirmaId, h.g.saticiFirmaId);

  const kalan = new Set(h.satirlar.flatMap((s) => (s.satirId ? [s.satirId] : [])));
  for (const s of mevcut.satirlar) {
    if (!kalan.has(s.id)) await vt.siparisSatir.update({ where: { id: s.id }, data: { iptal_mi: true } });
  }
  for (const s of h.satirlar) {
    if (s.satirId) {
      const eski = mevcut.satirlar.find((x) => x.id === s.satirId)!;
      const yeni = satirVerisi(s);
      if (dbMiktar(eski.adet, eski.birim) !== yeni.adet || dbPara(eski.birim_fiyat) !== yeni.birim_fiyat) {
        await vt.siparisSatir.update({ where: { id: s.satirId }, data: yeni });
      }
    } else {
      await vt.siparisSatir.create({
        data: { siparis_id: id, urun_id: s.urunId, ad: s.ad, birim: s.birim, kdv_orani: dbOran(s.kdvOrani), ...satirVerisi(s) },
      });
    }
  }
  const r = await vt.siparis.updateMany({ where: { id, durum: "girildi", iptal_mi: false }, data: siparisBaslik(h) });
  if (r.count !== 1) throw new IslemHatasi("Sipariş bu arada başka biri tarafından değiştirildi; sayfayı yenileyin.");
}

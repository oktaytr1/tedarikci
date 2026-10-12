// Para, miktar ve KDV hesabının TEK yeri.
//
// Kurallar:
//   - Para numeric(18,2): 2 hane, en fazla 16 tam hane.
//   - Miktar (adet) numeric(18,3); birim "adet" ise tamsayı.
//   - Fiyatlar KDV HARİÇ.
//   - KDV satır bazında: net = yuvarla(adet × birim_fiyat), kdv = yuvarla(net × oran / 100).
//   - Sipariş toplamları yuvarlanmış satırların toplamıdır; toplam üzerinden KDV yeniden hesaplanmaz.
//   - Komisyon matrahı ara_toplam (KDV hariç).
//   - Yuvarlama: 2 hane, yarım yukarı (ROUND_HALF_UP; 0,005 → 0,01).
//
// Bu dosya dışında para üzerinde çarpma/bölme/yuvarlama yapılmaz (ESLint ile zorlanır).
// Prisma'ya ve Prisma'dan değer geçişi string üzerinden yapılır; bu modül tarayıcıda da çalışır.

import DecimalBase from "decimal.js";

const Decimal = DecimalBase.clone({ precision: 40, rounding: DecimalBase.ROUND_HALF_UP });
type Decimal = InstanceType<typeof Decimal>;

/** Para ya da oran olarak kabul edilen girdi. Prisma.Decimal da toString() ile buraya girer. */
export type Sayi = string | number | { toString(): string };

export { Decimal };

const PARA_HANE = 2;
const MIKTAR_HANE = 3;
const PARA_UST_SINIR = new Decimal("1e16"); // numeric(18,2) → 16 tam hane
const MIKTAR_UST_SINIR = new Decimal("1e15"); // numeric(18,3) → 15 tam hane

export class ParaHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "ParaHatasi";
  }
}

function d(x: Sayi): Decimal {
  if (typeof x === "number" && !Number.isFinite(x)) throw new ParaHatasi(`Geçersiz sayı: ${x}`);
  // number girdi yalnız tamsayı/sabit değerler için kabul edilir; ondalıklı para string gelmeli.
  if (typeof x === "number" && !Number.isInteger(x)) {
    throw new ParaHatasi(`Ondalıklı değer number olarak verilemez, string kullanın: ${x}`);
  }
  try {
    return new Decimal(x.toString());
  } catch {
    throw new ParaHatasi(`Sayı okunamadı: ${String(x)}`);
  }
}

function paraSiniri(x: Decimal, ad: string): Decimal {
  if (x.abs().gte(PARA_UST_SINIR)) throw new ParaHatasi(`${ad} numeric(18,2) sınırını aşıyor: ${x.toFixed()}`);
  return x;
}

/** Para yuvarlaması: 2 hane, yarım yukarı. */
export function yuvarla(x: Sayi): Decimal {
  return paraSiniri(d(x).toDecimalPlaces(PARA_HANE, Decimal.ROUND_HALF_UP), "Tutar");
}

/** Saklanacak para değeri; 2 haneden fazlası hatadır (sessizce yuvarlanmaz). */
export function para(x: Sayi): Decimal {
  const v = d(x);
  if (v.decimalPlaces() > PARA_HANE) throw new ParaHatasi(`Para en fazla 2 ondalık hane alır: ${v.toFixed()}`);
  return paraSiniri(v, "Tutar");
}

/** KDV / komisyon oranı (yüzde). 0–100, en fazla 2 hane. */
export function oran(x: Sayi): Decimal {
  const v = d(x);
  if (v.isNegative() || v.gt(100)) throw new ParaHatasi(`Oran 0 ile 100 arasında olmalı: ${v.toFixed()}`);
  if (v.decimalPlaces() > 2) throw new ParaHatasi(`Oran en fazla 2 ondalık hane alır: ${v.toFixed()}`);
  return v;
}

/** Miktar: pozitif, en fazla 3 hane; birim "adet" ise tamsayı. */
export function miktar(x: Sayi, birim: string): Decimal {
  const v = d(x);
  if (!v.isPositive() || v.isZero()) throw new ParaHatasi(`Miktar sıfırdan büyük olmalı: ${v.toFixed()}`);
  if (v.decimalPlaces() > MIKTAR_HANE) throw new ParaHatasi(`Miktar en fazla 3 ondalık hane alır: ${v.toFixed()}`);
  if (v.gte(MIKTAR_UST_SINIR)) throw new ParaHatasi(`Miktar numeric(18,3) sınırını aşıyor: ${v.toFixed()}`);
  if (birimTamsayiMi(birim) && !v.isInteger()) {
    throw new ParaHatasi(`"${birim}" biriminde miktar tamsayı olmalı: ${v.toFixed()}`);
  }
  return v;
}

export function birimTamsayiMi(birim: string): boolean {
  return birim.trim().toLocaleLowerCase("tr-TR") === "adet";
}

// ---------------------------------------------------------------------------
// Satır ve sipariş hesabı
// ---------------------------------------------------------------------------

export type SatirGirdisi = {
  adet: Sayi;
  birim: string;
  birimFiyat: Sayi; // KDV hariç
  kdvOrani: Sayi; // yüzde
};

export type SatirSonucu = {
  adet: Decimal;
  birimFiyat: Decimal;
  kdvOrani: Decimal;
  /** KDV hariç net = siparis_satir.satir_toplam */
  satirToplam: Decimal;
  kdvTutar: Decimal;
  /** KDV dahil (yalnız gösterim için; saklanmaz) */
  kdvDahil: Decimal;
};

export function satirHesapla(g: SatirGirdisi): SatirSonucu {
  const adet = miktar(g.adet, g.birim);
  const birimFiyat = para(g.birimFiyat);
  if (birimFiyat.isNegative()) throw new ParaHatasi("Birim fiyat negatif olamaz.");
  const kdvOrani = oran(g.kdvOrani);

  const satirToplam = yuvarla(adet.mul(birimFiyat));
  const kdvTutar = yuvarla(satirToplam.mul(kdvOrani).div(100));
  return { adet, birimFiyat, kdvOrani, satirToplam, kdvTutar, kdvDahil: satirToplam.plus(kdvTutar) };
}

export type SiparisToplamlari = {
  araToplam: Decimal;
  kdvToplam: Decimal;
  genelToplam: Decimal;
  komisyonOran: Decimal;
  komisyonTutar: Decimal;
  /** KDV oranına göre döküm (fatura görünümü için). Anahtar: oran, ör. "20.00". */
  kdvDokumu: Map<string, { matrah: Decimal; kdv: Decimal }>;
};

export function siparisToplamlari(
  satirlar: ReadonlyArray<Pick<SatirSonucu, "satirToplam" | "kdvTutar" | "kdvOrani">>,
  komisyonOran: Sayi,
): SiparisToplamlari {
  let araToplam = new Decimal(0);
  let kdvToplam = new Decimal(0);
  const kdvDokumu = new Map<string, { matrah: Decimal; kdv: Decimal }>();

  for (const s of satirlar) {
    araToplam = araToplam.plus(s.satirToplam);
    kdvToplam = kdvToplam.plus(s.kdvTutar);
    const anahtar = new Decimal(s.kdvOrani.toString()).toFixed(2);
    const onceki = kdvDokumu.get(anahtar) ?? { matrah: new Decimal(0), kdv: new Decimal(0) };
    kdvDokumu.set(anahtar, { matrah: onceki.matrah.plus(s.satirToplam), kdv: onceki.kdv.plus(s.kdvTutar) });
  }

  const ko = oran(komisyonOran);
  return {
    araToplam: paraSiniri(araToplam, "Ara toplam"),
    kdvToplam: paraSiniri(kdvToplam, "KDV toplamı"),
    genelToplam: paraSiniri(araToplam.plus(kdvToplam), "Genel toplam"),
    komisyonOran: ko,
    komisyonTutar: komisyonHesapla(araToplam, ko),
    kdvDokumu,
  };
}

/** Komisyon: matrah ara_toplam (KDV hariç), sonuç yuvarlanır. */
export function komisyonHesapla(araToplam: Sayi, komisyonOran: Sayi): Decimal {
  return yuvarla(d(araToplam).mul(oran(komisyonOran)).div(100));
}

/** Elle girilen fatura tutarı sipariş genel toplamıyla aynı mı? Boşsa karşılaştırma yapılmaz (true). */
export function faturaTutarUyusuyorMu(faturaTutar: Sayi | null | undefined, genelToplam: Sayi): boolean {
  if (faturaTutar === null || faturaTutar === undefined) return true;
  return d(faturaTutar).eq(d(genelToplam));
}

export function esitMi(a: Sayi, b: Sayi): boolean {
  return d(a).eq(d(b));
}

// ---------------------------------------------------------------------------
// Veritabanı ve arayüz dönüşümleri
// ---------------------------------------------------------------------------

/** Prisma'ya yazılacak para değeri: "1234.50" */
export function dbPara(x: Sayi): string {
  return para(x).toFixed(PARA_HANE);
}

/** Prisma'ya yazılacak miktar: "2.500" */
export function dbMiktar(x: Sayi, birim: string): string {
  return miktar(x, birim).toFixed(MIKTAR_HANE);
}

export function dbOran(x: Sayi): string {
  return oran(x).toFixed(2);
}

const TR_PARA = /^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$|^-?\d+(,\d{1,2})?$/;

/**
 * Türkçe biçimli para girdisini okur: "1.234,56", "1234,56", "1234".
 * Nokta binlik ayırıcı, virgül ondalık ayırıcıdır. 2 haneden fazla ondalık reddedilir.
 */
export function paraOku(girdi: string): Decimal {
  const s = girdi.trim().replace(/\s/g, "");
  if (!TR_PARA.test(s)) throw new ParaHatasi(`Tutar biçimi geçersiz: "${girdi}" (ör. 1.234,56)`);
  return para(s.replace(/\./g, "").replace(",", "."));
}

/** Gösterim: "1.234,56" (para birimi simgesi olmadan). Değer önceden 2 haneye indirgenmiş olmalı. */
export function paraYaz(x: Sayi): string {
  const v = para(x);
  // number'a çevirmeden biçimlenir (2^53 üstünde kesinlik kaybı olmasın diye BigInt).
  const [tam, ondalik] = v.abs().toFixed(PARA_HANE).split(".");
  const tamYazi = BigInt(tam).toLocaleString("tr-TR");
  return `${v.isNegative() ? "-" : ""}${tamYazi},${ondalik}`;
}

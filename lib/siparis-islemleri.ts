// Sipariş durum ve yaşam döngüsü servisleri (bölüm 6).
//
// Her servis `denetimli()` içinde çağrılır: (vt, aktor) oradan gelir, böylece işlem tek
// transaction'da ve denetim kaydıyla yürür. Kararlar lib/siparis-durum.ts'ten alınır;
// veritabanı tetikleyicileri aynı kuralları ayrıca zorlar.
//
//   await denetimli(ISLEM.sevk, (vt, a) => sevkEt(vt, a, id, fatura));

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { OdemeYontemi } from "@/generated/prisma/enums";
import { dbPara, paraOku } from "@/lib/money";
import { ONAY_GECERLILIK_GUN, onayTokenUret } from "@/lib/onay-token";
import type { Aktor, KapsamliDb } from "@/lib/scope-cekirdek";
import {
  faturaDuzenlemeDenetle,
  gecisDenetle,
  odemeEklemeDenetle,
  odemeIptalDenetle,
  onayBaglantisiDenetle,
  siparisIptalDenetle,
  type Karar,
  type SiparisBaglami,
} from "@/lib/siparis-durum";
import { gecerliGunMu, gunTarih, tarihGun } from "@/lib/tarih";

/** Denetim kaydındaki işlem adları. Sipariş detayındaki durum geçmişi bunlardan okunur. */
export const ISLEM = {
  olustur: "siparis.olustur",
  guncelle: "siparis.guncelle",
  tedarikciOnayi: "siparis.tedarikci_onayi",
  sevk: "siparis.sevk",
  fatura: "siparis.fatura",
  odendi: "siparis.odendi",
  iptal: "siparis.iptal",
  odemeEkle: "odeme.ekle",
  odemeIptal: "odeme.iptal",
  onayBaglantisi: "onay.baglanti_uret",
} as const;

export class IslemHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "IslemHatasi";
  }
}

function zorunlu(k: Karar): void {
  if (!k.izin) throw new IslemHatasi(k.neden);
}

async function baglamGetir(vt: KapsamliDb, aktor: Aktor, id: number, onayGerekli = false) {
  const s = await vt.siparis.findUnique({
    where: { id },
    select: {
      id: true,
      durum: true,
      iptal_mi: true,
      fatura_no: true,
      fatura_tutar: true,
      genel_toplam: true,
      alici_firma_id: true,
      satici_firma_id: true,
      odemeler: { select: { tutar: true, iptal_mi: true, tarih: true } },
    },
  });
  if (!s) throw new IslemHatasi("Sipariş bulunamadı.");
  let kullanilmis_onay_var: boolean | undefined;
  if (onayGerekli && aktor.tip === "admin") {
    kullanilmis_onay_var = (await vt.onay.count({ where: { siparis_id: id, kullanildi_mi: true } })) > 0;
  }
  return { ...s, kullanilmis_onay_var } satisfies SiparisBaglami & Record<string, unknown>;
}

/**
 * İyimser kilit: güncelleme, okunan durum hâlâ geçerliyse yapılır. İki kişi aynı anda
 * aynı siparişi ilerletmeye çalışırsa ikincisi açık bir hata alır.
 */
async function kosulluGuncelle(
  vt: KapsamliDb,
  id: number,
  beklenen: { durum: SiparisBaglami["durum"] },
  data: Prisma.SiparisUpdateManyMutationInput,
) {
  const r = await vt.siparis.updateMany({ where: { id, durum: beklenen.durum, iptal_mi: false }, data });
  if (r.count !== 1) throw new IslemHatasi("Sipariş bu arada başka biri tarafından değiştirildi; sayfayı yenileyin.");
}

// ---------------------------------------------------------------------------
// Durum geçişleri
// ---------------------------------------------------------------------------

export async function tedarikciOnayla(vt: KapsamliDb, aktor: Aktor, id: number): Promise<void> {
  const s = await baglamGetir(vt, aktor, id);
  zorunlu(gecisDenetle("tedarikci_onayladi", aktor.tip, s));
  await kosulluGuncelle(vt, id, s, { durum: "tedarikci_onayladi" });
}

export const faturaSemasi = z.object({
  faturaNo: z.string().trim().min(1, "Fatura no zorunlu.").max(50, "Fatura no en fazla 50 karakter."),
  faturaTarihi: z.string().refine(gecerliGunMu, "Fatura tarihi geçersiz."),
  faturaTutar: z.string().trim().min(1, "Fatura tutarı zorunlu."),
});
export type FaturaGirdisi = z.infer<typeof faturaSemasi>;

function faturaVerisi(g: FaturaGirdisi) {
  const f = faturaSemasi.parse(g);
  return { fatura_no: f.faturaNo, fatura_tarihi: gunTarih(f.faturaTarihi), fatura_tutar: dbPara(paraOku(f.faturaTutar)) };
}

/** "Sevk ettim": fatura bilgisi ve durum tek adımda. */
export async function sevkEt(vt: KapsamliDb, aktor: Aktor, id: number, fatura: FaturaGirdisi): Promise<void> {
  const veri = faturaVerisi(fatura);
  const s = await baglamGetir(vt, aktor, id);
  zorunlu(faturaDuzenlemeDenetle(aktor.tip, s));
  zorunlu(gecisDenetle("sevk_edildi", aktor.tip, { ...s, fatura_no: veri.fatura_no, fatura_tutar: veri.fatura_tutar }));
  await kosulluGuncelle(vt, id, s, { durum: "sevk_edildi", ...veri });
}

/** Fatura bilgisini düzeltme (alıcı onayına kadar). */
export async function faturaGuncelle(vt: KapsamliDb, aktor: Aktor, id: number, fatura: FaturaGirdisi): Promise<void> {
  const veri = faturaVerisi(fatura);
  const s = await baglamGetir(vt, aktor, id);
  zorunlu(faturaDuzenlemeDenetle(aktor.tip, s));
  await kosulluGuncelle(vt, id, s, veri);
}

/** "Ödendi": admin onaylar; ödeme tarihi en son ödemenin tarihidir. */
export async function odendiOlarakKapat(vt: KapsamliDb, aktor: Aktor, id: number): Promise<void> {
  const s = await baglamGetir(vt, aktor, id);
  zorunlu(gecisDenetle("odendi", aktor.tip, s));
  const sonOdeme = s.odemeler
    .filter((o) => !o.iptal_mi)
    .map((o) => tarihGun(o.tarih))
    .sort()
    .at(-1);
  if (!sonOdeme) throw new IslemHatasi("Ödeme kaydı yok.");
  await kosulluGuncelle(vt, id, s, { durum: "odendi", odeme_tarihi: gunTarih(sonOdeme) });
}

export async function siparisIptal(vt: KapsamliDb, aktor: Aktor, id: number, neden: string): Promise<void> {
  const n = neden.trim();
  if (!n) throw new IslemHatasi("İptal nedeni zorunlu.");
  if (n.length > 500) throw new IslemHatasi("İptal nedeni en fazla 500 karakter.");
  const s = await baglamGetir(vt, aktor, id);
  zorunlu(siparisIptalDenetle(aktor.tip, s));
  await kosulluGuncelle(vt, id, s, { iptal_mi: true, iptal_nedeni: n, iptal_zamani: new Date() });
}

// ---------------------------------------------------------------------------
// Ödeme bildirimi
// ---------------------------------------------------------------------------

export const odemeSemasi = z.object({
  tutar: z.string().trim().min(1, "Tutar zorunlu."),
  tarih: z.string().refine(gecerliGunMu, "Ödeme tarihi geçersiz."),
  yontem: z.enum(["havale_eft", "nakit", "cek", "diger"] satisfies OdemeYontemi[]),
  not: z.string().trim().max(500).optional(),
});
export type OdemeGirdisi = z.infer<typeof odemeSemasi>;

/** Ödeme bildirimi: ödeyen her zaman siparişin alıcısı, alan siparişin satıcısıdır. */
export async function odemeEkle(vt: KapsamliDb, aktor: Aktor, siparisId: number, g: OdemeGirdisi): Promise<number> {
  const o = odemeSemasi.parse(g);
  const tutar = paraOku(o.tutar);
  if (!tutar.isPositive() || tutar.isZero()) throw new IslemHatasi("Ödeme tutarı sıfırdan büyük olmalı.");
  const s = await baglamGetir(vt, aktor, siparisId);
  zorunlu(odemeEklemeDenetle(aktor.tip, s));
  const yeni = await vt.odeme.create({
    data: {
      siparis_id: siparisId,
      odeyen_firma_id: s.alici_firma_id,
      alan_firma_id: s.satici_firma_id,
      tutar: dbPara(tutar),
      tarih: gunTarih(o.tarih),
      yontem: o.yontem,
      not: o.not || null,
    },
    select: { id: true },
  });
  return yeni.id;
}

export async function odemeIptal(vt: KapsamliDb, aktor: Aktor, odemeId: number, neden: string): Promise<void> {
  const n = neden.trim();
  if (!n) throw new IslemHatasi("İptal nedeni zorunlu.");
  const odeme = await vt.odeme.findUnique({ where: { id: odemeId }, select: { siparis_id: true, iptal_mi: true } });
  if (!odeme) throw new IslemHatasi("Ödeme kaydı bulunamadı.");
  if (odeme.iptal_mi) throw new IslemHatasi("Ödeme zaten iptal edilmiş.");
  const s = await baglamGetir(vt, aktor, odeme.siparis_id);
  zorunlu(odemeIptalDenetle(aktor.tip, s));
  await vt.odeme.update({ where: { id: odemeId }, data: { iptal_mi: true, iptal_nedeni: n } });
}

// ---------------------------------------------------------------------------
// Onay bağlantısı
// ---------------------------------------------------------------------------

/** Yeni bağlantı üretir; eski geçerli bağlantıyı veritabanı tetikleyicisi geçersiz kılar. Ham token yalnız burada döner. */
export async function onayBaglantisiUret(
  vt: KapsamliDb,
  aktor: Aktor,
  siparisId: number,
): Promise<{ token: string; sonGecerlilik: Date }> {
  const s = await baglamGetir(vt, aktor, siparisId, true);
  zorunlu(onayBaglantisiDenetle(aktor.tip, s));
  const { token, hash } = onayTokenUret();
  const sonGecerlilik = new Date(Date.now() + ONAY_GECERLILIK_GUN * 86_400_000);
  await vt.onay.create({ data: { siparis_id: siparisId, token_hash: hash, son_gecerlilik: sonGecerlilik } });
  return { token, sonGecerlilik };
}

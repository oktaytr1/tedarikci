// Sipariş durum akışı: kim, hangi durumda, neyi yapabilir. TEK kural kaynağı.
//
// Saf modüldür (veritabanına dokunmaz): hem servisler (lib/siparis-islemleri.ts) hem ekranlar
// (hangi düğme görünsün) buradan karar verir. Aynı kurallar veritabanında tetikleyiciyle de
// zorlanır (migrations/*_durum_akisi_donma_toplam).
//
//   girildi → tedarikci_onayladi → sevk_edildi → alici_onayladi → odendi
//
//   tedarikci_onayladi : tedarikçi ya da admin (tedarikçi adına, telefonla teyit)
//   sevk_edildi        : tedarikçi ya da admin; fatura no + fatura tutarı zorunlu
//   alici_onayladi     : YALNIZ alıcının onay bağlantısı (admin asla)
//   odendi             : yalnız admin; iptal edilmemiş ödemeler fatura tutarını (yoksa genel toplamı)
//                        karşılamalı. Otomatik geçiş yoktur, admin onaylar.
//   iptal              : yalnız admin, her durumda; geri alınamaz, iptal edilen sipariş donar.

import type { SiparisDurum } from "@/generated/prisma/enums";
import { odemeDurumu, type Sayi } from "@/lib/money";

export const DURUM_SIRASI: readonly SiparisDurum[] = [
  "girildi",
  "tedarikci_onayladi",
  "sevk_edildi",
  "alici_onayladi",
  "odendi",
];

export const DURUM_ETIKETI: Record<SiparisDurum, string> = {
  girildi: "Girildi",
  tedarikci_onayladi: "Tedarikçi onayladı",
  sevk_edildi: "Sevk edildi",
  alici_onayladi: "Alıcı onayladı",
  odendi: "Ödendi",
};

/** Geçişi yapan taraf. "onay_baglantisi" oturumsuz alıcı onay sayfasıdır (bölüm 5). */
export type GecisAktoru = "admin" | "tedarikci" | "onay_baglantisi";

export type SiparisBaglami = {
  durum: SiparisDurum;
  iptal_mi: boolean;
  fatura_no: string | null;
  fatura_tutar: Sayi | null;
  genel_toplam: Sayi;
  odemeler: ReadonlyArray<{ tutar: Sayi; iptal_mi: boolean }>;
  /** Yalnız alıcı onayı ve bağlantı üretimi için gerekir. */
  kullanilmis_onay_var?: boolean;
};

export type Karar = { izin: true } | { izin: false; neden: string };

const IZIN: Karar = { izin: true };
const ret = (neden: string): Karar => ({ izin: false, neden });

export function sira(durum: SiparisDurum): number {
  return DURUM_SIRASI.indexOf(durum);
}

export function sonrakiDurum(durum: SiparisDurum): SiparisDurum | null {
  return DURUM_SIRASI[sira(durum) + 1] ?? null;
}

const GECIS_YETKISI: Record<Exclude<SiparisDurum, "girildi">, readonly GecisAktoru[]> = {
  tedarikci_onayladi: ["tedarikci", "admin"],
  sevk_edildi: ["tedarikci", "admin"],
  alici_onayladi: ["onay_baglantisi"],
  odendi: ["admin"],
};

export function gecisDenetle(hedef: SiparisDurum, aktor: GecisAktoru, s: SiparisBaglami): Karar {
  if (s.iptal_mi) return ret("Sipariş iptal edilmiş.");
  if (hedef === "girildi" || sonrakiDurum(s.durum) !== hedef) {
    return ret(`"${DURUM_ETIKETI[s.durum]}" durumundan "${DURUM_ETIKETI[hedef]}" durumuna geçilemez.`);
  }
  if (!GECIS_YETKISI[hedef].includes(aktor)) {
    return hedef === "alici_onayladi"
      ? ret("Alıcı onayı yalnız alıcının onay bağlantısından verilir.")
      : ret(`"${DURUM_ETIKETI[hedef]}" adımını bu kullanıcı atamaz.`);
  }
  switch (hedef) {
    case "sevk_edildi":
      if (!s.fatura_no?.trim() || s.fatura_tutar === null) return ret("Sevk için fatura no ve fatura tutarı zorunlu.");
      return IZIN;
    case "alici_onayladi":
      return s.kullanilmis_onay_var ? IZIN : ret("Kullanılmış bir onay bağlantısı yok.");
    case "odendi": {
      const o = odemeDurumu(s.odemeler, s.fatura_tutar, s.genel_toplam);
      return o.karsiliyor ? IZIN : ret("Ödemeler fatura tutarını karşılamıyor.");
    }
    default:
      return IZIN;
  }
}

// ---------------------------------------------------------------------------
// Durum dışı işlemler ve donma noktaları
// ---------------------------------------------------------------------------

/** Satırlar, taraflar, vade, tutarlar ve komisyon: yalnız "girildi" iken ve yalnız admin. */
export function siparisDuzenlemeDenetle(aktor: GecisAktoru, s: Pick<SiparisBaglami, "durum" | "iptal_mi">): Karar {
  if (aktor !== "admin") return ret("Siparişi yalnız admin düzenler.");
  if (s.iptal_mi) return ret("Sipariş iptal edilmiş.");
  if (s.durum !== "girildi") return ret("Sipariş tedarikçi tarafından onaylandı; satırlar ve koşullar donduruldu.");
  return IZIN;
}

/** Fatura bilgisi: alıcı onayına kadar tedarikçi ya da admin. */
export function faturaDuzenlemeDenetle(aktor: GecisAktoru, s: Pick<SiparisBaglami, "durum" | "iptal_mi">): Karar {
  if (aktor !== "admin" && aktor !== "tedarikci") return ret("Fatura bilgisini bu kullanıcı giremez.");
  if (s.iptal_mi) return ret("Sipariş iptal edilmiş.");
  if (sira(s.durum) >= sira("alici_onayladi")) return ret("Alıcı onayından sonra fatura bilgisi değiştirilemez.");
  return IZIN;
}

/** Ödeme bildirimi: her durumda girilebilir (peşin ödeme onaydan önce gelebilir); iptal edilmiş siparişe girilmez. */
export function odemeEklemeDenetle(aktor: GecisAktoru, s: Pick<SiparisBaglami, "iptal_mi">): Karar {
  if (aktor !== "admin") return ret("Ödeme bildirimini yalnız admin girer.");
  if (s.iptal_mi) return ret("Sipariş iptal edilmiş.");
  return IZIN;
}

/** Ödeme iptali: sipariş "ödendi" ile kapandıysa ödemeler donar. */
export function odemeIptalDenetle(aktor: GecisAktoru, s: Pick<SiparisBaglami, "durum" | "iptal_mi">): Karar {
  if (aktor !== "admin") return ret("Ödeme kaydını yalnız admin iptal eder.");
  if (s.iptal_mi) return ret("Sipariş iptal edilmiş.");
  if (s.durum === "odendi") return ret("Sipariş kapandı; ödeme kaydı iptal edilemez.");
  return IZIN;
}

export function siparisIptalDenetle(aktor: GecisAktoru, s: Pick<SiparisBaglami, "iptal_mi">): Karar {
  if (aktor !== "admin") return ret("Siparişi yalnız admin iptal eder.");
  if (s.iptal_mi) return ret("Sipariş zaten iptal edilmiş.");
  return IZIN;
}

/** Onay bağlantısı: yalnız admin, "sevk edildi" durumunda, kullanılmış onay yokken. */
export function onayBaglantisiDenetle(
  aktor: GecisAktoru,
  s: Pick<SiparisBaglami, "durum" | "iptal_mi" | "kullanilmis_onay_var">,
): Karar {
  if (aktor !== "admin") return ret("Onay bağlantısını yalnız admin üretir.");
  if (s.iptal_mi) return ret("Sipariş iptal edilmiş.");
  if (s.kullanilmis_onay_var) return ret("Alıcı siparişi zaten onayladı.");
  if (s.durum !== "sevk_edildi") return ret('Onay bağlantısı yalnız "Sevk edildi" durumunda üretilir.');
  return IZIN;
}

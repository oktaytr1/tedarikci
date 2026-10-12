// lib/siparis-durum.ts — saf kural matrisi (veritabanı gerekmez).

import { describe, expect, it } from "vitest";
import type { SiparisDurum } from "@/generated/prisma/enums";
import {
  DURUM_SIRASI,
  faturaDuzenlemeDenetle,
  gecisDenetle,
  odemeEklemeDenetle,
  odemeIptalDenetle,
  onayBaglantisiDenetle,
  siparisDuzenlemeDenetle,
  siparisIptalDenetle,
  sonrakiDurum,
  type GecisAktoru,
  type SiparisBaglami,
} from "@/lib/siparis-durum";

const temel: SiparisBaglami = {
  durum: "girildi",
  iptal_mi: false,
  fatura_no: null,
  fatura_tutar: null,
  genel_toplam: "36.00",
  odemeler: [],
};
const b = (o: Partial<SiparisBaglami>): SiparisBaglami => ({ ...temel, ...o });
const AKTORLER: GecisAktoru[] = ["admin", "tedarikci", "onay_baglantisi"];

describe("durum sırası", () => {
  it("tek yönlü beş durum", () => {
    expect(DURUM_SIRASI).toEqual(["girildi", "tedarikci_onayladi", "sevk_edildi", "alici_onayladi", "odendi"]);
    expect(sonrakiDurum("girildi")).toBe("tedarikci_onayladi");
    expect(sonrakiDurum("odendi")).toBeNull();
  });

  it("geri ya da atlayarak geçiş hiçbir aktöre açık değil", () => {
    for (const aktor of AKTORLER) {
      for (const [i, mevcut] of DURUM_SIRASI.entries()) {
        for (const [j, hedef] of DURUM_SIRASI.entries()) {
          if (j === i + 1) continue;
          const k = gecisDenetle(hedef, aktor, b({ durum: mevcut, fatura_no: "F1", fatura_tutar: "36.00", kullanilmis_onay_var: true }));
          expect(k.izin, `${aktor}: ${mevcut} → ${hedef}`).toBe(false);
        }
      }
    }
  });

  it("iptal edilmiş siparişte hiçbir geçiş yok", () => {
    for (const aktor of AKTORLER) {
      for (const durum of DURUM_SIRASI) {
        const hedef = sonrakiDurum(durum);
        if (!hedef) continue;
        expect(gecisDenetle(hedef, aktor, b({ durum, iptal_mi: true })).izin).toBe(false);
      }
    }
  });
});

describe("geçiş yetkileri", () => {
  const izinli = (hedef: SiparisDurum, mevcut: SiparisDurum, ek: Partial<SiparisBaglami> = {}) =>
    AKTORLER.filter((a) => gecisDenetle(hedef, a, b({ durum: mevcut, ...ek })).izin);

  it("tedarikçi onayı: tedarikçi ve admin (tedarikçi adına)", () => {
    expect(izinli("tedarikci_onayladi", "girildi")).toEqual(["admin", "tedarikci"]);
  });

  it("sevk: tedarikçi ve admin; fatura no ve tutar zorunlu", () => {
    expect(izinli("sevk_edildi", "tedarikci_onayladi")).toEqual([]);
    expect(izinli("sevk_edildi", "tedarikci_onayladi", { fatura_no: "F1" })).toEqual([]);
    expect(izinli("sevk_edildi", "tedarikci_onayladi", { fatura_no: "  ", fatura_tutar: "36.00" })).toEqual([]);
    expect(izinli("sevk_edildi", "tedarikci_onayladi", { fatura_no: "F1", fatura_tutar: "36.00" })).toEqual(["admin", "tedarikci"]);
  });

  it("alıcı onayı: YALNIZ onay bağlantısı, admin asla", () => {
    const ek = { fatura_no: "F1", fatura_tutar: "36.00", kullanilmis_onay_var: true };
    expect(izinli("alici_onayladi", "sevk_edildi", ek)).toEqual(["onay_baglantisi"]);
    const k = gecisDenetle("alici_onayladi", "admin", b({ durum: "sevk_edildi", ...ek }));
    expect(k).toEqual({ izin: false, neden: "Alıcı onayı yalnız alıcının onay bağlantısından verilir." });
    expect(izinli("alici_onayladi", "sevk_edildi", { ...ek, kullanilmis_onay_var: false })).toEqual([]);
  });

  it("ödendi: yalnız admin; ödemeler fatura tutarını karşılamalı (kısmi yetmez)", () => {
    const ek = { fatura_no: "F1", fatura_tutar: "36.00" };
    expect(izinli("odendi", "alici_onayladi", { ...ek, odemeler: [{ tutar: "20.00", iptal_mi: false }] })).toEqual([]);
    expect(
      izinli("odendi", "alici_onayladi", {
        ...ek,
        odemeler: [
          { tutar: "20.00", iptal_mi: false },
          { tutar: "16.00", iptal_mi: true },
        ],
      }),
    ).toEqual([]);
    expect(
      izinli("odendi", "alici_onayladi", {
        ...ek,
        odemeler: [
          { tutar: "20.00", iptal_mi: false },
          { tutar: "16.00", iptal_mi: false },
        ],
      }),
    ).toEqual(["admin"]);
  });

  it("ödendi: fatura tutarı genel toplamdan farklıysa fatura tutarı esas", () => {
    const ek = { fatura_no: "F1", fatura_tutar: "40.00", genel_toplam: "36.00" };
    expect(izinli("odendi", "alici_onayladi", { ...ek, odemeler: [{ tutar: "36.00", iptal_mi: false }] })).toEqual([]);
    expect(izinli("odendi", "alici_onayladi", { ...ek, odemeler: [{ tutar: "40.00", iptal_mi: false }] })).toEqual(["admin"]);
  });

  it("ödendi: fatura tutarı yoksa genel toplam esas", () => {
    expect(izinli("odendi", "alici_onayladi", { odemeler: [{ tutar: "36.00", iptal_mi: false }] })).toEqual(["admin"]);
  });
});

describe("donma noktaları ve diğer işlemler", () => {
  it("sipariş düzenleme (satır, vade, komisyon): yalnız admin ve yalnız 'girildi'", () => {
    expect(siparisDuzenlemeDenetle("admin", b({})).izin).toBe(true);
    expect(siparisDuzenlemeDenetle("tedarikci", b({})).izin).toBe(false);
    for (const durum of DURUM_SIRASI.slice(1)) {
      expect(siparisDuzenlemeDenetle("admin", b({ durum })).izin).toBe(false);
    }
    expect(siparisDuzenlemeDenetle("admin", b({ iptal_mi: true })).izin).toBe(false);
  });

  it("fatura bilgisi: alıcı onayına kadar tedarikçi ya da admin", () => {
    for (const durum of ["girildi", "tedarikci_onayladi", "sevk_edildi"] as const) {
      expect(faturaDuzenlemeDenetle("tedarikci", b({ durum })).izin).toBe(true);
      expect(faturaDuzenlemeDenetle("admin", b({ durum })).izin).toBe(true);
    }
    for (const durum of ["alici_onayladi", "odendi"] as const) {
      expect(faturaDuzenlemeDenetle("admin", b({ durum })).izin).toBe(false);
    }
    expect(faturaDuzenlemeDenetle("onay_baglantisi", b({})).izin).toBe(false);
  });

  it("ödeme bildirimi: her durumda (peşin ödeme önce gelebilir), yalnız admin, iptalde değil", () => {
    for (const durum of DURUM_SIRASI) expect(odemeEklemeDenetle("admin", b({ durum })).izin).toBe(true);
    expect(odemeEklemeDenetle("tedarikci", b({})).izin).toBe(false);
    expect(odemeEklemeDenetle("admin", b({ iptal_mi: true })).izin).toBe(false);
  });

  it("ödeme iptali: sipariş 'ödendi' ile kapandıysa yok", () => {
    expect(odemeIptalDenetle("admin", b({ durum: "alici_onayladi" })).izin).toBe(true);
    expect(odemeIptalDenetle("admin", b({ durum: "odendi" })).izin).toBe(false);
  });

  it("sipariş iptali: her durumda, yalnız admin, bir kez", () => {
    for (const durum of DURUM_SIRASI) expect(siparisIptalDenetle("admin", b({ durum })).izin).toBe(true);
    expect(siparisIptalDenetle("tedarikci", b({})).izin).toBe(false);
    expect(siparisIptalDenetle("admin", b({ iptal_mi: true })).izin).toBe(false);
  });

  it("onay bağlantısı: yalnız admin, yalnız 'sevk edildi', kullanılmış onay yokken", () => {
    for (const durum of DURUM_SIRASI) {
      expect(onayBaglantisiDenetle("admin", b({ durum })).izin).toBe(durum === "sevk_edildi");
    }
    expect(onayBaglantisiDenetle("tedarikci", b({ durum: "sevk_edildi" })).izin).toBe(false);
    expect(onayBaglantisiDenetle("admin", b({ durum: "sevk_edildi", kullanilmis_onay_var: true })).izin).toBe(false);
  });
});

// lib/money.ts — elle hesaplanmış örneklerle birebir karşılaştırma.
// Her örneğin elle hesabı yorumda; beklenen değerler string olarak sabit yazıldı.

import { describe, expect, it } from "vitest";
import {
  ParaHatasi,
  dbMiktar,
  dbPara,
  faturaTutarUyusuyorMu,
  komisyonHesapla,
  paraOku,
  paraYaz,
  satirHesapla,
  siparisToplamlari,
  yuvarla,
} from "@/lib/money";

// Karşılaştırma için 2 haneli string (money.ts'in kendi dönüştürücüsü).
const s2 = (x: { toString(): string }) => dbPara(x);

describe("satır hesabı (KDV satır bazında, fiyatlar KDV hariç)", () => {
  it("A: 3 adet × 12,50 TL, %20 KDV", () => {
    // net = 3 × 12,50 = 37,50 ; KDV = 37,50 × 0,20 = 7,50 ; dahil = 45,00
    const r = satirHesapla({ adet: "3", birim: "adet", birimFiyat: "12.50", kdvOrani: "20" });
    expect(s2(r.satirToplam)).toBe("37.50");
    expect(s2(r.kdvTutar)).toBe("7.50");
    expect(s2(r.kdvDahil)).toBe("45.00");
  });

  it("B: 7 adet × 3,33 TL, %10 KDV — KDV kuruş altı aşağı yuvarlanır", () => {
    // net = 7 × 3,33 = 23,31 ; KDV = 23,31 × 0,10 = 2,331 → 2,33
    const r = satirHesapla({ adet: "7", birim: "adet", birimFiyat: "3.33", kdvOrani: "10" });
    expect(s2(r.satirToplam)).toBe("23.31");
    expect(s2(r.kdvTutar)).toBe("2.33");
  });

  it("C: 1 adet × 0,25 TL, %10 KDV — tam yarım kuruş YUKARI yuvarlanır", () => {
    // net = 0,25 ; KDV = 0,025 → 0,03 (yarım yukarı; banker yuvarlaması 0,02 verirdi)
    const r = satirHesapla({ adet: "1", birim: "adet", birimFiyat: "0.25", kdvOrani: "10" });
    expect(s2(r.satirToplam)).toBe("0.25");
    expect(s2(r.kdvTutar)).toBe("0.03");
  });

  it("D: 2,5 kg × 19,99 TL, %1 KDV — önce net yuvarlanır, KDV yuvarlanmış netten", () => {
    // net = 2,5 × 19,99 = 49,975 → 49,98
    // KDV = 49,98 × 0,01 = 0,4998 → 0,50
    // (yuvarlanmamış netten olsaydı 0,49975 → 0,50; burada aynı, ama kural "yuvarlanmış netten")
    const r = satirHesapla({ adet: "2.5", birim: "kg", birimFiyat: "19.99", kdvOrani: "1" });
    expect(s2(r.satirToplam)).toBe("49.98");
    expect(s2(r.kdvTutar)).toBe("0.50");
  });

  it("E: 0,333 kg × 10,00 TL, %20 KDV — 3 haneli miktar", () => {
    // net = 0,333 × 10 = 3,33 ; KDV = 3,33 × 0,20 = 0,666 → 0,67
    const r = satirHesapla({ adet: "0.333", birim: "kg", birimFiyat: "10.00", kdvOrani: "20" });
    expect(s2(r.satirToplam)).toBe("3.33");
    expect(s2(r.kdvTutar)).toBe("0.67");
  });

  it("F: 12 adet × 8,75 TL, %0 KDV", () => {
    // net = 105,00 ; KDV = 0,00
    const r = satirHesapla({ adet: "12", birim: "adet", birimFiyat: "8.75", kdvOrani: "0" });
    expect(s2(r.satirToplam)).toBe("105.00");
    expect(s2(r.kdvTutar)).toBe("0.00");
  });

  it("büyük tutar: 1.000 adet × 1.234.567,89 TL, %20 — kesinlik kaybı yok", () => {
    // net = 1.234.567.890,00 ; KDV = 246.913.578,00
    const r = satirHesapla({ adet: "1000", birim: "adet", birimFiyat: "1234567.89", kdvOrani: "20" });
    expect(s2(r.satirToplam)).toBe("1234567890.00");
    expect(s2(r.kdvTutar)).toBe("246913578.00");
    expect(paraYaz(r.satirToplam)).toBe("1.234.567.890,00");
  });

  it("Prisma Decimal benzeri nesneler (toString) kabul edilir", () => {
    const r = satirHesapla({
      adet: { toString: () => "3" },
      birim: "adet",
      birimFiyat: { toString: () => "12.50" },
      kdvOrani: { toString: () => "20.00" },
    });
    expect(s2(r.satirToplam)).toBe("37.50");
    expect(s2(r.kdvTutar)).toBe("7.50");
  });
});

describe("sipariş toplamları", () => {
  it("A + B + C, %2,5 komisyon", () => {
    // ara  = 37,50 + 23,31 + 0,25 = 61,06
    // KDV  =  7,50 +  2,33 + 0,03 =  9,86
    // genel = 61,06 + 9,86 = 70,92
    // komisyon = 61,06 × 0,025 = 1,5265 → 1,53 (matrah KDV hariç ara toplam)
    const satirlar = [
      satirHesapla({ adet: "3", birim: "adet", birimFiyat: "12.50", kdvOrani: "20" }),
      satirHesapla({ adet: "7", birim: "adet", birimFiyat: "3.33", kdvOrani: "10" }),
      satirHesapla({ adet: "1", birim: "adet", birimFiyat: "0.25", kdvOrani: "10" }),
    ];
    const t = siparisToplamlari(satirlar, "2.5");
    expect(s2(t.araToplam)).toBe("61.06");
    expect(s2(t.kdvToplam)).toBe("9.86");
    expect(s2(t.genelToplam)).toBe("70.92");
    expect(s2(t.komisyonTutar)).toBe("1.53");

    // KDV dökümü: %20 → matrah 37,50 / KDV 7,50 ; %10 → matrah 23,56 / KDV 2,36
    expect(s2(t.kdvDokumu.get("20.00")!.matrah)).toBe("37.50");
    expect(s2(t.kdvDokumu.get("20.00")!.kdv)).toBe("7.50");
    expect(s2(t.kdvDokumu.get("10.00")!.matrah)).toBe("23.56");
    expect(s2(t.kdvDokumu.get("10.00")!.kdv)).toBe("2.36");
  });

  it("gerçekçi fatura: üç kalem, üç farklı KDV oranı, %3 komisyon", () => {
    // 1) 48 adet × 27,90 @%20     → net 1.339,20 ; KDV 267,84
    // 2) 12,750 kg × 145,40 @%1   → net 1.853,85 ; KDV 18,5385 → 18,54
    // 3) 6 adet × 1.249,99 @%10   → net 7.499,94 ; KDV 749,994 → 749,99
    // ara   = 1.339,20 + 1.853,85 + 7.499,94 = 10.692,99
    // KDV   =   267,84 +    18,54 +   749,99 =  1.036,37
    // genel = 11.729,36
    // komisyon = 10.692,99 × 0,03 = 320,7897 → 320,79
    const satirlar = [
      satirHesapla({ adet: "48", birim: "adet", birimFiyat: "27.90", kdvOrani: "20" }),
      satirHesapla({ adet: "12.750", birim: "kg", birimFiyat: "145.40", kdvOrani: "1" }),
      satirHesapla({ adet: "6", birim: "Adet", birimFiyat: "1249.99", kdvOrani: "10" }),
    ];
    expect(satirlar.map((s) => s2(s.satirToplam))).toEqual(["1339.20", "1853.85", "7499.94"]);
    expect(satirlar.map((s) => s2(s.kdvTutar))).toEqual(["267.84", "18.54", "749.99"]);

    const t = siparisToplamlari(satirlar, "3");
    expect(s2(t.araToplam)).toBe("10692.99");
    expect(s2(t.kdvToplam)).toBe("1036.37");
    expect(s2(t.genelToplam)).toBe("11729.36");
    expect(s2(t.komisyonTutar)).toBe("320.79");
    expect(paraYaz(t.genelToplam)).toBe("11.729,36");
  });

  it("KDV satır bazında: toplam üzerinden yeniden hesaplanmaz", () => {
    // Üç satır: 1 × 0,25 @%10 → her biri KDV 0,025 → 0,03 ; toplam KDV 0,09.
    // (Toplam üzerinden olsaydı 0,75 × 0,10 = 0,075 → 0,08 olurdu — bu YANLIŞ yol.)
    const satir = satirHesapla({ adet: "1", birim: "adet", birimFiyat: "0.25", kdvOrani: "10" });
    const t = siparisToplamlari([satir, satir, satir], "0");
    expect(s2(t.araToplam)).toBe("0.75");
    expect(s2(t.kdvToplam)).toBe("0.09");
    expect(s2(t.genelToplam)).toBe("0.84");
  });

  it("iptal edilmiş satır toplamlara katılmaz", () => {
    // A (37,50 / 7,50) geçerli, B (23,31 / 2,33) iptal → ara 37,50 ; KDV 7,50 ; genel 45,00
    // komisyon %2 → 37,50 × 0,02 = 0,75
    const a = satirHesapla({ adet: "3", birim: "adet", birimFiyat: "12.50", kdvOrani: "20" });
    const b = satirHesapla({ adet: "7", birim: "adet", birimFiyat: "3.33", kdvOrani: "10" });
    const t = siparisToplamlari([a, { ...b, iptalMi: true }], "2");
    expect(s2(t.araToplam)).toBe("37.50");
    expect(s2(t.kdvToplam)).toBe("7.50");
    expect(s2(t.genelToplam)).toBe("45.00");
    expect(s2(t.komisyonTutar)).toBe("0.75");
    expect(t.kdvDokumu.has("10.00")).toBe(false);
  });

  it("boş sipariş sıfır döner", () => {
    const t = siparisToplamlari([], "5");
    expect(s2(t.genelToplam)).toBe("0.00");
    expect(s2(t.komisyonTutar)).toBe("0.00");
  });
});

describe("komisyon", () => {
  it("matrah KDV hariç, yarım yukarı", () => {
    // 100,10 × %2,5 = 2,5025 → 2,50 ; 100,20 × %2,5 = 2,505 → 2,51
    expect(s2(komisyonHesapla("100.10", "2.5"))).toBe("2.50");
    expect(s2(komisyonHesapla("100.20", "2.5"))).toBe("2.51");
  });
});

describe("yuvarlama", () => {
  it("2 hane, yarım yukarı", () => {
    expect(s2(yuvarla("1.005"))).toBe("1.01");
    expect(s2(yuvarla("1.004999"))).toBe("1.00");
    expect(s2(yuvarla("2.675"))).toBe("2.68"); // float'ta 2.67 çıkan klasik örnek
  });
});

describe("doğrulama hataları", () => {
  it("birim 'adet' iken ondalıklı miktar reddedilir (büyük/küçük harf fark etmez)", () => {
    expect(() => satirHesapla({ adet: "2.5", birim: "adet", birimFiyat: "1", kdvOrani: "20" })).toThrow(ParaHatasi);
    expect(() => satirHesapla({ adet: "2.5", birim: "ADET", birimFiyat: "1", kdvOrani: "20" })).toThrow(ParaHatasi);
  });

  it("sıfır, negatif ve 3 haneden uzun miktar reddedilir", () => {
    expect(() => dbMiktar("0", "kg")).toThrow(ParaHatasi);
    expect(() => dbMiktar("-1", "kg")).toThrow(ParaHatasi);
    expect(() => dbMiktar("1.2345", "kg")).toThrow(ParaHatasi);
    expect(dbMiktar("2.5", "kg")).toBe("2.500");
  });

  it("2 haneden uzun birim fiyat sessizce yuvarlanmaz, reddedilir", () => {
    expect(() => satirHesapla({ adet: "1", birim: "adet", birimFiyat: "1.005", kdvOrani: "20" })).toThrow(ParaHatasi);
  });

  it("ondalıklı değer number olarak verilemez (float girişi engellenir)", () => {
    expect(() => dbPara(0.1)).toThrow(ParaHatasi);
    expect(dbPara(5)).toBe("5.00");
  });

  it("oran 0–100 dışında reddedilir", () => {
    expect(() => satirHesapla({ adet: "1", birim: "adet", birimFiyat: "1", kdvOrani: "101" })).toThrow(ParaHatasi);
    expect(() => satirHesapla({ adet: "1", birim: "adet", birimFiyat: "1", kdvOrani: "-1" })).toThrow(ParaHatasi);
  });

  it("numeric(18,2) sınırını aşan tutar reddedilir", () => {
    expect(() => dbPara("10000000000000000.00")).toThrow(ParaHatasi);
    expect(dbPara("9999999999999999.99")).toBe("9999999999999999.99");
  });
});

describe("Türkçe para girişi ve gösterimi", () => {
  it("geçerli biçimler", () => {
    expect(s2(paraOku("1.234,56"))).toBe("1234.56");
    expect(s2(paraOku("1234,5"))).toBe("1234.50");
    expect(s2(paraOku(" 12 "))).toBe("12.00");
    expect(s2(paraOku("1.000.000"))).toBe("1000000.00");
  });

  it("belirsiz veya hatalı biçimler reddedilir", () => {
    expect(() => paraOku("12,345")).toThrow(ParaHatasi); // 3 ondalık
    expect(() => paraOku("1,234.56")).toThrow(ParaHatasi); // İngilizce biçim
    expect(() => paraOku("1.23,45")).toThrow(ParaHatasi); // hatalı binlik grubu
    expect(() => paraOku("abc")).toThrow(ParaHatasi);
  });

  it("gösterim", () => {
    expect(paraYaz("0")).toBe("0,00");
    expect(paraYaz("1234.5")).toBe("1.234,50");
    expect(paraYaz("9999999999999999.99")).toBe("9.999.999.999.999.999,99");
  });
});

describe("fatura tutarı karşılaştırması", () => {
  it("eşitse uyuşur, farklıysa uyuşmaz, boşsa karşılaştırılmaz", () => {
    expect(faturaTutarUyusuyorMu("11729.36", "11729.36")).toBe(true);
    expect(faturaTutarUyusuyorMu("11729.3", "11729.30")).toBe(true);
    expect(faturaTutarUyusuyorMu("11729.35", "11729.36")).toBe(false);
    expect(faturaTutarUyusuyorMu(null, "11729.36")).toBe(true);
  });
});

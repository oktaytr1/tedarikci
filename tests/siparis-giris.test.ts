// Sipariş girişi servisi — sunucuda yeniden hesap, kopyalama, düzeltme ve donma.

import { beforeEach, describe, expect, it } from "vitest";
import { testVeritabaniAdresi } from "./kurulum-global";
import { temizVeKur, type Kurulum } from "./vt-yardimci";

const VT_VAR = testVeritabaniAdresi() !== null;

describe.skipIf(!VT_VAR)("sipariş girişi (veritabanı)", () => {
  let k: Kurulum;
  let cekirdek: typeof import("@/lib/scope-cekirdek");
  let giris: typeof import("@/lib/siparis-giris");
  let is: typeof import("@/lib/siparis-islemleri");
  let u3: number; // %10 KDV'li üçüncü ürün

  beforeEach(async () => {
    k = await temizVeKur();
    cekirdek = await import("@/lib/scope-cekirdek");
    giris = await import("@/lib/siparis-giris");
    is = await import("@/lib/siparis-islemleri");
    u3 = (
      await k.ham.urun.create({
        data: { firma_id: k.tedA.id, kod: "U3", ad: "Ürün 3", birim: "adet", liste_fiyat: "1249.99", kdv_orani: "10.00" },
      })
    ).id;
    // Gerçekçi fatura örneği: tests/money.test.ts ile aynı rakamlar.
    await k.ham.urun.update({ where: { id: k.urun.id }, data: { liste_fiyat: "27.90" } });
  });

  const girdi = (ek: Record<string, unknown> = {}) => ({
    aliciFirmaId: k.alici.id,
    saticiFirmaId: k.tedA.id,
    tarih: "2026-10-12",
    odemeTipi: "vadeli",
    vadeGun: "30",
    komisyonOran: "3",
    satirlar: [
      { urunId: k.urun.id, adet: "48", birimFiyat: "27,90" },
      { urunId: k.urunKg.id, adet: "12,750", birimFiyat: "145,40" },
      { urunId: u3, adet: "6", birimFiyat: "1.249,99" },
    ],
    ...ek,
  });
  const olustur = (g: unknown, aktor = k.admin) =>
    cekirdek.denetimliAktorle(aktor, is.ISLEM.olustur, (vt, a) => giris.siparisOlustur(vt, a, g));
  const guncelle = (id: number, g: unknown) =>
    cekirdek.denetimliAktorle(k.admin, is.ISLEM.guncelle, (vt, a) => giris.siparisGuncelle(vt, a, id, g));
  const alanHatalari = async (p: Promise<unknown>) => {
    try {
      await p;
    } catch (e) {
      if (e instanceof giris.GirisHatasi) return e.alanlar;
      throw e;
    }
    throw new Error("hata bekleniyordu");
  };

  it("toplamlar sunucuda hesaplanır ve elle hesapla birebir tutar; ad/birim/KDV üründen kopyalanır", async () => {
    const id = await olustur(girdi());
    const s = await k.ham.siparis.findUniqueOrThrow({ where: { id }, include: { satirlar: { orderBy: { id: "asc" } } } });
    // ara 10.692,99 ; KDV 1.036,37 ; genel 11.729,36 ; komisyon %3 → 320,79
    expect([s.ara_toplam, s.kdv_toplam, s.genel_toplam, s.komisyon_oran, s.komisyon_tutar].map(String)).toEqual([
      "10692.99", "1036.37", "11729.36", "3", "320.79",
    ]);
    expect(s.vade_gun).toBe(30);
    expect(s.vade_tarihi?.toISOString().slice(0, 10)).toBe("2026-11-11");
    expect(s.satirlar.map((x) => [x.ad, x.birim, String(x.kdv_orani), String(x.adet), String(x.satir_toplam), String(x.kdv_tutar)])).toEqual([
      ["Ürün 1", "adet", "20", "48", "1339.2", "267.84"],
      ["Ürün 2 (kg)", "kg", "1", "12.75", "1853.85", "18.54"],
      ["Ürün 3", "adet", "10", "6", "7499.94", "749.99"],
    ]);
  });

  it("pazarlık fiyatı kabul edilir; KDV oranı istemciden alınmaz", async () => {
    const g = girdi({ satirlar: [{ urunId: k.urun.id, adet: "10", birimFiyat: "25,00", kdvOrani: "0" }] });
    const id = await olustur(g);
    const satir = await k.ham.siparisSatir.findFirstOrThrow({ where: { siparis_id: id } });
    expect(String(satir.birim_fiyat)).toBe("25");
    expect(String(satir.kdv_orani)).toBe("20");
  });

  it("ürün fiyatı ve KDV'si sonradan değişince geçmiş sipariş DEĞİŞMEZ", async () => {
    const id = await olustur(girdi());
    await k.ham.urun.update({ where: { id: k.urun.id }, data: { liste_fiyat: "99.99", kdv_orani: "10.00", ad: "Yeni ad" } });
    const s = await k.ham.siparis.findUniqueOrThrow({ where: { id }, include: { satirlar: { orderBy: { id: "asc" } } } });
    expect(String(s.genel_toplam)).toBe("11729.36");
    expect([s.satirlar[0].ad, String(s.satirlar[0].birim_fiyat), String(s.satirlar[0].kdv_orani)]).toEqual(["Ürün 1", "27.9", "20"]);
  });

  it("komisyon: boş bırakmak hata, 0 kabul", async () => {
    expect(await alanHatalari(olustur(girdi({ komisyonOran: "" })))).toEqual({
      komisyonOran: "Komisyon oranı zorunlu (komisyonsuz iş için 0 girin).",
    });
    const id = await olustur(girdi({ komisyonOran: "0" }));
    expect(String((await k.ham.siparis.findUniqueOrThrow({ where: { id } })).komisyon_tutar)).toBe("0");
  });

  it("alan bazında hatalar birlikte döner", async () => {
    const h = await alanHatalari(
      olustur(
        girdi({
          vadeGun: "",
          satirlar: [
            { urunId: k.urun.id, adet: "2,5", birimFiyat: "10" },
            { urunId: k.urunB.id, adet: "1", birimFiyat: "5" },
            { urunId: k.urunKg.id, adet: "1", birimFiyat: "1,005" },
          ],
        }),
      ),
    );
    expect(Object.keys(h).sort()).toEqual(["vadeGun"]);
    // Şema hatası olsa da komisyon hatası birlikte döner.
    const h1 = await alanHatalari(olustur(girdi({ vadeGun: "", komisyonOran: "" })));
    expect(Object.keys(h1).sort()).toEqual(["komisyonOran", "vadeGun"]);
    const h2 = await alanHatalari(
      olustur(
        girdi({
          satirlar: [
            { urunId: k.urun.id, adet: "2,5", birimFiyat: "10" },
            { urunId: k.urunB.id, adet: "1", birimFiyat: "5" },
            { urunId: k.urunKg.id, adet: "1", birimFiyat: "1,005" },
          ],
        }),
      ),
    );
    expect(h2).toMatchObject({
      "satirlar.0.adet": expect.stringMatching(/tamsayı/),
      "satirlar.1.urunId": "Ürün bu tedarikçiye ait değil.",
      "satirlar.2.birimFiyat": expect.stringMatching(/biçimi geçersiz|2 ondalık/),
    });
  });

  it("pasif ürün ve pasif firma yeni siparişte seçilemez", async () => {
    await k.ham.urun.update({ where: { id: u3 }, data: { aktif: false } });
    expect(await alanHatalari(olustur(girdi()))).toEqual({ "satirlar.2.urunId": '"Ürün 3" pasif; yeni satırda seçilemez.' });
    await k.ham.urun.update({ where: { id: u3 }, data: { aktif: true } });
    await k.ham.firma.update({ where: { id: k.alici.id }, data: { durum: "pasif" } });
    expect(await alanHatalari(olustur(girdi()))).toEqual({ aliciFirmaId: "Alıcı Market A.Ş. pasif." });
  });

  it("peşin siparişte vade boş kalır; tedarikçi sipariş giremez", async () => {
    const id = await olustur(girdi({ odemeTipi: "pesin", vadeGun: "" }));
    const s = await k.ham.siparis.findUniqueOrThrow({ where: { id } });
    expect([s.vade_gun, s.vade_tarihi]).toEqual([null, null]);
    await expect(olustur(girdi(), k.tedarikciA as never)).rejects.toThrow(/yalnız admin/);
  });

  describe("'girildi' iken düzeltme", () => {
    it("miktar/fiyat güncellenir, satır eklenir, çıkarılan satır iptal edilir; toplamlar yeniden hesaplanır", async () => {
      const id = await olustur(girdi());
      const satirlar = await k.ham.siparisSatir.findMany({ where: { siparis_id: id }, orderBy: { id: "asc" } });
      // Ürün 1: 48 → 50 ; Ürün 2 çıkarıldı ; Ürün 3 aynı ; yeni: 2 × Ürün 1 @ 20,00
      await guncelle(
        id,
        girdi({
          komisyonOran: "2,5",
          satirlar: [
            { satirId: satirlar[0].id, urunId: k.urun.id, adet: "50", birimFiyat: "27,90" },
            { satirId: satirlar[2].id, urunId: u3, adet: "6", birimFiyat: "1.249,99" },
            { urunId: k.urun.id, adet: "2", birimFiyat: "20,00" },
          ],
        }),
      );
      // 50 × 27,90 = 1.395,00 (KDV 279,00) ; 7.499,94 (749,99) ; 40,00 (8,00)
      // ara 8.934,94 ; KDV 1.036,99 ; genel 9.971,93 ; komisyon %2,5 → 223,3735 → 223,37
      const s = await k.ham.siparis.findUniqueOrThrow({ where: { id }, include: { satirlar: { orderBy: { id: "asc" } } } });
      expect([s.ara_toplam, s.kdv_toplam, s.genel_toplam, s.komisyon_tutar].map(String)).toEqual([
        "8934.94", "1036.99", "9971.93", "223.37",
      ]);
      expect(s.satirlar.map((x) => [x.ad, String(x.adet), x.iptal_mi])).toEqual([
        ["Ürün 1", "50", false],
        ["Ürün 2 (kg)", "12.75", true],
        ["Ürün 3", "6", false],
        ["Ürün 1", "2", false],
      ]);
      const denetim = await k.ham.denetimKaydi.findMany({ where: { islem: is.ISLEM.guncelle } });
      expect(denetim.map((d) => d.tablo).sort()).toEqual(["Siparis", "SiparisSatir", "SiparisSatir", "SiparisSatir"]);
    });

    it("mevcut satırın kopyaları ürün değişse de korunur; pasif ürünün mevcut satırı kalabilir", async () => {
      const id = await olustur(girdi());
      const [ilk] = await k.ham.siparisSatir.findMany({ where: { siparis_id: id }, orderBy: { id: "asc" } });
      await k.ham.urun.update({ where: { id: k.urun.id }, data: { kdv_orani: "10.00", aktif: false } });
      await guncelle(id, girdi({ satirlar: [{ satirId: ilk.id, urunId: k.urun.id, adet: "1", birimFiyat: "27,90" }] }));
      const s = await k.ham.siparisSatir.findUniqueOrThrow({ where: { id: ilk.id } });
      expect([String(s.adet), String(s.kdv_orani), String(s.kdv_tutar)]).toEqual(["1", "20", "5.58"]);
    });

    it("tedarikçi değiştirilemez; tedarikçi onayından sonra düzeltme reddedilir", async () => {
      const id = await olustur(girdi());
      expect(await alanHatalari(guncelle(id, girdi({ saticiFirmaId: k.tedB.id })))).toEqual({
        saticiFirmaId: "Kayıtlı siparişin tedarikçisi değiştirilemez; yeni sipariş girin.",
      });
      await cekirdek.denetimliAktorle(k.tedarikciA, is.ISLEM.tedarikciOnayi, (vt, a) => is.tedarikciOnayla(vt, a, id));
      await expect(guncelle(id, girdi())).rejects.toThrow(/donduruldu/);
    });
  });
});

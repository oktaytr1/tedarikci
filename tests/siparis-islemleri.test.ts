// Durum akışı servisleri ve aynı kuralların veritabanında zorlanması — gerçek PostgreSQL'e karşı.

import { beforeEach, describe, expect, it } from "vitest";
import { testVeritabaniAdresi } from "./kurulum-global";
import { temizVeKur, type Kurulum } from "./vt-yardimci";

const VT_VAR = testVeritabaniAdresi() !== null;

describe.skipIf(!VT_VAR)("durum akışı servisleri (veritabanı)", () => {
  let k: Kurulum;
  let cekirdek: typeof import("@/lib/scope-cekirdek");
  let is: typeof import("@/lib/siparis-islemleri");
  let siparisId: number;

  beforeEach(async () => {
    k = await temizVeKur();
    cekirdek = await import("@/lib/scope-cekirdek");
    is = await import("@/lib/siparis-islemleri");
    siparisId = (await k.hamSiparis()).id;
  });

  type Aktor = import("@/lib/scope-cekirdek").Aktor;
  type Vt = import("@/lib/scope-cekirdek").KapsamliDb;
  const calistir = <T>(aktor: Aktor, islem: string, fn: (vt: Vt, a: Aktor) => Promise<T>) =>
    cekirdek.denetimliAktorle(aktor, islem, fn);
  const durum = async () => (await k.ham.siparis.findUniqueOrThrow({ where: { id: siparisId } })).durum;
  const fatura = { faturaNo: "FTR-2026-001", faturaTarihi: "2026-10-12", faturaTutar: "36,00" };

  /** Alıcının onay bağlantısını kullanmasının yerine geçer (bölüm 5'te onay servisi yapacak). */
  async function aliciOnayiSimule() {
    const o = await k.ham.onay.findFirstOrThrow({ where: { siparis_id: siparisId, iptal_zamani: null } });
    await k.ham.$transaction([
      k.ham.onay.update({
        where: { id: o.id },
        data: { kullanildi_mi: true, onay_zamani: new Date(), onaylanan_tutar: "36.00", onaylanan_kalemler: [] },
      }),
      k.ham.siparis.update({ where: { id: siparisId }, data: { durum: "alici_onayladi" } }),
    ]);
  }

  it("tam akış: tedarikçi onaylar ve sevk eder, alıcı onaylar, kısmi ödemeler, admin kapatır", async () => {
    await calistir(k.tedarikciA, is.ISLEM.tedarikciOnayi, (vt, a) => is.tedarikciOnayla(vt, a, siparisId));
    expect(await durum()).toBe("tedarikci_onayladi");

    await calistir(k.tedarikciA, is.ISLEM.sevk, (vt, a) => is.sevkEt(vt, a, siparisId, fatura));
    const s = await k.ham.siparis.findUniqueOrThrow({ where: { id: siparisId } });
    expect(s).toMatchObject({ durum: "sevk_edildi", fatura_no: "FTR-2026-001" });
    expect(s.fatura_tutar?.toString()).toBe("36");

    const { token } = await calistir(k.admin, is.ISLEM.onayBaglantisi, (vt, a) => is.onayBaglantisiUret(vt, a, siparisId));
    expect(token.length).toBeGreaterThanOrEqual(43); // 32 bayt base64url
    const onay = await k.ham.onay.findFirstOrThrow({ where: { siparis_id: siparisId } });
    expect(onay.token_hash).not.toContain(token); // ham token saklanmaz
    await aliciOnayiSimule();

    // Kısmi ödeme: kapatma reddedilir.
    await calistir(k.admin, is.ISLEM.odemeEkle, (vt, a) =>
      is.odemeEkle(vt, a, siparisId, { tutar: "20,00", tarih: "2026-10-20", yontem: "havale_eft" }),
    );
    await expect(
      calistir(k.admin, is.ISLEM.odendi, (vt, a) => is.odendiOlarakKapat(vt, a, siparisId)),
    ).rejects.toThrow(/karşılamıyor/);

    // Tamamlayan ödeme: otomatik kapanmaz, admin kapatır.
    await calistir(k.admin, is.ISLEM.odemeEkle, (vt, a) =>
      is.odemeEkle(vt, a, siparisId, { tutar: "16,00", tarih: "2026-10-25", yontem: "nakit" }),
    );
    expect(await durum()).toBe("alici_onayladi");
    await calistir(k.admin, is.ISLEM.odendi, (vt, a) => is.odendiOlarakKapat(vt, a, siparisId));
    const kapali = await k.ham.siparis.findUniqueOrThrow({ where: { id: siparisId } });
    expect(kapali.durum).toBe("odendi");
    expect(kapali.odeme_tarihi?.toISOString().slice(0, 10)).toBe("2026-10-25");

    // Ödeme yönü otomatik: ödeyen alıcı, alan tedarikçi.
    const odemeler = await k.ham.odeme.findMany({ where: { siparis_id: siparisId } });
    expect(odemeler.every((o) => o.odeyen_firma_id === k.alici.id && o.alan_firma_id === k.tedA.id)).toBe(true);
  });

  it("admin tedarikçi adına onaylar ve sevk eder; denetim kaydında admin görünür", async () => {
    await calistir(k.admin, is.ISLEM.tedarikciOnayi, (vt, a) => is.tedarikciOnayla(vt, a, siparisId));
    await calistir(k.admin, is.ISLEM.sevk, (vt, a) => is.sevkEt(vt, a, siparisId, fatura));
    const kayitlar = await k.ham.denetimKaydi.findMany({
      where: { tablo: "Siparis", kayit_id: siparisId, islem: { in: [is.ISLEM.tedarikciOnayi, is.ISLEM.sevk] } },
      include: { kullanici: { select: { rol: true } } },
      orderBy: { id: "asc" },
    });
    expect(kayitlar.map((r) => [r.islem, r.kullanici?.rol])).toEqual([
      [is.ISLEM.tedarikciOnayi, "admin"],
      [is.ISLEM.sevk, "admin"],
    ]);
  });

  it("admin alıcı adına onaylayamaz: ne servisle ne doğrudan güncellemeyle", async () => {
    await calistir(k.admin, is.ISLEM.tedarikciOnayi, (vt, a) => is.tedarikciOnayla(vt, a, siparisId));
    await calistir(k.admin, is.ISLEM.sevk, (vt, a) => is.sevkEt(vt, a, siparisId, fatura));
    await expect(
      calistir(k.admin, "test", (vt) => vt.siparis.update({ where: { id: siparisId }, data: { durum: "alici_onayladi" } })),
    ).rejects.toThrow(/yalnız alıcının onay bağlantısından/);
    // Ham SQL de aynı yere takılır.
    await expect(
      k.ham.$executeRawUnsafe(`UPDATE siparis SET durum = 'alici_onayladi' WHERE id = ${siparisId}`),
    ).rejects.toThrow(/yalnız alıcının onay bağlantısından/);
  });

  it("tedarikçi başka firmanın siparişini ilerletemez; ödendi ve iptal tedarikçiye kapalı", async () => {
    await expect(
      calistir(k.tedarikciB, is.ISLEM.tedarikciOnayi, (vt, a) => is.tedarikciOnayla(vt, a, siparisId)),
    ).rejects.toThrow(/bulunamadı/);
    await expect(
      calistir(k.tedarikciA, is.ISLEM.iptal, (vt, a) => is.siparisIptal(vt, a, siparisId, "neden")),
    ).rejects.toThrow(/yalnız admin/);
    await expect(
      calistir(k.tedarikciA, is.ISLEM.odemeEkle, (vt, a) =>
        is.odemeEkle(vt, a, siparisId, { tutar: "1", tarih: "2026-10-12", yontem: "nakit" }),
      ),
    ).rejects.toThrow(/yalnız admin/);
  });

  it("sevk için fatura zorunlu; aynı tedarikçinin fatura numarası tekrar kullanılamaz", async () => {
    await calistir(k.admin, is.ISLEM.tedarikciOnayi, (vt, a) => is.tedarikciOnayla(vt, a, siparisId));
    await expect(
      calistir(k.admin, is.ISLEM.sevk, (vt, a) => is.sevkEt(vt, a, siparisId, { ...fatura, faturaNo: " " })),
    ).rejects.toThrow(/Fatura no zorunlu/);
    await calistir(k.admin, is.ISLEM.sevk, (vt, a) => is.sevkEt(vt, a, siparisId, fatura));

    const ikinci = (await k.hamSiparis()).id;
    await calistir(k.admin, is.ISLEM.tedarikciOnayi, (vt, a) => is.tedarikciOnayla(vt, a, ikinci));
    await expect(
      calistir(k.admin, is.ISLEM.sevk, (vt, a) => is.sevkEt(vt, a, ikinci, fatura)),
    ).rejects.toThrow(/Unique constraint|unique/i);
  });

  it("peşin ödeme alıcı onayından önce girilebilir ama 'ödendi' ancak alıcı onayından sonra", async () => {
    await calistir(k.admin, is.ISLEM.odemeEkle, (vt, a) =>
      is.odemeEkle(vt, a, siparisId, { tutar: "36,00", tarih: "2026-10-12", yontem: "havale_eft" }),
    );
    await expect(
      calistir(k.admin, is.ISLEM.odendi, (vt, a) => is.odendiOlarakKapat(vt, a, siparisId)),
    ).rejects.toThrow(/geçilemez/);
    expect(await durum()).toBe("girildi");
  });

  it("iptal: her durumda, nedeni zorunlu; iptal edilen sipariş donar", async () => {
    await expect(calistir(k.admin, is.ISLEM.iptal, (vt, a) => is.siparisIptal(vt, a, siparisId, "  "))).rejects.toThrow(
      /nedeni zorunlu/,
    );
    await calistir(k.admin, is.ISLEM.tedarikciOnayi, (vt, a) => is.tedarikciOnayla(vt, a, siparisId));
    await calistir(k.admin, is.ISLEM.iptal, (vt, a) => is.siparisIptal(vt, a, siparisId, "Müşteri vazgeçti"));
    await expect(
      calistir(k.admin, is.ISLEM.sevk, (vt, a) => is.sevkEt(vt, a, siparisId, fatura)),
    ).rejects.toThrow(/iptal edilmiş/);
    await expect(
      calistir(k.admin, is.ISLEM.odemeEkle, (vt, a) =>
        is.odemeEkle(vt, a, siparisId, { tutar: "1", tarih: "2026-10-12", yontem: "nakit" }),
      ),
    ).rejects.toThrow(/iptal edilmiş/);
    // İptal geri alınamaz (veritabanı).
    await expect(k.ham.siparis.update({ where: { id: siparisId }, data: { iptal_mi: false } })).rejects.toThrow(
      /iptal edilmiş; değiştirilemez/,
    );
  });

  it("kapanmış (ödendi) siparişin ödemesi iptal edilemez", async () => {
    await calistir(k.admin, is.ISLEM.tedarikciOnayi, (vt, a) => is.tedarikciOnayla(vt, a, siparisId));
    await calistir(k.admin, is.ISLEM.sevk, (vt, a) => is.sevkEt(vt, a, siparisId, fatura));
    await calistir(k.admin, is.ISLEM.onayBaglantisi, (vt, a) => is.onayBaglantisiUret(vt, a, siparisId));
    await aliciOnayiSimule();
    const odemeId = await calistir(k.admin, is.ISLEM.odemeEkle, (vt, a) =>
      is.odemeEkle(vt, a, siparisId, { tutar: "36,00", tarih: "2026-10-12", yontem: "cek" }),
    );
    await calistir(k.admin, is.ISLEM.odendi, (vt, a) => is.odendiOlarakKapat(vt, a, siparisId));
    await expect(
      calistir(k.admin, is.ISLEM.odemeIptal, (vt, a) => is.odemeIptal(vt, a, odemeId, "yanlış giriş")),
    ).rejects.toThrow(/kapandı/);
    await expect(
      k.ham.odeme.update({ where: { id: odemeId }, data: { iptal_mi: true, iptal_nedeni: "x" } }),
    ).rejects.toThrow(/kapandı/);
  });

  it("onay bağlantısı yalnız 'sevk edildi' durumunda üretilir", async () => {
    await expect(
      calistir(k.admin, is.ISLEM.onayBaglantisi, (vt, a) => is.onayBaglantisiUret(vt, a, siparisId)),
    ).rejects.toThrow(/Sevk edildi/);
    await expect(
      k.ham.onay.create({ data: { siparis_id: siparisId, token_hash: "x", son_gecerlilik: new Date(Date.now() + 1e8) } }),
    ).rejects.toThrow(/yalnız "sevk edildi"/);
  });

  it("iki admin aynı anda ilerletirse ikincisi açık hata alır (iyimser kilit)", async () => {
    const sonuclar = await Promise.allSettled([
      calistir(k.admin, is.ISLEM.tedarikciOnayi, (vt, a) => is.tedarikciOnayla(vt, a, siparisId)),
      calistir(k.admin, is.ISLEM.tedarikciOnayi, (vt, a) => is.tedarikciOnayla(vt, a, siparisId)),
    ]);
    expect(sonuclar.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await durum()).toBe("tedarikci_onayladi");
    expect(await k.ham.denetimKaydi.count({ where: { islem: is.ISLEM.tedarikciOnayi } })).toBe(1);
  });
});

describe.skipIf(!VT_VAR)("veritabanı: durum akışı ve donma (uygulama atlanırsa)", () => {
  let k: Kurulum;
  let id: number;

  beforeEach(async () => {
    k = await temizVeKur();
    id = (await k.hamSiparis()).id;
  });

  const guncelle = (data: Record<string, unknown>) => k.ham.siparis.update({ where: { id }, data });

  it("durum atlayamaz, geri gidemez", async () => {
    await expect(guncelle({ durum: "sevk_edildi", fatura_no: "F", fatura_tutar: "36" })).rejects.toThrow(/yalnız bir adım/);
    await guncelle({ durum: "tedarikci_onayladi" });
    await expect(guncelle({ durum: "girildi" })).rejects.toThrow(/yalnız bir adım/);
  });

  it("sevk edildi için fatura no ve tutar zorunlu", async () => {
    await guncelle({ durum: "tedarikci_onayladi" });
    await expect(guncelle({ durum: "sevk_edildi", fatura_no: "F" })).rejects.toThrow(/fatura no ve fatura tutarı/);
  });

  it("ödendi: ödeme toplamı yetmezse reddedilir; ödeme_tarihi yalnız ödendi ile", async () => {
    await guncelle({ durum: "tedarikci_onayladi" });
    await guncelle({ durum: "sevk_edildi", fatura_no: "F", fatura_tutar: "36.00" });
    await k.ham.onay.create({ data: { siparis_id: id, token_hash: "h", son_gecerlilik: new Date(Date.now() + 1e8) } });
    await k.ham.onay.updateMany({
      where: { siparis_id: id },
      data: { kullanildi_mi: true, onay_zamani: new Date(), onaylanan_tutar: "36.00", onaylanan_kalemler: [] },
    });
    await guncelle({ durum: "alici_onayladi" });
    await k.ham.odeme.create({
      data: { siparis_id: id, odeyen_firma_id: k.alici.id, alan_firma_id: k.tedA.id, tutar: "35.99", tarih: new Date(), yontem: "nakit" },
    });
    await expect(guncelle({ durum: "odendi", odeme_tarihi: new Date() })).rejects.toThrow(/ödenen 35.99 < fatura tutarı 36.00/);
    await expect(guncelle({ odeme_tarihi: new Date() })).rejects.toThrow(/siparis_odeme_tarihi_yalniz_odendi/);
  });

  it("'girildi' sonrası satır, taraf, vade, tutar ve komisyon donar", async () => {
    await guncelle({ durum: "tedarikci_onayladi" });
    for (const data of [
      { komisyon_oran: "3.00" },
      { vade_gun: 45 },
      { vade_tarihi: new Date("2026-12-01T00:00:00Z") },
      { odeme_tipi: "pesin" },
      { alici_firma_id: k.alici.id + 100 },
    ]) {
      await expect(guncelle(data), JSON.stringify(data)).rejects.toThrow();
    }
    await expect(guncelle({ komisyon_oran: "3.00" })).rejects.toThrow(/yalnız "girildi" iken/);
  });

  it("alıcı onayından sonra fatura bilgisi donar", async () => {
    await guncelle({ durum: "tedarikci_onayladi" });
    await guncelle({ durum: "sevk_edildi", fatura_no: "F", fatura_tutar: "36.00" });
    await guncelle({ fatura_no: "F-duzeltme" }); // alıcı onayından önce düzeltilebilir
    await k.ham.onay.create({ data: { siparis_id: id, token_hash: "h", son_gecerlilik: new Date(Date.now() + 1e8) } });
    await k.ham.onay.updateMany({
      where: { siparis_id: id },
      data: { kullanildi_mi: true, onay_zamani: new Date(), onaylanan_tutar: "36.00", onaylanan_kalemler: [] },
    });
    await guncelle({ durum: "alici_onayladi" });
    await expect(guncelle({ fatura_tutar: "40.00" })).rejects.toThrow(/fatura bilgisi değiştirilemez/);
  });

  it("toplamlar satırlarla tutarsızsa transaction sonunda reddedilir (ertelenmiş tetikleyici)", async () => {
    // Toplamı satıra uymayan güncelleme:
    await expect(guncelle({ ara_toplam: "31.00", genel_toplam: "37.00" })).rejects.toThrow(/satırlarla tutarsız/);
    // Satır eklenip toplam güncellenmezse:
    await expect(
      k.ham.siparisSatir.create({
        data: { siparis_id: id, urun_id: k.urun.id, ad: "x", birim: "adet", adet: "1", birim_fiyat: "10.00", kdv_orani: "20.00", kdv_tutar: "2.00", satir_toplam: "10.00" },
      }),
    ).rejects.toThrow(/satırlarla tutarsız/);
    // Aynı transaction'da ikisi birlikte yapılırsa kabul edilir (denetim transaction sonunda):
    await k.ham.$transaction(async (tx) => {
      await tx.siparisSatir.create({
        data: { siparis_id: id, urun_id: k.urun.id, ad: "x", birim: "adet", adet: "1", birim_fiyat: "10.00", kdv_orani: "20.00", kdv_tutar: "2.00", satir_toplam: "10.00" },
      });
      await tx.siparis.update({ where: { id }, data: { ara_toplam: "40.00", kdv_toplam: "8.00", genel_toplam: "48.00" } });
    });
    // İptal edilen satır toplamdan düşmeli:
    const satir = await k.ham.siparisSatir.findFirstOrThrow({ where: { siparis_id: id, ad: "x" } });
    await expect(k.ham.siparisSatir.update({ where: { id: satir.id }, data: { iptal_mi: true } })).rejects.toThrow(
      /satırlarla tutarsız/,
    );
  });

  it("sipariş 'girildi' dışında ya da iptalli oluşturulamaz", async () => {
    await expect(
      k.ham.siparis.create({
        data: {
          alici_firma_id: k.alici.id, satici_firma_id: k.tedA.id, odeme_tipi: "pesin", durum: "odendi", odeme_tarihi: new Date(),
          ara_toplam: "0", kdv_toplam: "0", genel_toplam: "0", komisyon_oran: "0", komisyon_tutar: "0",
        },
      }),
    ).rejects.toThrow(/"girildi" durumunda/);
  });
});

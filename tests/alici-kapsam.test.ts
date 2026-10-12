// Alıcı rolü (kapalı katalog) — kapsam kuralları ve yetkisiz erişim denemeleri, gerçek PostgreSQL'e karşı.
//
// Alıcı: aktif tedarikçilerin aktif ürünlerini ve tedarikçilerin vitrin bilgisini (ünvan, adres, telefon)
// görür. Vergi no, pasif ürün, pasif tedarikçi, başka firmanın kullanıcısı, denetim kaydı ve operasyon
// tabloları kapalı. Hiçbir şey yazamaz.

import { beforeEach, describe, expect, it } from "vitest";
import { testVeritabaniAdresi } from "./kurulum-global";
import { temizVeKur, type Kurulum } from "./vt-yardimci";

const VT_VAR = testVeritabaniAdresi() !== null;

describe.skipIf(!VT_VAR)("alıcı kapsamı (veritabanı)", () => {
  let k: Kurulum;
  let cekirdek: typeof import("@/lib/scope-cekirdek");
  type Aktor = import("@/lib/scope-cekirdek").Aktor;
  let alici: Extract<Aktor, { tip: "alici" }>;
  let digerAliciKullanici: number;
  let digerAliciFirma: number;
  let pasifUrun: number;
  let pasifTedarikci: number;
  let pasifTedarikciUrunu: number;

  beforeEach(async () => {
    k = await temizVeKur();
    cekirdek = await import("@/lib/scope-cekirdek");
    await k.ham.firma.update({ where: { id: k.tedA.id }, data: { adres: "İzmir", telefon: "0232 111 11 11" } });
    const ka = await k.ham.kullanici.create({
      data: { email: "alici@test.local", parola_hash: "gizli-hash", rol: "alici", firma_id: k.alici.id },
    });
    alici = { tip: "alici", kullaniciId: ka.id, firmaId: k.alici.id };

    digerAliciFirma = (await k.ham.firma.create({ data: { unvan: "Rakip Market", vergi_no: "4444444444", tip: "alici" } })).id;
    digerAliciKullanici = (
      await k.ham.kullanici.create({ data: { email: "rakip@test.local", parola_hash: "x", rol: "alici", firma_id: digerAliciFirma } })
    ).id;

    pasifUrun = (
      await k.ham.urun.create({
        data: { firma_id: k.tedA.id, kod: "ESKI", ad: "Pasif ürün", birim: "adet", liste_fiyat: "1.00", kdv_orani: "20", aktif: false },
      })
    ).id;
    pasifTedarikci = (await k.ham.firma.create({ data: { unvan: "Kapanmış Tedarikçi", vergi_no: "5555555555", tip: "tedarikci" } })).id;
    pasifTedarikciUrunu = (
      await k.ham.urun.create({
        data: { firma_id: pasifTedarikci, kod: "K1", ad: "Kapanmış tedarikçinin aktif ürünü", birim: "adet", liste_fiyat: "9.00", kdv_orani: "20" },
      })
    ).id;
    await k.ham.firma.update({ where: { id: pasifTedarikci }, data: { durum: "pasif" } });
  });

  const vt = (a: Aktor = alici) => cekirdek.kapsamliDbAktorle(a);
  const red = (p: Promise<unknown>) => expect(p).rejects.toThrow(cekirdek.YetkiHatasi);

  describe("görebildikleri", () => {
    it("aktif tedarikçilerin tüm aktif ürünleri (tedarikçiden bağımsız)", async () => {
      const urunler = await vt().urun.findMany({ orderBy: { id: "asc" } });
      expect(urunler.map((u) => u.id)).toEqual([k.urun.id, k.urunKg.id, k.urunB.id]);
      expect(String(urunler[0].liste_fiyat)).toBe("10");
    });

    it("ürünle birlikte tedarikçinin vitrin bilgisi (select ile)", async () => {
      const u = await vt().urun.findUniqueOrThrow({
        where: { id: k.urun.id },
        select: { ad: true, liste_fiyat: true, firma: { select: { unvan: true, adres: true, telefon: true } } },
      });
      expect(u.firma).toEqual({ unvan: "Tedarikçi Gıda Ltd.", adres: "İzmir", telefon: "0232 111 11 11" });
    });

    it("tedarikçi listesi: aktif tedarikçiler ve kendi firması; vitrin alanları dışında alan dönmez", async () => {
      const firmalar = await vt().firma.findMany({ orderBy: { id: "asc" } });
      expect(firmalar.map((f) => f.id)).toEqual([k.alici.id, k.tedA.id, k.tedB.id]);
      expect(Object.keys(firmalar[1]).sort()).toEqual(["adres", "id", "telefon", "unvan"]);
    });

    it("kendi kullanıcı kaydı; parola özeti dönmez", async () => {
      const ben = await vt().kullanici.findMany();
      expect(ben.map((x) => x.id)).toEqual([alici.kullaniciId]);
      expect(ben[0]).not.toHaveProperty("parola_hash");
    });

    it("kategoriye göre filtre ve arama", async () => {
      await k.ham.urun.update({ where: { id: k.urun.id }, data: { kategori: "Gıda" } });
      const r = await vt().urun.findMany({ where: { kategori: "Gıda", ad: { contains: "ürün", mode: "insensitive" } } });
      expect(r.map((u) => u.id)).toEqual([k.urun.id]);
    });
  });

  describe("pasif ürün ve pasif tedarikçi", () => {
    it("pasif ürün listede de id ile de görünmez", async () => {
      expect((await vt().urun.findMany()).map((u) => u.id)).not.toContain(pasifUrun);
      expect(await vt().urun.findUnique({ where: { id: pasifUrun } })).toBeNull();
      expect(await vt().urun.findFirst({ where: { aktif: false } })).toBeNull();
      await expect(vt().urun.findUniqueOrThrow({ where: { id: pasifUrun } })).rejects.toThrow();
    });

    it("pasif tedarikçinin AKTİF ürünü de görünmez; pasif tedarikçinin kendisi de", async () => {
      expect(await vt().urun.findUnique({ where: { id: pasifTedarikciUrunu } })).toBeNull();
      expect(await vt().urun.count({ where: { firma_id: pasifTedarikci } })).toBe(0);
      expect(await vt().firma.findUnique({ where: { id: pasifTedarikci } })).toBeNull();
    });

    it("OR ile filtreyi delme denemesi işe yaramaz", async () => {
      const r = await vt().urun.findMany({ where: { OR: [{ id: pasifUrun }, { id: pasifTedarikciUrunu }, { aktif: false }] } });
      expect(r).toEqual([]);
    });
  });

  describe("başka firmanın verisi", () => {
    it("başka firmanın kullanıcı kaydı id ile de okunamaz", async () => {
      expect(await vt().kullanici.findUnique({ where: { id: digerAliciKullanici } })).toBeNull();
      expect(await vt().kullanici.findFirst({ where: { email: "rakip@test.local" } })).toBeNull();
      expect(await vt().kullanici.count()).toBe(1);
    });

    it("başka alıcı firma görünmez", async () => {
      expect(await vt().firma.findUnique({ where: { id: digerAliciFirma } })).toBeNull();
      expect(await vt().firma.findFirst({ where: { unvan: "Rakip Market" } })).toBeNull();
    });

    it("vergi numarası gizli: seçilemez, filtrelenemez, sıralanamaz, cursor ile yoklanamaz", async () => {
      await red(vt().firma.findMany({ select: { unvan: true, vergi_no: true } }));
      await red(vt().firma.findMany({ where: { vergi_no: "2222222222" } }));
      await red(vt().firma.findMany({ where: { OR: [{ vergi_no: { startsWith: "2" } }] } }));
      await red(vt().firma.findMany({ orderBy: { vergi_no: "asc" } }));
      await red(vt().firma.findMany({ cursor: { vergi_no: "2222222222" } }));
      await red(vt().firma.findMany({ distinct: ["vergi_no"] }));
      await red(vt().firma.findMany({ omit: { durum: true } }));
      await red(vt().urun.findMany({ where: { firma: { vergi_no: "2222222222" } } }));
      await red(vt().urun.findMany({ select: { id: true, firma: { select: { vergi_no: true } } } }));
    });

    it("include: true ile firma kartının tamamı (vergi no dahil) alınamaz", async () => {
      await red(vt().urun.findMany({ include: { firma: true } }));
      await red(vt().firma.findMany({ include: { kullanicilar: true } }));
      await red(vt().kullanici.findMany({ include: { firma: true } }));
    });

    it("toplama ve sayım seçimiyle gizli alan ele geçirilemez", async () => {
      await red(vt().firma.aggregate({ _min: { vergi_no: true } }));
      await red(vt().firma.groupBy({ by: ["vergi_no"] }));
      await red(vt().firma.count({ select: { vergi_no: true } }));
      // Kendi parola özeti de seçilemez.
      await red(vt().kullanici.findMany({ select: { parola_hash: true } }));
    });

    it("ilişki üzerinden başka firmaların kullanıcısına, ürününe, siparişine geçilemez", async () => {
      await red(vt().firma.findMany({ select: { id: true, urunler: true } })); // pasif ürünler sızardı
      await red(vt().firma.findMany({ where: { kullanicilar: { some: { email: "rakip@test.local" } } } }));
      await red(vt().firma.findMany({ select: { id: true, _count: { select: { alici_siparisler: true } } } }));
      await red(vt().firma.findMany({ select: { id: true, _count: true } }));
      await red(vt().urun.findMany({ select: { id: true, siparis_satirlari: true } }));
      await red(vt().urun.findMany({ where: { siparis_satirlari: { some: {} } } }));
      await red(vt().urun.findMany({ orderBy: { siparis_satirlari: { _count: "desc" } } }));
      await red(vt().urun.findMany({ select: { id: true, firma: { select: { unvan: true, kullanicilar: true } } } }));
    });
  });

  describe("kapalı tablolar", () => {
    it("denetim kaydı ve dört operasyon tablosu tamamen kapalı", async () => {
      await k.hamSiparis(); // tablolarda veri varken
      await red(vt().denetimKaydi.findMany());
      await red(vt().siparis.findMany());
      await red(vt().siparis.count());
      await red(vt().siparisSatir.findMany());
      await red(vt().odeme.findMany());
      await red(vt().onay.findMany());
    });
  });

  describe("yazma", () => {
    it("alıcı hiçbir tabloya yazamaz, denetimli() içinde bile", async () => {
      const yaz = (fn: (v: import("@/lib/scope-cekirdek").KapsamliDb) => Promise<unknown>) =>
        red(cekirdek.denetimliAktorle(alici, "test.alici_yazma", fn));
      await yaz((v) => v.urun.update({ where: { id: k.urun.id }, data: { liste_fiyat: "1.00" } }));
      await yaz((v) => v.urun.updateMany({ where: {}, data: { aktif: false } }));
      await yaz((v) => v.urun.create({ data: { firma_id: k.tedA.id, kod: "Z", ad: "Z", birim: "adet", liste_fiyat: "1", kdv_orani: "20" } }));
      await yaz((v) => v.firma.update({ where: { id: k.alici.id }, data: { telefon: "0" } }));
      await yaz((v) => v.kullanici.update({ where: { id: alici.kullaniciId }, data: { aktif: true } }));
      await red(vt().urun.update({ where: { id: k.urun.id }, data: { liste_fiyat: "1.00" } }));
      expect(String((await k.ham.urun.findUniqueOrThrow({ where: { id: k.urun.id } })).liste_fiyat)).toBe("10");
      expect(await k.ham.denetimKaydi.count({ where: { islem: "test.alici_yazma" } })).toBe(0);
    });

    it("ham sorgu ve transaction kapsamlı istemcide yok", () => {
      const v = vt() as unknown as Record<string, unknown>;
      expect(v.$queryRaw).toBeUndefined();
      expect(v.$executeRawUnsafe).toBeUndefined();
      expect(v.$transaction).toBeUndefined();
    });
  });

  describe("tedarikçi kuralı korunur", () => {
    it("tedarikçi yalnız kendi ürünlerini (pasifler dahil) görür, başkasınınkini göremez", async () => {
      const a = (await vt(k.tedarikciA).urun.findMany({ orderBy: { id: "asc" } })).map((u) => u.id);
      expect(a).toEqual([k.urun.id, k.urunKg.id, pasifUrun]);
      expect(await vt(k.tedarikciA).urun.findUnique({ where: { id: k.urunB.id } })).toBeNull();
      expect((await vt(k.tedarikciB).urun.findMany()).map((u) => u.id)).toEqual([k.urunB.id]);
    });

    it("tedarikçi kendi kullanıcı kaydının parola özetini göremez", async () => {
      const [ben] = await vt(k.tedarikciA).kullanici.findMany();
      expect(ben).not.toHaveProperty("parola_hash");
    });
  });

  describe("oturum ve veritabanı kuralları", () => {
    it("alıcı aktöre çözülür; firması ya da kendisi pasifse oturum açamaz", async () => {
      const { aktorCoz } = await import("@/lib/oturum-cozumu");
      expect(await aktorCoz(alici.kullaniciId)).toEqual(alici);
      await k.ham.firma.update({ where: { id: k.alici.id }, data: { durum: "pasif" } });
      expect(await aktorCoz(alici.kullaniciId)).toBeNull();
      await k.ham.kullanici.update({ where: { id: digerAliciKullanici }, data: { aktif: false } });
      expect(await aktorCoz(digerAliciKullanici)).toBeNull();
    });

    it("alıcı kullanıcısı firmasız olamaz; tedarikçi firmasına bağlanamaz; admin firmasızdır", async () => {
      await expect(
        k.ham.kullanici.create({ data: { email: "f@test.local", parola_hash: "x", rol: "alici" } }),
      ).rejects.toThrow(/kullanici_firma_rol_uyumu/);
      await expect(
        k.ham.kullanici.create({ data: { email: "t@test.local", parola_hash: "x", rol: "alici", firma_id: k.tedA.id } }),
      ).rejects.toThrow(/alıcı tipinde olmalı/);
      await expect(
        k.ham.kullanici.create({ data: { email: "a2@test.local", parola_hash: "x", rol: "admin", firma_id: k.alici.id } }),
      ).rejects.toThrow(/kullanici_firma_rol_uyumu/);
    });

    it("fotoğraf linki yalnız https, boşluksuz, en fazla 2000 karakter; kategori boş metin olamaz", async () => {
      const guncelle = (data: Record<string, unknown>) => k.ham.urun.update({ where: { id: k.urun.id }, data });
      await guncelle({ fotograf_url: "https://cdn.ornek.com/urun/1.jpg", kategori: "Gıda", aciklama: "Uzun teknik açıklama…" });
      await expect(guncelle({ fotograf_url: "http://cdn.ornek.com/1.jpg" })).rejects.toThrow(/urun_fotograf_url_https/);
      await expect(guncelle({ fotograf_url: "javascript:alert(1)" })).rejects.toThrow(/urun_fotograf_url_https/);
      await expect(guncelle({ fotograf_url: "https://a b.com/x.jpg" })).rejects.toThrow(/urun_fotograf_url_https/);
      await expect(guncelle({ fotograf_url: `https://a.com/${"x".repeat(2000)}` })).rejects.toThrow(/urun_fotograf_url_https/);
      await expect(guncelle({ kategori: "  " })).rejects.toThrow(/urun_kategori_bos_degil/);
    });
  });
});

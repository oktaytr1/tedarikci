// Admin servisleri: ürün, firma, kullanıcı ve listeler — gerçek PostgreSQL'e karşı.

import { beforeEach, describe, expect, it } from "vitest";
import { testVeritabaniAdresi } from "./kurulum-global";
import { temizVeKur, type Kurulum } from "./vt-yardimci";

const VT_VAR = testVeritabaniAdresi() !== null;

describe.skipIf(!VT_VAR)("admin servisleri (veritabanı)", () => {
  let k: Kurulum;
  let cekirdek: typeof import("@/lib/scope-cekirdek");
  let urun: typeof import("@/lib/admin/urun");
  let firma: typeof import("@/lib/admin/firma");
  let kullanici: typeof import("@/lib/admin/kullanici");
  let listeler: typeof import("@/lib/admin/listeler");
  let hatalar: typeof import("@/lib/hatalar");
  type Aktor = import("@/lib/scope-cekirdek").Aktor;
  type Vt = import("@/lib/scope-cekirdek").KapsamliDb;

  beforeEach(async () => {
    k = await temizVeKur();
    cekirdek = await import("@/lib/scope-cekirdek");
    urun = await import("@/lib/admin/urun");
    firma = await import("@/lib/admin/firma");
    kullanici = await import("@/lib/admin/kullanici");
    listeler = await import("@/lib/admin/listeler");
    hatalar = await import("@/lib/hatalar");
  });

  const yaz = <T,>(islem: string, fn: (vt: Vt, a: Aktor) => Promise<T>, aktor: Aktor = k.admin) =>
    cekirdek.denetimliAktorle(aktor, islem, fn);
  const oku = (aktor: Aktor = k.admin) => cekirdek.kapsamliDbAktorle(aktor);
  async function alanlar(p: Promise<unknown>) {
    try {
      await p;
    } catch (e) {
      if (e instanceof hatalar.GirisHatasi) return e.alanlar;
      throw e;
    }
    throw new Error("hata bekleniyordu");
  }

  const urunGirdisi = (ek: Record<string, string> = {}) => ({
    kod: "YG-5",
    ad: "Ayçiçek yağı 5 L",
    aciklama: "  Rafine, PET şişe  ",
    kategori: "  Yağ ",
    birim: "adet",
    koliAdedi: "4",
    minSiparis: "",
    listeFiyat: "1.234,56",
    kdvOrani: "1.00",
    fotografUrl: "https://cdn.ornek.com/yag.jpg",
    ...ek,
  });

  describe("ürün", () => {
    it("tr-TR fiyat girişi, kırpma ve boş alanların NULL olması", async () => {
      const id = await yaz(urun.URUN_ISLEM.olustur, (vt, a) => urun.urunOlustur(vt, a, k.tedA.id, urunGirdisi()));
      const u = await k.ham.urun.findUniqueOrThrow({ where: { id } });
      expect([String(u.liste_fiyat), String(u.kdv_orani), u.kategori, u.aciklama, u.koli_adedi, u.min_siparis]).toEqual([
        "1234.56", "1", "Yağ", "Rafine, PET şişe", 4, null,
      ]);
      const id2 = await yaz(urun.URUN_ISLEM.olustur, (vt, a) =>
        urun.urunOlustur(vt, a, k.tedA.id, urunGirdisi({ kod: "X2", kategori: "   ", fotografUrl: "", aciklama: "" })),
      );
      const u2 = await k.ham.urun.findUniqueOrThrow({ where: { id: id2 } });
      expect([u2.kategori, u2.fotograf_url, u2.aciklama]).toEqual([null, null, null]);
    });

    it("min. sipariş miktarı birime göre okunur (kg'da ondalık, adette tamsayı)", async () => {
      const id = await yaz("t", (vt, a) =>
        urun.urunOlustur(vt, a, k.tedA.id, urunGirdisi({ kod: "MRC", birim: "kg", minSiparis: "25,5" })),
      );
      expect(String((await k.ham.urun.findUniqueOrThrow({ where: { id } })).min_siparis)).toBe("25.5");
      expect(await alanlar(yaz("t", (vt, a) => urun.urunOlustur(vt, a, k.tedA.id, urunGirdisi({ kod: "Y", minSiparis: "2,5" }))))).toEqual({
        minSiparis: expect.stringMatching(/tamsayı/),
      });
    });

    it("aynı tedarikçide aynı kod (büyük/küçük harf duyarsız) reddedilir; başka tedarikçide serbest", async () => {
      // vt-yardimci: tedA'da "U1" kodlu ürün var.
      expect(await alanlar(yaz("t", (vt, a) => urun.urunOlustur(vt, a, k.tedA.id, urunGirdisi({ kod: "u1" }))))).toEqual({
        kod: 'Bu tedarikçide "U1" kodlu ürün zaten var (Ürün 1).',
      });
      await yaz("t", (vt, a) => urun.urunOlustur(vt, a, k.tedB.id, urunGirdisi({ kod: "U1" })));
      // Düzenlemede kendi kodu engel değil, başka ürünün kodu engel.
      await yaz("t", (vt, a) => urun.urunGuncelle(vt, a, k.urun.id, urunGirdisi({ kod: "U1" })));
      expect(await alanlar(yaz("t", (vt, a) => urun.urunGuncelle(vt, a, k.urunKg.id, urunGirdisi({ kod: "U1" }))))).toHaveProperty("kod");
    });

    it("alan hataları birlikte döner: fiyat, KDV, link", async () => {
      const h = await alanlar(
        yaz("t", (vt, a) =>
          urun.urunOlustur(vt, a, k.tedA.id, urunGirdisi({ kod: "Z", listeFiyat: "12,345", kdvOrani: "18.00" })),
        ),
      );
      expect(Object.keys(h).sort()).toEqual(["kdvOrani", "listeFiyat"]);
      for (const link of ["http://a.com/x.jpg", "javascript:alert(1)", "https://a b.com/x.jpg", `https://a.com/${"x".repeat(2000)}`]) {
        expect(await alanlar(yaz("t", (vt, a) => urun.urunOlustur(vt, a, k.tedA.id, urunGirdisi({ kod: "Z", fotografUrl: link }))))).toHaveProperty(
          "fotografUrl",
        );
      }
    });

    it("KDV: listede olmayan oran yeni üründe reddedilir; eski ürün listeden çıkmış oranını korur", async () => {
      // urunKg'nin oranı listede (%1); listede olmayan eski bir oranı ham olarak ver: %18
      await k.ham.urun.update({ where: { id: k.urunKg.id }, data: { kdv_orani: "18.00" } });
      await yaz("t", (vt, a) => urun.urunGuncelle(vt, a, k.urunKg.id, urunGirdisi({ kod: "U2", kdvOrani: "18.00", listeFiyat: "150" })));
      expect(String((await k.ham.urun.findUniqueOrThrow({ where: { id: k.urunKg.id } })).kdv_orani)).toBe("18");
      // Başka bir ürüne %18 verilemez.
      expect(await alanlar(yaz("t", (vt, a) => urun.urunGuncelle(vt, a, k.urun.id, urunGirdisi({ kod: "U1", kdvOrani: "18.00" }))))).toHaveProperty(
        "kdvOrani",
      );
    });

    it("alıcı firmaya ürün eklenemez; tedarikçi düzenlemede değişmez", async () => {
      expect(await alanlar(yaz("t", (vt, a) => urun.urunOlustur(vt, a, k.alici.id, urunGirdisi())))).toEqual({
        firmaId: "Tedarikçi firma seçin.",
      });
      await yaz("t", (vt, a) => urun.urunGuncelle(vt, a, k.urun.id, { ...urunGirdisi({ kod: "U1" }), firmaId: k.tedB.id }));
      expect((await k.ham.urun.findUniqueOrThrow({ where: { id: k.urun.id } })).firma_id).toBe(k.tedA.id);
    });

    it("pasife alma: katalogdan düşer, admin listesinde kalır; tekrar aktif edilebilir", async () => {
      const alici: Aktor = {
        tip: "alici",
        kullaniciId: (await k.ham.kullanici.create({ data: { email: "al@test.local", parola_hash: "x", rol: "alici", firma_id: k.alici.id } })).id,
        firmaId: k.alici.id,
      };
      await yaz(urun.URUN_ISLEM.durum, (vt, a) => urun.urunDurumDegistir(vt, a, k.urun.id, false));
      expect(await oku(alici).urun.findUnique({ where: { id: k.urun.id } })).toBeNull();
      const liste = await listeler.urunListesi(oku(), k.admin, listeler.urunFiltresiOku({}));
      expect(liste.satirlar.find((s) => s.id === k.urun.id)?.aktif).toBe(false);
      await expect(yaz("t", (vt, a) => urun.urunDurumDegistir(vt, a, k.urun.id, false))).rejects.toThrow(/zaten pasif/);
      await yaz("t", (vt, a) => urun.urunDurumDegistir(vt, a, k.urun.id, true));
      expect(await oku(alici).urun.findUnique({ where: { id: k.urun.id } })).not.toBeNull();
    });

    it("fiyat değişikliği denetim kaydında eski ve yeni değerle görünür", async () => {
      await yaz(urun.URUN_ISLEM.guncelle, (vt, a) =>
        urun.urunGuncelle(vt, a, k.urun.id, urunGirdisi({ kod: "U1", ad: "Ürün 1", listeFiyat: "12,50", kdvOrani: "20.00" })),
      );
      const kayit = await k.ham.denetimKaydi.findFirstOrThrow({ where: { islem: urun.URUN_ISLEM.guncelle, tablo: "Urun", kayit_id: k.urun.id } });
      expect(kayit.kullanici_id).toBe(k.admin.kullaniciId);
      expect((kayit.eski as Record<string, unknown>).liste_fiyat).toBe("10");
      expect((kayit.yeni as Record<string, unknown>).liste_fiyat).toBe("12.5");
    });

    it("öneriler: mevcut kategoriler tekrarsız ve sıralı; birimler varsayılanlarla", async () => {
      await k.ham.urun.update({ where: { id: k.urun.id }, data: { kategori: "Yağ" } });
      await k.ham.urun.update({ where: { id: k.urunKg.id }, data: { kategori: "Bakliyat" } });
      await k.ham.urun.update({ where: { id: k.urunB.id }, data: { kategori: "Yağ" } });
      const o = await urun.urunOnerileri(oku(), k.admin);
      expect(o.kategoriler).toEqual(["Bakliyat", "Yağ"]);
      expect(o.birimler).toEqual(expect.arrayContaining(["adet", "kg"]));
    });
  });

  describe("firma", () => {
    const firmaGirdisi = (ek: Record<string, string> = {}) => ({
      unvan: "Yeni Market Ltd.",
      vergiNo: "0123456789",
      tip: "alici",
      adres: " Ankara ",
      telefon: "",
      ...ek,
    });

    it("vergi no metin olarak saklanır (baştaki sıfır korunur); biçim ve tekrar denetlenir", async () => {
      const id = await yaz(firma.FIRMA_ISLEM.olustur, (vt, a) => firma.firmaOlustur(vt, a, firmaGirdisi()));
      const f = await k.ham.firma.findUniqueOrThrow({ where: { id } });
      expect([f.vergi_no, f.adres, f.telefon]).toEqual(["0123456789", "Ankara", null]);
      for (const vergiNo of ["12345", "123456789012", "12345678ab", "123 456 7890"]) {
        expect(await alanlar(yaz("t", (vt, a) => firma.firmaOlustur(vt, a, firmaGirdisi({ vergiNo }))))).toHaveProperty("vergiNo");
      }
      expect(await alanlar(yaz("t", (vt, a) => firma.firmaOlustur(vt, a, firmaGirdisi({ unvan: "Başka" }))))).toEqual({
        vergiNo: 'Bu vergi numarası "Yeni Market Ltd." firmasında kayıtlı.',
      });
      // 11 haneli TCKN kabul.
      await yaz("t", (vt, a) => firma.firmaOlustur(vt, a, firmaGirdisi({ vergiNo: "01234567890" })));
    });

    it("tip değişikliği kayıtlarla çelişemez (servis mesajı ve veritabanı tetikleyicisi)", async () => {
      // tedA'nın ürünleri var → alıcı yapılamaz.
      expect(
        await alanlar(yaz("t", (vt, a) => firma.firmaGuncelle(vt, a, k.tedA.id, firmaGirdisi({ unvan: "Tedarikçi Gıda Ltd.", vergiNo: "2222222222", tip: "alici" })))),
      ).toEqual({ tip: expect.stringMatching(/"Alıcı" yapılamaz: 2 ürünü, 1 tedarikçi kullanıcısı/) });
      await expect(k.ham.firma.update({ where: { id: k.tedA.id }, data: { tip: "alici" } })).rejects.toThrow(/"alıcı" yapılamaz/);
      // Alıcı kullanıcısı olan firma tedarikçi yapılamaz.
      await k.ham.kullanici.create({ data: { email: "al@test.local", parola_hash: "x", rol: "alici", firma_id: k.alici.id } });
      await expect(k.ham.firma.update({ where: { id: k.alici.id }, data: { tip: "tedarikci" } })).rejects.toThrow(/"tedarikçi" yapılamaz/);
      // "Her ikisi" her zaman serbest.
      await yaz("t", (vt, a) => firma.firmaGuncelle(vt, a, k.alici.id, firmaGirdisi({ unvan: "Alıcı Market A.Ş.", vergiNo: "1111111111", tip: "her_ikisi" })));
    });

    it("pasife alınan tedarikçinin ürünleri katalogdan, kullanıcıları oturumdan düşer", async () => {
      const { aktorCoz } = await import("@/lib/oturum-cozumu");
      const alici: Aktor = {
        tip: "alici",
        kullaniciId: (await k.ham.kullanici.create({ data: { email: "al@test.local", parola_hash: "x", rol: "alici", firma_id: k.alici.id } })).id,
        firmaId: k.alici.id,
      };
      await yaz(firma.FIRMA_ISLEM.durum, (vt, a) => firma.firmaDurumDegistir(vt, a, k.tedA.id, false));
      expect(await oku(alici).urun.count({ where: { firma_id: k.tedA.id } })).toBe(0);
      expect(await aktorCoz(k.tedarikciA.kullaniciId)).toBeNull();
      await expect(yaz("t", (vt, a) => firma.firmaDurumDegistir(vt, a, k.tedA.id, false))).rejects.toThrow(/zaten pasif/);
    });
  });

  describe("kullanıcı", () => {
    const kullaniciGirdisi = (ek: Record<string, unknown> = {}) => ({
      email: "  Yeni.Kullanici@Ornek.COM ",
      rol: "alici",
      firmaId: k.alici.id,
      parola: "cok-gizli-parola-1",
      ...ek,
    });

    it("açılır: e-posta küçük harf, parola özetlenir ve hiçbir dönüşte yoktur", async () => {
      const id = await yaz(kullanici.KULLANICI_ISLEM.olustur, (vt, a) => kullanici.kullaniciOlustur(vt, a, kullaniciGirdisi()));
      expect(typeof id).toBe("number");
      const kk = await k.ham.kullanici.findUniqueOrThrow({ where: { id } });
      expect(kk.email).toBe("yeni.kullanici@ornek.com");
      expect(kk.parola_hash).toMatch(/^\$2[aby]\$12\$/);
      expect(kk.parola_hash).not.toContain("cok-gizli");
      const kayit = await k.ham.denetimKaydi.findFirstOrThrow({ where: { islem: kullanici.KULLANICI_ISLEM.olustur } });
      expect(JSON.stringify(kayit.yeni)).not.toContain("cok-gizli");
      expect((kayit.yeni as Record<string, unknown>).parola_hash).toBe("[gizli]");
      const liste = await listeler.kullaniciListesi(oku(), k.admin, listeler.kullaniciFiltresiOku({}));
      expect(JSON.stringify(liste)).not.toContain("$2");
    });

    it("rol-firma kuralları: admin firmasız, tedarikçi/alıcı firmalı ve uyumlu tipte", async () => {
      expect(await alanlar(yaz("t", (vt, a) => kullanici.kullaniciOlustur(vt, a, kullaniciGirdisi({ rol: "admin" }))))).toEqual({
        firmaId: "Admin bir firmaya bağlı olmaz.",
      });
      expect(await alanlar(yaz("t", (vt, a) => kullanici.kullaniciOlustur(vt, a, kullaniciGirdisi({ firmaId: null }))))).toEqual({
        firmaId: "Tedarikçi ve alıcı için firma zorunlu.",
      });
      expect(await alanlar(yaz("t", (vt, a) => kullanici.kullaniciOlustur(vt, a, kullaniciGirdisi({ firmaId: k.tedA.id }))))).toEqual({
        firmaId: "Alıcı kullanıcısı için alıcı tipinde bir firma seçin.",
      });
      expect(
        await alanlar(yaz("t", (vt, a) => kullanici.kullaniciOlustur(vt, a, kullaniciGirdisi({ rol: "tedarikci", firmaId: k.alici.id })))),
      ).toEqual({ firmaId: "Tedarikçi kullanıcısı için tedarikçi tipinde bir firma seçin." });
      await yaz("t", (vt, a) => kullanici.kullaniciOlustur(vt, a, kullaniciGirdisi({ rol: "admin", firmaId: null, email: "a2@x.com" })));
    });

    it("e-posta tekrarı ve parola kuralı", async () => {
      expect(await alanlar(yaz("t", (vt, a) => kullanici.kullaniciOlustur(vt, a, kullaniciGirdisi({ email: "A@test.local", firmaId: k.tedA.id, rol: "tedarikci" }))))).toEqual({
        email: "Bu e-posta adresi başka bir kullanıcıda kayıtlı.",
      });
      expect(await alanlar(yaz("t", (vt, a) => kullanici.kullaniciOlustur(vt, a, kullaniciGirdisi({ parola: "kisa" }))))).toHaveProperty("parola");
    });

    it("e-posta düzeltilir; denetim kaydında eski ve yeni değer; rol ve firma değişmez", async () => {
      await yaz(kullanici.KULLANICI_ISLEM.eposta, (vt, a) => kullanici.kullaniciEpostaDuzelt(vt, a, k.tedarikciA.kullaniciId, " Dogru@Test.Local "));
      const kk = await k.ham.kullanici.findUniqueOrThrow({ where: { id: k.tedarikciA.kullaniciId } });
      expect([kk.email, kk.rol, kk.firma_id]).toEqual(["dogru@test.local", "tedarikci", k.tedA.id]);
      const kayit = await k.ham.denetimKaydi.findFirstOrThrow({ where: { islem: kullanici.KULLANICI_ISLEM.eposta } });
      expect([kayit.eski, kayit.yeni]).toEqual([{ email: "a@test.local" }, { email: "dogru@test.local" }]);
      expect(await alanlar(yaz("t", (vt, a) => kullanici.kullaniciEpostaDuzelt(vt, a, k.tedarikciA.kullaniciId, "b@test.local")))).toEqual({
        email: "Bu e-posta adresi başka bir kullanıcıda kayıtlı.",
      });
    });

    it("parola sıfırlama: yeni özet, denetim kaydında yalnız '[gizli]'", async () => {
      const once = (await k.ham.kullanici.findUniqueOrThrow({ where: { id: k.tedarikciA.kullaniciId } })).parola_hash;
      await yaz(kullanici.KULLANICI_ISLEM.parola, (vt, a) => kullanici.kullaniciParolaSifirla(vt, a, k.tedarikciA.kullaniciId, "yepyeni-parola-12"));
      const sonra = (await k.ham.kullanici.findUniqueOrThrow({ where: { id: k.tedarikciA.kullaniciId } })).parola_hash;
      expect(sonra).not.toBe(once);
      const { parolaDogrula } = await import("@/lib/password");
      expect(await parolaDogrula("yepyeni-parola-12", sonra)).toBe(true);
      const kayit = await k.ham.denetimKaydi.findFirstOrThrow({ where: { islem: kullanici.KULLANICI_ISLEM.parola } });
      expect(kayit.yeni).toEqual({ parola_hash: "[gizli]" });
      expect(JSON.stringify(kayit)).not.toContain("yepyeni");
    });

    it("pasife alma: kendini ve son aktif admini pasife alamaz", async () => {
      await expect(
        yaz("t", (vt, a) => kullanici.kullaniciDurumDegistir(vt, a, k.admin.kullaniciId, false)),
      ).rejects.toThrow(/Kendinizi pasife alamazsınız/);
      const ikinci = await yaz("t", (vt, a) =>
        kullanici.kullaniciOlustur(vt, a, kullaniciGirdisi({ rol: "admin", firmaId: null, email: "admin2@test.local" })),
      );
      const admin2: Aktor = { tip: "admin", kullaniciId: ikinci };
      // İkinci admin ilkini pasife alabilir (ikinci aktif admin kalıyor)…
      await yaz("t", (vt, a) => kullanici.kullaniciDurumDegistir(vt, a, k.admin.kullaniciId, false), admin2);
      // …ama tek aktif admin kendisi olduğunda başka biri de onu pasife alamaz (burada kendisi; önce o kural).
      await k.ham.kullanici.update({ where: { id: k.admin.kullaniciId }, data: { aktif: true } });
      await k.ham.kullanici.update({ where: { id: ikinci }, data: { aktif: false } });
      // Artık tek aktif admin k.admin; admin2 (pasif olsa da) servis seviyesinde denensin:
      await expect(
        yaz("t", (vt, a) => kullanici.kullaniciDurumDegistir(vt, a, k.admin.kullaniciId, false), admin2),
      ).rejects.toThrow(/Son aktif admin/);
      // Alıcı/tedarikçi kullanıcısı pasife alınır, oturum açamaz.
      await yaz("t", (vt, a) => kullanici.kullaniciDurumDegistir(vt, a, k.tedarikciA.kullaniciId, false));
      const { aktorCoz } = await import("@/lib/oturum-cozumu");
      expect(await aktorCoz(k.tedarikciA.kullaniciId)).toBeNull();
    });
  });

  describe("yetki", () => {
    it("tedarikçi ve alıcı hiçbir admin servisini çalıştıramaz (okuma dahil)", async () => {
      const alici: Aktor = {
        tip: "alici",
        kullaniciId: (await k.ham.kullanici.create({ data: { email: "al@test.local", parola_hash: "x", rol: "alici", firma_id: k.alici.id } })).id,
        firmaId: k.alici.id,
      };
      for (const aktor of [k.tedarikciA, alici] as Aktor[]) {
        const red = (p: Promise<unknown>) => expect(p).rejects.toThrow(cekirdek.YetkiHatasi);
        await red(yaz("t", (vt, a) => urun.urunOlustur(vt, a, k.tedA.id, urunGirdisi({ kod: "Q" })), aktor));
        await red(yaz("t", (vt, a) => urun.urunGuncelle(vt, a, k.urun.id, urunGirdisi({ kod: "U1" })), aktor));
        await red(yaz("t", (vt, a) => urun.urunDurumDegistir(vt, a, k.urun.id, false), aktor));
        await red(yaz("t", (vt, a) => firma.firmaOlustur(vt, a, { unvan: "x", vergiNo: "9999999999", tip: "alici" }), aktor));
        await red(yaz("t", (vt, a) => firma.firmaDurumDegistir(vt, a, k.tedB.id, false), aktor));
        await red(yaz("t", (vt, a) => kullanici.kullaniciOlustur(vt, a, { email: "z@z.com", rol: "admin", firmaId: null, parola: "x".repeat(12) }), aktor));
        await red(yaz("t", (vt, a) => kullanici.kullaniciParolaSifirla(vt, a, k.admin.kullaniciId, "x".repeat(12)), aktor));
        await red(yaz("t", (vt, a) => kullanici.kullaniciDurumDegistir(vt, a, k.admin.kullaniciId, false), aktor));
        await red(listeler.urunListesi(oku(aktor), aktor, {}));
        await red(listeler.kullaniciListesi(oku(aktor), aktor, {}));
        await red(urun.urunOnerileri(oku(aktor), aktor));
      }
      expect(String((await k.ham.urun.findUniqueOrThrow({ where: { id: k.urun.id } })).liste_fiyat)).toBe("10");
    });
  });

  describe("listeler", () => {
    it("ürün: arama, tedarikçi/kategori/durum filtresi, sıralama, sayfalama; geçersiz parametre yok sayılır", async () => {
      await k.ham.urun.update({ where: { id: k.urunKg.id }, data: { kategori: "Bakliyat", aktif: false } });
      const l = (sp: Record<string, string>) => listeler.urunListesi(oku(), k.admin, listeler.urunFiltresiOku(sp));
      expect((await l({})).satirlar.map((s) => s.kod)).toEqual(["B1", "U1", "U2"]);
      expect((await l({ q: "kg" })).satirlar.map((s) => s.kod)).toEqual(["U2"]);
      expect((await l({ tedarikci: String(k.tedB.id) })).satirlar.map((s) => s.kod)).toEqual(["B1"]);
      expect((await l({ kategori: "Bakliyat" })).satirlar.map((s) => s.kod)).toEqual(["U2"]);
      expect((await l({ durum: "pasif" })).satirlar.map((s) => [s.kod, s.aktif])).toEqual([["U2", false]]);
      expect((await l({ sirala: "liste_fiyat", yon: "azalan" })).satirlar.map((s) => s.kod)).toEqual(["U2", "U1", "B1"]);
      expect((await l({ sirala: "parola_hash", durum: "uydurma", sayfa: "-1" })).satirlar).toHaveLength(3);
      const r = await l({});
      expect(r.satirlar.find((s) => s.kod === "U1")?.listeFiyat).toBe("10.00");
      expect([r.toplam, r.sayfa, r.sayfaSayisi]).toEqual([3, 1, 1]);
    });

    it("firma ve kullanıcı listeleri", async () => {
      const f = await listeler.firmaListesi(oku(), k.admin, listeler.firmaFiltresiOku({ tip: "tedarikci" }));
      expect(f.satirlar.map((x) => [x.unvan, x.urunSayisi, x.kullaniciSayisi])).toEqual([
        ["Başka Tedarikçi", 1, 1],
        ["Tedarikçi Gıda Ltd.", 2, 1],
      ]);
      expect((await listeler.firmaListesi(oku(), k.admin, listeler.firmaFiltresiOku({ q: "22222" }))).satirlar.map((x) => x.unvan)).toEqual([
        "Tedarikçi Gıda Ltd.",
      ]);
      const ku = await listeler.kullaniciListesi(oku(), k.admin, listeler.kullaniciFiltresiOku({ rol: "tedarikci" }));
      expect(ku.satirlar.map((x) => [x.email, x.firma])).toEqual([
        ["a@test.local", "Tedarikçi Gıda Ltd."],
        ["b@test.local", "Başka Tedarikçi"],
      ]);
    });
  });
});

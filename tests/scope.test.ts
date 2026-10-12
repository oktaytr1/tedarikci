// Merkezi kapsam katmanı, denetim kaydı ve veritabanı kuralları — gerçek PostgreSQL'e karşı.
// TEST_DATABASE_URL yoksa atlanır (bkz. tests/kurulum-global.ts).

import { readFileSync } from "node:fs";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import type { Aktor, KapsamliDb } from "@/lib/scope-cekirdek";
import { testVeritabaniAdresi } from "./kurulum-global";

const VT_VAR = testVeritabaniAdresi() !== null;

// ---------------------------------------------------------------------------
// İlişki haritası şemayla aynı mı? (Veritabanı gerektirmez.)
// ---------------------------------------------------------------------------

describe("ILISKILER haritası", () => {
  it("schema.prisma'daki tüm ilişki alanlarını birebir içerir", async () => {
    const { ILISKILER } = await import("@/lib/scope-cekirdek");
    const sema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
    const modeller = [...sema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)];
    const adlar = new Set(modeller.map((m) => m[1]));
    const semadan: Record<string, Record<string, string>> = {};
    for (const [, ad, govde] of modeller) {
      semadan[ad] = {};
      for (const satir of govde.split("\n")) {
        const m = satir.trim().match(/^(\w+)\s+(\w+)(\[\]|\?)?/);
        if (m && adlar.has(m[2])) semadan[ad][m[1]] = m[2];
      }
    }
    expect(ILISKILER).toEqual(semadan);
  });
});

// ---------------------------------------------------------------------------
// Veritabanı testleri
// ---------------------------------------------------------------------------

describe.skipIf(!VT_VAR)("kapsam katmanı (veritabanı)", () => {
  let cekirdek: typeof import("@/lib/scope-cekirdek");
  let ham: typeof import("@/lib/db").db;

  const admin: Aktor = { tip: "admin", kullaniciId: 0 };
  let tedA: Aktor;
  let tedB: Aktor;
  const id = { aliciX: 0, aliciY: 0, tedFirmaA: 0, tedFirmaB: 0, urunA: 0, urunB: 0, sipA: 0, sipB: 0 };

  beforeAll(async () => {
    cekirdek = await import("@/lib/scope-cekirdek");
    ham = (await import("@/lib/db")).db;
  });

  beforeEach(async () => {
    await ham.$executeRawUnsafe(
      `TRUNCATE firma, kullanici, urun, siparis, siparis_satir, odeme, onay, denetim_kaydi RESTART IDENTITY CASCADE`,
    );
    // Admin kullanıcısı (denetim kaydındaki kullanici_id için gerçek kayıt).
    const a = await ham.kullanici.create({ data: { email: "admin@test.local", parola_hash: "x", rol: "admin" } });
    admin.kullaniciId = a.id;

    await cekirdek.denetimliAktorle(admin, "test.kurulum", async (vt) => {
      id.aliciX = (await vt.firma.create({ data: { unvan: "Alıcı X", vergi_no: "1000000001", tip: "alici" } })).id;
      id.aliciY = (await vt.firma.create({ data: { unvan: "Alıcı Y", vergi_no: "1000000002", tip: "alici" } })).id;
      id.tedFirmaA = (await vt.firma.create({ data: { unvan: "Tedarikçi A", vergi_no: "2000000001", tip: "tedarikci" } })).id;
      id.tedFirmaB = (await vt.firma.create({ data: { unvan: "Tedarikçi B", vergi_no: "2000000002", tip: "tedarikci" } })).id;
      id.urunA = (await vt.urun.create({
        data: { firma_id: id.tedFirmaA, kod: "A1", ad: "Ürün A", birim: "adet", liste_fiyat: "10.00", kdv_orani: "20.00" },
      })).id;
      id.urunB = (await vt.urun.create({
        data: { firma_id: id.tedFirmaB, kod: "B1", ad: "Ürün B", birim: "adet", liste_fiyat: "20.00", kdv_orani: "10.00" },
      })).id;
      const siparis = (satici: number, alici: number, urun: number) =>
        vt.siparis.create({
          data: {
            alici_firma_id: alici,
            satici_firma_id: satici,
            odeme_tipi: "pesin",
            ara_toplam: "10.00",
            kdv_toplam: "2.00",
            genel_toplam: "12.00",
            komisyon_oran: "2.00",
            komisyon_tutar: "0.20",
            satirlar: {
              create: [{ urun_id: urun, ad: "kopya", birim: "adet", adet: "1", birim_fiyat: "10.00", kdv_orani: "20.00", kdv_tutar: "2.00", satir_toplam: "10.00" }],
            },
          },
        });
      id.sipA = (await siparis(id.tedFirmaA, id.aliciX, id.urunA)).id;
      id.sipB = (await siparis(id.tedFirmaB, id.aliciY, id.urunB)).id;
    });

    const kA = await ham.kullanici.create({ data: { email: "a@test.local", parola_hash: "x", rol: "tedarikci", firma_id: id.tedFirmaA } });
    const kB = await ham.kullanici.create({ data: { email: "b@test.local", parola_hash: "x", rol: "tedarikci", firma_id: id.tedFirmaB } });
    tedA = { tip: "tedarikci", kullaniciId: kA.id, firmaId: id.tedFirmaA };
    tedB = { tip: "tedarikci", kullaniciId: kB.id, firmaId: id.tedFirmaB };
  });

  const oku = (a: Aktor): KapsamliDb => cekirdek.kapsamliDbAktorle(a);

  describe("tedarikçi kendi firma_id'si dışına çıkamaz", () => {
    it("sipariş listesinde yalnız kendi siparişleri", async () => {
      const liste = await oku(tedA).siparis.findMany();
      expect(liste.map((s) => s.id)).toEqual([id.sipA]);
      expect(await oku(tedA).siparis.count()).toBe(1);
    });

    it("başka firmanın siparişi id ile de okunamaz", async () => {
      expect(await oku(tedA).siparis.findUnique({ where: { id: id.sipB } })).toBeNull();
      expect(await oku(tedA).siparis.findFirst({ where: { satici_firma_id: id.tedFirmaB } })).toBeNull();
      await expect(oku(tedA).siparis.findUniqueOrThrow({ where: { id: id.sipB } })).rejects.toThrow();
    });

    it("filtreyi OR ile delmeye çalışmak işe yaramaz", async () => {
      const liste = await oku(tedA).siparis.findMany({ where: { OR: [{ id: id.sipB }, { satici_firma_id: id.tedFirmaB }] } });
      expect(liste).toEqual([]);
    });

    it("satır, ödeme, ürün ve kullanıcı da kapsamlı", async () => {
      const satirlar = await oku(tedA).siparisSatir.findMany();
      expect(satirlar.every((s) => s.siparis_id === id.sipA)).toBe(true);
      expect((await oku(tedA).urun.findMany()).map((u) => u.id)).toEqual([id.urunA]);
      expect((await oku(tedA).kullanici.findMany()).map((k) => k.id)).toEqual([tedA.kullaniciId]);
    });

    it("firma: kendisi ve kendi siparişlerinin alıcısı; başka alıcı ve tedarikçi görünmez", async () => {
      const firmalar = await oku(tedA).firma.findMany({ orderBy: { id: "asc" } });
      expect(firmalar.map((f) => f.id).sort()).toEqual([id.aliciX, id.tedFirmaA].sort());
    });

    it("izinli ilişkiler gezilebilir (sipariş → alıcı, satırlar → ürün)", async () => {
      const s = await oku(tedA).siparis.findUnique({
        where: { id: id.sipA },
        include: { alici: true, satirlar: { include: { urun: true } } },
      });
      expect(s?.alici.unvan).toBe("Alıcı X");
      expect(s?.satirlar[0].urun.kod).toBe("A1");
    });

    it("include ile başka firmaların siparişlerine geçilemez", async () => {
      await expect(
        oku(tedA).siparis.findMany({ include: { alici: { include: { alici_siparisler: true } } } }),
      ).rejects.toThrow(cekirdek.YetkiHatasi);
      await expect(oku(tedA).urun.findMany({ include: { siparis_satirlari: true } })).rejects.toThrow(cekirdek.YetkiHatasi);
    });

    it("where ilişki filtresiyle bilgi sızdırılamaz", async () => {
      await expect(
        oku(tedA).firma.findMany({ where: { alici_siparisler: { some: { satici_firma_id: id.tedFirmaB } } } }),
      ).rejects.toThrow(cekirdek.YetkiHatasi);
      await expect(
        oku(tedA).siparis.findMany({ where: { alici: { satici_siparisler: { some: {} } } } }),
      ).rejects.toThrow(cekirdek.YetkiHatasi);
    });

    it("select içinde de, _count ile de ilişki sızdırılamaz", async () => {
      await expect(
        oku(tedA).firma.findMany({ select: { id: true, alici_siparisler: true } }),
      ).rejects.toThrow(cekirdek.YetkiHatasi);
      await expect(oku(tedA).firma.findMany({ include: { _count: true } })).rejects.toThrow(cekirdek.YetkiHatasi);
      await expect(
        oku(tedA).firma.findMany({ select: { _count: { select: { alici_siparisler: true } } } }),
      ).rejects.toThrow(cekirdek.YetkiHatasi);
    });

    it("orderBy ile izinsiz ilişkiye uzanılamaz", async () => {
      await expect(
        oku(tedA).firma.findMany({ orderBy: { alici_siparisler: { _count: "desc" } } }),
      ).rejects.toThrow(cekirdek.YetkiHatasi);
    });

    it("onay ve denetim kaydı tedarikçiye tamamen kapalı", async () => {
      await expect(oku(tedA).onay.findMany()).rejects.toThrow(cekirdek.YetkiHatasi);
      await expect(oku(tedA).denetimKaydi.findMany()).rejects.toThrow(cekirdek.YetkiHatasi);
    });
  });

  describe("yazma kuralları", () => {
    it("yazma yalnız denetimli() içinde", async () => {
      await expect(
        oku(admin).siparis.update({ where: { id: id.sipA }, data: { durum: "tedarikci_onayladi" } }),
      ).rejects.toThrow(/denetimli/);
    });

    it("silme, upsert ve createMany kapsamlı istemcide yok", async () => {
      const vt = oku(admin) as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>>>;
      // eslint-disable-next-line no-restricted-syntax -- silmenin ENGELLENDİĞİNİ doğrulayan test
      await expect(vt.siparis.delete({ where: { id: id.sipA } })).rejects.toThrow(cekirdek.YetkiHatasi);
      // eslint-disable-next-line no-restricted-syntax -- silmenin ENGELLENDİĞİNİ doğrulayan test
      await expect(vt.siparis.deleteMany({})).rejects.toThrow(cekirdek.YetkiHatasi);
      await expect(vt.firma.upsert({})).rejects.toThrow(cekirdek.YetkiHatasi);
      await expect(vt.firma.createMany({ data: [] })).rejects.toThrow(cekirdek.YetkiHatasi);
    });

    it("tedarikçi başka firmanın siparişini güncelleyemez", async () => {
      await expect(
        cekirdek.denetimliAktorle(tedA, "test", (vt) =>
          vt.siparis.update({ where: { id: id.sipB }, data: { durum: "tedarikci_onayladi" } }),
        ),
      ).rejects.toThrow();
      const b = await ham.siparis.findUniqueOrThrow({ where: { id: id.sipB } });
      expect(b.durum).toBe("girildi");
    });

    it("tedarikçinin updateMany'si yalnız kendi siparişlerine dokunur", async () => {
      const r = await cekirdek.denetimliAktorle(tedB, "test", (vt) =>
        vt.siparis.updateMany({ where: {}, data: { durum: "tedarikci_onayladi" } }),
      );
      expect(r.count).toBe(1);
      expect((await ham.siparis.findUniqueOrThrow({ where: { id: id.sipA } })).durum).toBe("girildi");
      expect((await ham.siparis.findUniqueOrThrow({ where: { id: id.sipB } })).durum).toBe("tedarikci_onayladi");
    });

    it("tedarikçi izinli alanlar dışında yazamaz (satıcı değiştirme, tutar, iptal)", async () => {
      for (const data of [{ satici_firma_id: id.tedFirmaB }, { genel_toplam: "1.00" }, { iptal_mi: true }]) {
        await expect(
          cekirdek.denetimliAktorle(tedA, "test", (vt) => vt.siparis.update({ where: { id: id.sipA }, data })),
        ).rejects.toThrow(cekirdek.YetkiHatasi);
      }
    });

    it("tedarikçi sipariş, ürün, firma oluşturamaz", async () => {
      await expect(
        cekirdek.denetimliAktorle(tedA, "test", (vt) =>
          vt.urun.create({ data: { firma_id: id.tedFirmaA, kod: "Z", ad: "Z", birim: "adet", liste_fiyat: "1", kdv_orani: "20" } }),
        ),
      ).rejects.toThrow(cekirdek.YetkiHatasi);
    });

    it("admin onayı alıcı adına oluşturamaz (doğrudan ya da iç içe)", async () => {
      const gelecek = new Date(Date.now() + 86_400_000);
      await expect(
        cekirdek.denetimliAktorle(admin, "test", (vt) =>
          vt.onay.create({
            data: { siparis_id: id.sipA, token_hash: "h1", son_gecerlilik: gelecek, kullanildi_mi: true },
          }),
        ),
      ).rejects.toThrow(cekirdek.YetkiHatasi);
      await expect(
        cekirdek.denetimliAktorle(admin, "test", (vt) =>
          vt.siparis.update({
            where: { id: id.sipA },
            data: { onaylar: { create: { token_hash: "h2", son_gecerlilik: gelecek } } },
          }),
        ),
      ).rejects.toThrow(cekirdek.YetkiHatasi);
      // Bağlantı kaydı (kullanılmamış) oluşturulabilir; güncellenemez.
      const onay = await cekirdek.denetimliAktorle(admin, "onay.baglanti_uret", (vt) =>
        vt.onay.create({ data: { siparis_id: id.sipA, token_hash: "h3", son_gecerlilik: gelecek } }),
      );
      await expect(
        cekirdek.denetimliAktorle(admin, "test", (vt) =>
          vt.onay.update({ where: { id: onay.id }, data: { son_gecerlilik: gelecek } }),
        ),
      ).rejects.toThrow(cekirdek.YetkiHatasi);
    });

    it("iç içe silme yasak", async () => {
      await expect(
        cekirdek.denetimliAktorle(admin, "test", (vt) =>
          vt.siparis.update({ where: { id: id.sipA }, data: { satirlar: { deleteMany: {} } } }),
        ),
      ).rejects.toThrow(cekirdek.YetkiHatasi);
    });
  });

  describe("denetim kaydı", () => {
    it("güncelleme eski/yeni farkıyla, aynı transaction'da yazılır", async () => {
      await cekirdek.denetimliAktorle(
        admin,
        "siparis.iptal",
        (vt) =>
          vt.siparis.update({
            where: { id: id.sipA },
            data: { iptal_mi: true, iptal_nedeni: "Müşteri vazgeçti", iptal_zamani: new Date() },
          }),
        { ip: "10.0.0.1" },
      );
      const k = await ham.denetimKaydi.findFirstOrThrow({ where: { islem: "siparis.iptal" } });
      expect(k).toMatchObject({ kullanici_id: admin.kullaniciId, tablo: "Siparis", kayit_id: id.sipA, ip: "10.0.0.1" });
      expect(k.eski).toMatchObject({ iptal_mi: false, iptal_nedeni: null });
      expect(k.yeni).toMatchObject({ iptal_mi: true, iptal_nedeni: "Müşteri vazgeçti" });
      expect(Object.keys(k.yeni as object)).not.toContain("genel_toplam"); // yalnız değişen alanlar
    });

    it("oluşturma kaydı para alanlarını string olarak ve satırlarıyla saklar", async () => {
      const k = await ham.denetimKaydi.findFirstOrThrow({ where: { tablo: "Siparis", kayit_id: id.sipA, eski: { equals: Prisma.DbNull } } });
      const yeni = k.yeni as Record<string, unknown>;
      expect(yeni.genel_toplam).toBe("12");
      expect(Array.isArray(yeni.satirlar)).toBe(true);
    });

    it("tedarikçi işlemi de denetlenir", async () => {
      await cekirdek.denetimliAktorle(tedA, "siparis.tedarikci_onayi", (vt) =>
        vt.siparis.update({ where: { id: id.sipA }, data: { durum: "tedarikci_onayladi" } }),
      );
      const k = await ham.denetimKaydi.findFirstOrThrow({ where: { islem: "siparis.tedarikci_onayi" } });
      expect(k.kullanici_id).toBe(tedA.kullaniciId);
      expect(k.yeni).toEqual({ durum: "tedarikci_onayladi" });
    });

    it("hata olursa yazma da denetim kaydı da geri alınır", async () => {
      await expect(
        cekirdek.denetimliAktorle(admin, "test.geri_al", async (vt) => {
          await vt.siparis.update({ where: { id: id.sipA }, data: { durum: "tedarikci_onayladi" } });
          throw new Error("yarıda kaldı");
        }),
      ).rejects.toThrow("yarıda kaldı");
      expect((await ham.siparis.findUniqueOrThrow({ where: { id: id.sipA } })).durum).toBe("girildi");
      expect(await ham.denetimKaydi.count({ where: { islem: "test.geri_al" } })).toBe(0);
    });

    it("parola hash'i denetim kaydına açık yazılmaz", async () => {
      await cekirdek.denetimliAktorle(admin, "kullanici.parola", (vt) =>
        vt.kullanici.update({ where: { id: tedA.kullaniciId }, data: { parola_hash: "yeni-hash" } }),
      );
      const k = await ham.denetimKaydi.findFirstOrThrow({ where: { islem: "kullanici.parola" } });
      expect(k.yeni).toEqual({ parola_hash: "[gizli]" });
    });

    it("denetim kaydı değiştirilemez ve silinemez (veritabanı)", async () => {
      await expect(ham.$executeRawUnsafe(`UPDATE denetim_kaydi SET islem = 'x'`)).rejects.toThrow(/değiştirilemez/);
      // eslint-disable-next-line no-restricted-syntax -- silmenin ENGELLENDİĞİNİ doğrulayan test
      await expect(ham.$executeRawUnsafe(`DELETE FROM denetim_kaydi`)).rejects.toThrow(/silinemez/);
    });
  });

  describe("veritabanı kuralları", () => {
    it("ham istemcide de delete engelli; ham SQL DELETE tetikleyiciye takılır", async () => {
      // eslint-disable-next-line no-restricted-syntax -- silmenin ENGELLENDİĞİNİ doğrulayan test
      await expect(ham.siparis.delete({ where: { id: id.sipA } })).rejects.toThrow(/silinemez/);
      // eslint-disable-next-line no-restricted-syntax -- silmenin ENGELLENDİĞİNİ doğrulayan test
      await expect(ham.$executeRawUnsafe(`DELETE FROM siparis`)).rejects.toThrow(/silinemez/);
    });

    it("aynı satıcı aynı fatura numarasını iki kez giremez; farklı satıcı girebilir", async () => {
      await ham.siparis.update({ where: { id: id.sipA }, data: { fatura_no: "F-001" } });
      await ham.siparis.update({ where: { id: id.sipB }, data: { fatura_no: "F-001" } }); // B farklı satıcı
      const ikinci = await ham.siparis.create({
        data: {
          alici_firma_id: id.aliciY, satici_firma_id: id.tedFirmaA, odeme_tipi: "pesin",
          ara_toplam: "0", kdv_toplam: "0", genel_toplam: "0", komisyon_oran: "0", komisyon_tutar: "0",
        },
      });
      await expect(
        ham.siparis.update({ where: { id: ikinci.id }, data: { fatura_no: "F-001" } }),
      ).rejects.toThrow(/Unique constraint|unique/i);
    });

    it("satırdaki ürün siparişin satıcısına ait olmalı", async () => {
      await expect(
        ham.siparisSatir.create({
          data: { siparis_id: id.sipA, urun_id: id.urunB, ad: "x", birim: "adet", adet: "1", birim_fiyat: "1", kdv_orani: "0", kdv_tutar: "0", satir_toplam: "1" },
        }),
      ).rejects.toThrow(/ait değil/);
    });

    it("birim 'adet' iken ondalıklı miktar veritabanında da reddedilir", async () => {
      await expect(
        ham.siparisSatir.create({
          data: { siparis_id: id.sipA, urun_id: id.urunA, ad: "x", birim: "adet", adet: "1.5", birim_fiyat: "1", kdv_orani: "0", kdv_tutar: "0", satir_toplam: "1.50" },
        }),
      ).rejects.toThrow(/siparis_satir_adet_birimi_tamsayi/);
    });

    it("genel_toplam = ara_toplam + kdv_toplam zorunlu", async () => {
      await expect(
        ham.siparis.update({ where: { id: id.sipA }, data: { genel_toplam: "99.00" } }),
      ).rejects.toThrow(/siparis_genel_toplam_tutarli/);
    });

    it("kullanılmış onay kaydı değiştirilemez", async () => {
      const o = await ham.onay.create({
        data: { siparis_id: id.sipA, token_hash: "t1", son_gecerlilik: new Date(Date.now() + 86_400_000) },
      });
      await ham.onay.update({
        where: { id: o.id },
        data: { kullanildi_mi: true, onay_zamani: new Date(), onaylanan_tutar: "12.00", onaylanan_kalemler: [] },
      });
      await expect(ham.onay.update({ where: { id: o.id }, data: { onaylanan_tutar: "1.00" } })).rejects.toThrow(
        /değiştirilemez/,
      );
    });
  });

  describe("oturum çözümü", () => {
    it("pasif kullanıcı ve pasif firmanın kullanıcısı aktöre çözülmez", async () => {
      const { aktorCoz } = await import("@/lib/oturum-cozumu");
      expect(await aktorCoz(tedA.kullaniciId)).toEqual(tedA);
      expect(await aktorCoz(admin.kullaniciId)).toEqual({ tip: "admin", kullaniciId: admin.kullaniciId });

      await ham.firma.update({ where: { id: id.tedFirmaA }, data: { durum: "pasif" } });
      expect(await aktorCoz(tedA.kullaniciId)).toBeNull();

      await ham.kullanici.update({ where: { id: tedB.kullaniciId }, data: { aktif: false } });
      expect(await aktorCoz(tedB.kullaniciId)).toBeNull();

      expect(await aktorCoz(999_999)).toBeNull();
      expect(await aktorCoz(Number.NaN)).toBeNull();
    });
  });
});

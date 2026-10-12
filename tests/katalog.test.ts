// Katalog (alıcı) ve tedarikçi ekranı sorguları — gerçek PostgreSQL'e karşı.

import { beforeEach, describe, expect, it } from "vitest";
import { testVeritabaniAdresi } from "./kurulum-global";
import { temizVeKur, type Kurulum } from "./vt-yardimci";

const VT_VAR = testVeritabaniAdresi() !== null;

describe.skipIf(!VT_VAR)("katalog (veritabanı)", () => {
  let k: Kurulum;
  let katalog: typeof import("@/lib/katalog");
  let cekirdek: typeof import("@/lib/scope-cekirdek");
  type Aktor = import("@/lib/scope-cekirdek").Aktor;
  let alici: Aktor;
  let pasif: number;

  beforeEach(async () => {
    k = await temizVeKur();
    katalog = await import("@/lib/katalog");
    cekirdek = await import("@/lib/scope-cekirdek");
    const ka = await k.ham.kullanici.create({ data: { email: "al@test.local", parola_hash: "x", rol: "alici", firma_id: k.alici.id } });
    alici = { tip: "alici", kullaniciId: ka.id, firmaId: k.alici.id };
    await k.ham.firma.update({ where: { id: k.tedA.id }, data: { adres: "İzmir", telefon: "0232 111 11 11" } });
    await k.ham.urun.update({ where: { id: k.urun.id }, data: { kategori: "Yağ", aciklama: "Teknik açıklama", koli_adedi: 4 } });
    await k.ham.urun.update({ where: { id: k.urunKg.id }, data: { kategori: "Bakliyat" } });
    pasif = (
      await k.ham.urun.create({
        data: { firma_id: k.tedA.id, kod: "PAS", ad: "Pasif ürün", birim: "adet", liste_fiyat: "1", kdv_orani: "20", aktif: false, kategori: "Gizli" },
      })
    ).id;
  });

  const vt = (a: Aktor) => cekirdek.kapsamliDbAktorle(a);
  const liste = (a: Aktor, sp: Record<string, string> = {}) => katalog.katalogListesi(vt(a), a, katalog.katalogFiltresiOku(sp));

  it("alıcı: aktif ürünler, KDV dahil fiyat money.ts ile; pasif ürün yok", async () => {
    const r = await liste(alici);
    expect(r.urunler.map((u) => u.kod).sort()).toEqual(["B1", "U1", "U2"]);
    const u1 = r.urunler.find((u) => u.kod === "U1")!;
    // 10,00 + %20 = 12,00
    expect([u1.listeFiyat, u1.kdvOrani, u1.kdvDahil, u1.tedarikci]).toEqual(["10.00", "20.00", "12.00", "Tedarikçi Gıda Ltd."]);
  });

  it("arama (ad/kod), tedarikçi ve kategori filtresi", async () => {
    expect((await liste(alici, { q: "kg" })).urunler.map((u) => u.kod)).toEqual(["U2"]);
    expect((await liste(alici, { q: "b1" })).urunler.map((u) => u.kod)).toEqual(["B1"]);
    expect((await liste(alici, { tedarikci: String(k.tedB.id) })).urunler.map((u) => u.kod)).toEqual(["B1"]);
    expect((await liste(alici, { kategori: "Yağ" })).urunler.map((u) => u.kod)).toEqual(["U1"]);
  });

  it("filtre seçenekleri yalnız görünür ürünlerden: pasif ürünün kategorisi çıkmaz", async () => {
    const s = await katalog.katalogSecenekleri(vt(alici), alici);
    expect(s.kategoriler).toEqual(["Bakliyat", "Yağ"]);
    expect(s.tedarikciler.map((t) => t.unvan)).toEqual(["Başka Tedarikçi", "Tedarikçi Gıda Ltd."]);
  });

  it("detay: tedarikçinin ünvanı/adresi/telefonu var, vergi no YOK; pasif ürün açılmaz", async () => {
    const d = await katalog.katalogDetayi(vt(alici), alici, k.urun.id);
    expect(d?.tedarikciBilgisi).toEqual({ unvan: "Tedarikçi Gıda Ltd.", adres: "İzmir", telefon: "0232 111 11 11" });
    expect([d?.aciklama, d?.koliAdedi]).toEqual(["Teknik açıklama", 4]);
    expect(JSON.stringify(d)).not.toContain("2222222222"); // tedA vergi no
    expect(await katalog.katalogDetayi(vt(alici), alici, pasif)).toBeNull();
  });

  it("pasif tedarikçinin ürünleri katalogda yok", async () => {
    await k.ham.firma.update({ where: { id: k.tedB.id }, data: { durum: "pasif" } });
    expect((await liste(alici)).urunler.map((u) => u.kod)).not.toContain("B1");
    expect(await katalog.katalogDetayi(vt(alici), alici, k.urunB.id)).toBeNull();
  });

  it("tedarikçi: yalnız kendi ürünleri (pasifler dahil); başkasının detayı açılmaz", async () => {
    const r = await liste(k.tedarikciA);
    expect(r.urunler.map((u) => [u.kod, u.aktif]).sort()).toEqual([["PAS", false], ["U1", true], ["U2", true]]);
    expect(await katalog.katalogDetayi(vt(k.tedarikciA), k.tedarikciA, k.urunB.id)).toBeNull();
    expect((await katalog.katalogDetayi(vt(k.tedarikciA), k.tedarikciA, pasif))?.aktif).toBe(false);
  });

  it("admin katalog servislerini kullanmaz (kendi listeleri var)", async () => {
    await expect(liste(k.admin)).rejects.toThrow(cekirdek.YetkiHatasi);
  });
});

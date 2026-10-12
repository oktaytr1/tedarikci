// Sipariş listesi: filtreler, "tutar uyuşmuyor", kapsam.

import { beforeEach, describe, expect, it } from "vitest";
import { testVeritabaniAdresi } from "./kurulum-global";
import { temizVeKur, type Kurulum } from "./vt-yardimci";

const VT_VAR = testVeritabaniAdresi() !== null;

describe.skipIf(!VT_VAR)("sipariş listesi (veritabanı)", () => {
  let k: Kurulum;
  let liste: typeof import("@/lib/siparis-liste");
  let cekirdek: typeof import("@/lib/scope-cekirdek");
  let s1: number, s2: number, s3: number, sB: number;

  beforeEach(async () => {
    k = await temizVeKur();
    liste = await import("@/lib/siparis-liste");
    cekirdek = await import("@/lib/scope-cekirdek");
    s1 = (await k.hamSiparis()).id;
    s2 = (await k.hamSiparis()).id;
    s3 = (await k.hamSiparis()).id;
    sB = (await k.hamSiparis({ satici: k.tedB.id, urunId: k.urunB.id })).id;
    // s2: fatura tutarı uyuşmuyor ; s3: uyuşuyor ; s1: iptal
    for (const [id, tutar] of [[s2, "40.00"], [s3, "36.00"]] as const) {
      await k.ham.siparis.update({ where: { id }, data: { durum: "tedarikci_onayladi" } });
      await k.ham.siparis.update({ where: { id }, data: { durum: "sevk_edildi", fatura_no: `F${id}`, fatura_tutar: tutar } });
    }
    await k.ham.siparis.update({ where: { id: s1 }, data: { iptal_mi: true, iptal_nedeni: "x", iptal_zamani: new Date() } });
  });

  const getir = (aktor: import("@/lib/scope-cekirdek").Aktor, sp: Record<string, string>) =>
    liste.siparisListesi(cekirdek.kapsamliDbAktorle(aktor), liste.filtreOku(sp));
  const idler = async (aktor: import("@/lib/scope-cekirdek").Aktor, sp: Record<string, string>) =>
    (await getir(aktor, sp)).satirlar.map((s) => s.id).sort((a, b) => a - b);

  it("varsayılan: iptaller hariç; iptal filtresi dahil/sadece", async () => {
    expect(await idler(k.admin, {})).toEqual([s2, s3, sB]);
    expect(await idler(k.admin, { iptal: "dahil" })).toEqual([s1, s2, s3, sB]);
    expect(await idler(k.admin, { iptal: "sadece" })).toEqual([s1]);
  });

  it("tutar uyuşmuyor: yalnız fatura tutarı genel toplamdan farklı olanlar", async () => {
    expect(await idler(k.admin, { uyusmazlik: "1" })).toEqual([s2]);
    const r = await getir(k.admin, {});
    expect(r.satirlar.find((x) => x.id === s2)?.tutarUyusmuyor).toBe(true);
    expect(r.satirlar.find((x) => x.id === s3)?.tutarUyusmuyor).toBe(false);
  });

  it("arama: sipariş no, fatura no, firma ünvanı (büyük/küçük harf duyarsız)", async () => {
    expect(await idler(k.admin, { q: `#${s3}` })).toEqual([s3]);
    expect(await idler(k.admin, { q: `f${s2}` })).toEqual([s2]);
    expect(await idler(k.admin, { q: "başka" })).toEqual([sB]);
  });

  it("durum ve firma filtresi; geçersiz parametre yok sayılır", async () => {
    expect(await idler(k.admin, { durum: "sevk_edildi" })).toEqual([s2, s3]);
    expect(await idler(k.admin, { satici: String(k.tedB.id) })).toEqual([sB]);
    expect(await idler(k.admin, { durum: "uydurma", sirala: "parola_hash", sayfa: "-3" })).toEqual([s2, s3, sB]);
  });

  it("tedarikçi aynı fonksiyonla yalnız kendi siparişlerini görür", async () => {
    expect(await idler(k.tedarikciB, { iptal: "dahil" })).toEqual([sB]);
    expect(await idler(k.tedarikciA, { q: "başka" })).toEqual([]);
  });
});

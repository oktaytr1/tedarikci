// Türkçe karakter ve büyük/küçük harf duyarsız arama.
// JS (lib/arama.ts) ile veritabanı (arama_normalize) aynı sonucu vermeli; katalog araması
// telefondan aksansız yazılan sorgularla bulmalı.

import { beforeEach, describe, expect, it } from "vitest";
import { aramaKelimeleri, aramaNormalize } from "@/lib/arama";
import { testVeritabaniAdresi } from "./kurulum-global";
import { temizVeKur, type Kurulum } from "./vt-yardimci";

const VT_VAR = testVeritabaniAdresi() !== null;

// I/ı, İ/i ve diğer Türkçe harflerin zor örnekleri.
const ORNEKLER: [string, string][] = [
  ["Peçete 100'lü", "pecete 100'lu"],
  ["YOĞURT", "yogurt"],
  ["Salça", "salca"],
  ["IŞIK", "isik"],
  ["ışık", "isik"],
  ["Işık", "isik"],
  ["İZMİR", "izmir"],
  ["izmir", "izmir"],
  ["İstanbul ılık", "istanbul ilik"],
  ["ÇAMAŞIR SUYU", "camasir suyu"],
  ["Gözlük Ürünü", "gozluk urunu"],
  ["Kâğıt havlu", "kagit havlu"],
  ["  Fazla   boşluk  ", "fazla bosluk"],
];

describe("aramaNormalize (JS)", () => {
  it.each(ORNEKLER)("%s → %s", (girdi, beklenen) => {
    expect(aramaNormalize(girdi)).toBe(beklenen);
  });

  it("I/ı ve İ/i aynı yere düşer (Türkçe ve İngilizce klavye farkı)", () => {
    const hepsi = ["IŞIK", "ışık", "Işık", "isik", "ISIK", "işık", "İŞİK"].map(aramaNormalize);
    expect(new Set(hepsi)).toEqual(new Set(["isik"]));
  });

  it("sorgu kelimelere bölünür", () => {
    expect(aramaKelimeleri("  Salça  DOMATES ")).toEqual(["salca", "domates"]);
    expect(aramaKelimeleri("   ")).toEqual([]);
  });
});

describe.skipIf(!VT_VAR)("Türkçe arama (veritabanı)", () => {
  let k: Kurulum;
  let katalog: typeof import("@/lib/katalog");
  let listeler: typeof import("@/lib/admin/listeler");
  let cekirdek: typeof import("@/lib/scope-cekirdek");
  type Aktor = import("@/lib/scope-cekirdek").Aktor;
  let alici: Aktor;

  beforeEach(async () => {
    k = await temizVeKur();
    katalog = await import("@/lib/katalog");
    listeler = await import("@/lib/admin/listeler");
    cekirdek = await import("@/lib/scope-cekirdek");
    const ka = await k.ham.kullanici.create({ data: { email: "al@test.local", parola_hash: "x", rol: "alici", firma_id: k.alici.id } });
    alici = { tip: "alici", kullaniciId: ka.id, firmaId: k.alici.id };
    const urunler = [
      ["PC-100", "Peçete 100'lü paket"],
      ["YG-1", "Süzme YOĞURT 1 kg"],
      ["SL-830", "Domates salçası 830 g"],
      ["IS-5", "IŞIK marka çamaşır suyu"],
      ["IZ-1", "İzmir köftesi"],
      ["IL-2", "ılık su şişesi"],
    ];
    for (const [kod, ad] of urunler) {
      await k.ham.urun.create({ data: { firma_id: k.tedA.id, kod, ad, birim: "adet", liste_fiyat: "1", kdv_orani: "20" } });
    }
  });

  it("veritabanı normalizasyonu JS ile birebir aynı", async () => {
    for (const [girdi] of ORNEKLER) {
      const [{ n }] = await k.ham.$queryRawUnsafe<{ n: string }[]>(`SELECT arama_normalize($1) AS n`, girdi);
      // Veritabanı boşlukları sadeleştirmez; karşılaştırma kelime düzeyinde.
      expect(n.split(/\s+/).filter(Boolean).join(" "), girdi).toBe(aramaNormalize(girdi));
    }
  });

  it("arama_metni tetikleyiciyle dolar ve ad değişince güncellenir", async () => {
    const u = await k.ham.urun.findFirstOrThrow({ where: { kod: "PC-100" } });
    expect(u.arama_metni).toBe("pc-100 pecete 100'lu paket");
    const g = await k.ham.urun.update({ where: { id: u.id }, data: { ad: "Kâğıt PEÇETE" } });
    expect(g.arama_metni).toBe("pc-100 kagit pecete");
  });

  const ara = async (q: string) =>
    (await katalog.katalogListesi(cekirdek.kapsamliDbAktorle(alici), alici, katalog.katalogFiltresiOku({ q }))).urunler
      .map((u) => u.kod)
      .sort();

  it.each([
    ["pecete", ["PC-100"]],
    ["PEÇETE", ["PC-100"]],
    ["yogurt", ["YG-1"]],
    ["Yoğurt", ["YG-1"]],
    ["salca", ["SL-830"]],
    ["SALÇA", ["SL-830"]],
    ["isik", ["IS-5"]],
    ["ışık", ["IS-5"]],
    ["Işık", ["IS-5"]],
    ["izmir", ["IZ-1"]],
    ["İZMİR", ["IZ-1"]],
    ["ilik", ["IL-2"]],
    ["ILIK", ["IL-2"]],
    ["camasir", ["IS-5"]],
    ["sise", ["IL-2"]],
    ["salca domates", ["SL-830"]],
    ["domates salca", ["SL-830"]],
    ["pc-100", ["PC-100"]],
    ["koftesi", ["IZ-1"]],
  ])("katalogda '%s' → %j", async (q, beklenen) => {
    expect(await ara(q)).toEqual(beklenen);
  });

  it("eşleşmeyen kelime sonucu daraltır; boş sorgu hepsini getirir", async () => {
    expect(await ara("salca biber")).toEqual([]);
    expect((await ara("   ")).length).toBeGreaterThanOrEqual(6);
  });

  it("admin ürün listesi de aynı kuralla arar", async () => {
    const r = await listeler.urunListesi(cekirdek.kapsamliDbAktorle(k.admin), k.admin, listeler.urunFiltresiOku({ q: "yogurt" }));
    expect(r.satirlar.map((s) => s.kod)).toEqual(["YG-1"]);
  });

  it("arama_metni denetim kaydına ve geçmişe düşmez", async () => {
    const u = await k.ham.urun.findFirstOrThrow({ where: { kod: "SL-830" } });
    await cekirdek.denetimliAktorle(k.admin, "urun.guncelle", (vt) => vt.urun.update({ where: { id: u.id }, data: { ad: "Biber salçası" } }));
    const kayit = await k.ham.denetimKaydi.findFirstOrThrow({ where: { islem: "urun.guncelle", kayit_id: u.id } });
    expect(Object.keys(kayit.yeni as object)).toEqual(["ad"]);
  });
});

// Veritabanı testleri için ortak kurulum: tabloları boşaltır, iki tedarikçi, bir alıcı,
// ürünler ve kullanıcılar oluşturur. Yalnız test veritabanında çalışır (kurulum-global.ts).

import type { Aktor } from "@/lib/scope-cekirdek";

export type Kurulum = Awaited<ReturnType<typeof temizVeKur>>;

export async function temizVeKur() {
  const { db: ham } = await import("@/lib/db");
  await ham.$executeRawUnsafe(
    `TRUNCATE firma, kullanici, urun, siparis, siparis_satir, odeme, onay, denetim_kaydi RESTART IDENTITY CASCADE`,
  );
  const alici = await ham.firma.create({ data: { unvan: "Alıcı Market A.Ş.", vergi_no: "1111111111", tip: "alici" } });
  const tedA = await ham.firma.create({ data: { unvan: "Tedarikçi Gıda Ltd.", vergi_no: "2222222222", tip: "tedarikci" } });
  const tedB = await ham.firma.create({ data: { unvan: "Başka Tedarikçi", vergi_no: "3333333333", tip: "tedarikci" } });
  const urun = await ham.urun.create({
    data: { firma_id: tedA.id, kod: "U1", ad: "Ürün 1", birim: "adet", liste_fiyat: "10.00", kdv_orani: "20.00" },
  });
  const urunKg = await ham.urun.create({
    data: { firma_id: tedA.id, kod: "U2", ad: "Ürün 2 (kg)", birim: "kg", liste_fiyat: "145.40", kdv_orani: "1.00" },
  });
  const urunB = await ham.urun.create({
    data: { firma_id: tedB.id, kod: "B1", ad: "B ürünü", birim: "adet", liste_fiyat: "5.00", kdv_orani: "10.00" },
  });
  const kAdmin = await ham.kullanici.create({ data: { email: "admin@test.local", parola_hash: "x", rol: "admin" } });
  const kTedA = await ham.kullanici.create({ data: { email: "a@test.local", parola_hash: "x", rol: "tedarikci", firma_id: tedA.id } });
  const kTedB = await ham.kullanici.create({ data: { email: "b@test.local", parola_hash: "x", rol: "tedarikci", firma_id: tedB.id } });

  const admin: Extract<Aktor, { tip: "admin" }> = { tip: "admin", kullaniciId: kAdmin.id };
  const tedarikciA: Extract<Aktor, { tip: "tedarikci" }> = { tip: "tedarikci", kullaniciId: kTedA.id, firmaId: tedA.id };
  const tedarikciB: Extract<Aktor, { tip: "tedarikci" }> = { tip: "tedarikci", kullaniciId: kTedB.id, firmaId: tedB.id };

  /** Ham istemciyle, tutarlı toplamlarla tek satırlık sipariş: 3 × 10,00 @%20 = 30,00 + 6,00 = 36,00. */
  async function hamSiparis(opts: { satici?: number; urunId?: number } = {}) {
    return ham.siparis.create({
      data: {
        alici_firma_id: alici.id,
        satici_firma_id: opts.satici ?? tedA.id,
        odeme_tipi: "vadeli",
        vade_gun: 30,
        vade_tarihi: new Date("2026-11-11T00:00:00Z"),
        ara_toplam: "30.00",
        kdv_toplam: "6.00",
        genel_toplam: "36.00",
        komisyon_oran: "2.00",
        komisyon_tutar: "0.60",
        satirlar: {
          create: [
            {
              urun_id: opts.urunId ?? urun.id,
              ad: "Ürün 1",
              birim: "adet",
              adet: "3",
              birim_fiyat: "10.00",
              kdv_orani: "20.00",
              kdv_tutar: "6.00",
              satir_toplam: "30.00",
            },
          ],
        },
      },
    });
  }

  return { ham, alici, tedA, tedB, urun, urunKg, urunB, admin, tedarikciA, tedarikciB, hamSiparis };
}

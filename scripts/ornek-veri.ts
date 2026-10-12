// Geliştirme ortamı için örnek veri: iki tedarikçi, iki alıcı, ürünler ve bir geliştirme admini.
//
//   npm run db:ornek
//
// Yalnız geliştirmede çalışır. Tekrar çalıştırılırsa var olan kayıtları atlar.
// Geliştirme admin parolası .env içindeki ORNEK_ADMIN_PAROLA değişkeninden okunur; yoksa üretilip
// .env dosyasına yazılır (ekrana yazdırılmaz).

import "dotenv/config";
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { db } from "@/lib/db";
import { parolaHashle } from "@/lib/password";
import { denetimliAktorle } from "@/lib/scope-cekirdek";

const ADMIN_EPOSTA = "admin@ornek.local";

const TEDARIKCILER = [
  {
    unvan: "Anadolu Gıda Sanayi Ltd. Şti.",
    vergi_no: "1234567801",
    kullanici: "tedarikci@anadolugida.local",
    urunler: [
      { kod: "AG-001", ad: "Ayçiçek yağı 5 L", birim: "adet", koli_adedi: 4, liste_fiyat: "389.90", kdv_orani: "1" },
      { kod: "AG-002", ad: "Baldo pirinç 1 kg", birim: "adet", koli_adedi: 12, liste_fiyat: "89.50", kdv_orani: "1" },
      { kod: "AG-003", ad: "Kırmızı mercimek", birim: "kg", liste_fiyat: "62.40", kdv_orani: "1", min_siparis: "25" },
      { kod: "AG-004", ad: "Toz şeker 50 kg çuval", birim: "adet", liste_fiyat: "2149.00", kdv_orani: "1" },
      { kod: "AG-010", ad: "Bulaşık deterjanı 4 L", birim: "adet", koli_adedi: 4, liste_fiyat: "164.90", kdv_orani: "20" },
    ],
  },
  {
    unvan: "Ege Temizlik Ürünleri A.Ş.",
    vergi_no: "1234567802",
    kullanici: "tedarikci@egetemizlik.local",
    urunler: [
      { kod: "ET-100", ad: "Çamaşır suyu 4 L", birim: "adet", koli_adedi: 4, liste_fiyat: "74.90", kdv_orani: "20" },
      { kod: "ET-101", ad: "Yüzey temizleyici 2,5 L", birim: "adet", koli_adedi: 6, liste_fiyat: "96.00", kdv_orani: "20" },
      { kod: "ET-200", ad: "Kâğıt havlu 12'li", birim: "adet", liste_fiyat: "219.90", kdv_orani: "10" },
    ],
  },
];

const ALICILAR = [
  { unvan: "Kardeşler Market Zinciri A.Ş.", vergi_no: "9876543201", adres: "İzmir", telefon: "0232 000 00 00" },
  { unvan: "Yıldız Otel İşletmeleri Ltd.", vergi_no: "9876543202", adres: "Antalya", telefon: "0242 000 00 00" },
];

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Örnek veri üretimde yüklenmez.");

  let parola = process.env.ORNEK_ADMIN_PAROLA;
  if (!parola) {
    parola = randomBytes(12).toString("base64url");
    appendFileSync(".env", `\n# Geliştirme admini (${ADMIN_EPOSTA}) — npm run db:ornek üretti\nORNEK_ADMIN_PAROLA="${parola}"\n`);
    console.log(`Geliştirme admin parolası üretildi ve .env dosyasına yazıldı (ORNEK_ADMIN_PAROLA).`);
  }

  let admin = await db.kullanici.findUnique({ where: { email: ADMIN_EPOSTA } });
  if (!admin) {
    admin = await db.kullanici.create({ data: { email: ADMIN_EPOSTA, parola_hash: await parolaHashle(parola), rol: "admin" } });
    console.log(`Admin: ${ADMIN_EPOSTA}`);
  }

  await denetimliAktorle({ tip: "admin", kullaniciId: admin.id }, "ornek_veri.yukle", async (vt) => {
    for (const a of ALICILAR) {
      if (await vt.firma.findUnique({ where: { vergi_no: a.vergi_no } })) continue;
      await vt.firma.create({ data: { ...a, tip: "alici" } });
      console.log(`Alıcı: ${a.unvan}`);
    }
    for (const t of TEDARIKCILER) {
      let firma = await vt.firma.findUnique({ where: { vergi_no: t.vergi_no } });
      if (!firma) {
        firma = await vt.firma.create({ data: { unvan: t.unvan, vergi_no: t.vergi_no, tip: "tedarikci" } });
        console.log(`Tedarikçi: ${t.unvan}`);
      }
      for (const u of t.urunler) {
        const varMi = await vt.urun.findFirst({ where: { firma_id: firma.id, kod: u.kod } });
        if (!varMi) await vt.urun.create({ data: { ...u, firma_id: firma.id } });
      }
      if (!(await vt.kullanici.findUnique({ where: { email: t.kullanici } }))) {
        await vt.kullanici.create({
          data: { email: t.kullanici, parola_hash: await parolaHashle(parola), rol: "tedarikci", firma_id: firma.id },
        });
        console.log(`Tedarikçi kullanıcısı: ${t.kullanici} (parola: admin ile aynı)`);
      }
    }
  });
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e);
  await db.$disconnect();
  process.exit(1);
});

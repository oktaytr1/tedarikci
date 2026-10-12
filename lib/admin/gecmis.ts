// Kayıt değişiklik geçmişi: denetim kaydından alan bazında "eski → yeni" listesi.
// Para ve oranlar money.ts ile biçimlenir; parola özeti yalnız "değiştirildi" diye görünür.

import "server-only";
import { oranYaz, paraYaz, miktarYaz } from "@/lib/money";
import type { Aktor, KapsamliDb } from "@/lib/scope-cekirdek";
import { adminGerekli } from "./ortak";

type Tablo = "Urun" | "Firma" | "Kullanici";

const ALAN_ETIKETI: Record<string, string> = {
  kod: "Kod",
  ad: "Ad",
  aciklama: "Açıklama",
  kategori: "Kategori",
  birim: "Birim",
  koli_adedi: "Koli adedi",
  min_siparis: "Min. sipariş",
  liste_fiyat: "Liste fiyatı",
  kdv_orani: "KDV oranı",
  fotograf_url: "Fotoğraf linki",
  aktif: "Durum",
  unvan: "Ünvan",
  vergi_no: "Vergi no",
  tip: "Tip",
  durum: "Durum",
  adres: "Adres",
  telefon: "Telefon",
  email: "E-posta",
  parola_hash: "Parola",
  rol: "Rol",
  firma_id: "Firma",
};

const ISLEM_ETIKETI: Record<string, string> = {
  "urun.olustur": "Ürün oluşturuldu",
  "urun.guncelle": "Ürün güncellendi",
  "urun.durum": "Durum değiştirildi",
  "firma.olustur": "Firma oluşturuldu",
  "firma.guncelle": "Firma güncellendi",
  "firma.durum": "Durum değiştirildi",
  "kullanici.olustur": "Kullanıcı açıldı",
  "kullanici.eposta_duzelt": "E-posta düzeltildi",
  "kullanici.parola_sifirla": "Parola sıfırlandı",
  "kullanici.durum": "Durum değiştirildi",
  "kullanici.admin_olustur_cli": "Admin komut satırından açıldı",
  "ornek_veri.yukle": "Örnek veriyle oluşturuldu",
};

function degerYaz(alan: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (alan === "parola_hash") return "••••";
  if (alan === "liste_fiyat") return `${paraYaz(String(v))} TL`;
  if (alan === "kdv_orani") return `%${oranYaz(String(v))}`;
  if (alan === "min_siparis") return miktarYaz(String(v));
  if (alan === "aktif") return v === true ? "Aktif" : "Pasif";
  return String(v);
}

export type GecmisKaydi = {
  zaman: string;
  islem: string;
  kim: string;
  degisiklikler: { alan: string; eski: string; yeni: string }[];
};

export async function kayitGecmisi(vt: KapsamliDb, aktor: Aktor, tablo: Tablo, id: number): Promise<GecmisKaydi[]> {
  adminGerekli(aktor);
  const kayitlar = await vt.denetimKaydi.findMany({
    where: { tablo, kayit_id: id },
    orderBy: { id: "desc" },
    take: 100,
    include: { kullanici: { select: { email: true } } },
  });
  return kayitlar.map((k) => {
    const eski = (k.eski ?? {}) as Record<string, unknown>;
    const yeni = (k.yeni ?? {}) as Record<string, unknown>;
    const olusturma = k.eski === null;
    const degisiklikler = olusturma
      ? []
      : Object.keys(yeni)
          .filter((a) => a !== "id" && a !== "olusturma" && a !== "guncelleme" && a !== "arama_metni")
          .map((a) => ({
            alan: ALAN_ETIKETI[a] ?? a,
            eski: a === "parola_hash" ? "" : degerYaz(a, eski[a]),
            yeni: a === "parola_hash" ? "değiştirildi" : degerYaz(a, yeni[a]),
          }));
    return {
      zaman: k.zaman.toISOString(),
      islem: ISLEM_ETIKETI[k.islem] ?? k.islem,
      kim: k.kullanici?.email ?? "Sistem",
      degisiklikler,
    };
  });
}

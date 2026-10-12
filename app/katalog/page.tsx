import { Suspense } from "react";
import { KatalogFiltreleri } from "@/components/katalog/katalog-filtreleri";
import { KatalogHero } from "@/components/katalog/katalog-hero";
import { KatalogListesi } from "@/components/katalog/katalog-listesi";
import { KategoriSeridi } from "@/components/katalog/kategori-seridi";
import { NasilCalisir } from "@/components/katalog/nasil-calisir";
import { oturumAktoru } from "@/lib/authz";
import { katalogFiltresiOku, katalogListesi, katalogSecenekleri } from "@/lib/katalog";
import { kapsamliDb } from "@/lib/scope";
import { statikKatalogListesi, statikKatalogSecenekleri } from "@/lib/statik-katalog";

type Arama = Promise<Record<string, string | string[] | undefined>>;

export default function KatalogSayfasi({ searchParams }: { searchParams: Arama }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Katalog yükleniyor…</p>}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: Arama }) {
  const sp = await searchParams;
  const filtre = katalogFiltresiOku(sp);
  const aktor = await oturumAktoru();

  let liste;
  let secenekler;

  if (aktor && process.env.DATABASE_URL) {
    try {
      const vt = await kapsamliDb();
      [liste, secenekler] = await Promise.all([
        katalogListesi(vt, aktor, filtre),
        katalogSecenekleri(vt, aktor),
      ]);
    } catch {
      liste = statikKatalogListesi(filtre);
      secenekler = statikKatalogSecenekleri();
    }
  } else {
    liste = statikKatalogListesi(filtre);
    secenekler = statikKatalogSecenekleri();
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      {/* Büyük Göz Alıcı Hero Karşılama Alanı */}
      <KatalogHero />

      {/* İşin Mantığı: Tedarikçi Finansmanı ve Vadeli Alım Nasıl Çalışır? */}
      <NasilCalisir />

      {/* Görsel Hızlı Kategori Seçimi */}
      <KategoriSeridi kategoriler={secenekler.kategoriler} />

      {/* Detaylı Filtre Çubuğu (Arama & Tedarikçi Seçimi) */}
      <KatalogFiltreleri
        yol="/katalog"
        tedarikciler={secenekler.tedarikciler}
        kategoriler={secenekler.kategoriler}
      />

      {/* Ürün Listesi */}
      <KatalogListesi {...liste} sp={sp} urunAdresi={(id) => `/katalog/urun/${id}`} />
    </div>
  );
}

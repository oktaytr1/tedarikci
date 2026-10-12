import { Suspense } from "react";
import { KatalogFiltreleri } from "@/components/katalog/katalog-filtreleri";
import { KatalogHero } from "@/components/katalog/katalog-hero";
import { KatalogListesi } from "@/components/katalog/katalog-listesi";
import { KategoriSeridi } from "@/components/katalog/kategori-seridi";
import { NasilCalisir } from "@/components/katalog/nasil-calisir";
import { katalogFiltresiOku, katalogListesi, katalogSecenekleri } from "@/lib/katalog";
import { db } from "@/lib/db";

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
  const [liste, secenekler] = await Promise.all([
    katalogListesi(db, filtre),
    katalogSecenekleri(db),
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <KatalogHero />
      <NasilCalisir />
      <KategoriSeridi kategoriler={secenekler.kategoriler} />
      <KatalogFiltreleri
        yol="/katalog"
        tedarikciler={[]}
        kategoriler={secenekler.kategoriler}
      />
      <KatalogListesi {...liste} sp={sp} urunAdresi={(id) => `/katalog/urun/${id}`} />
    </div>
  );
}

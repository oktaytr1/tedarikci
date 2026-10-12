import { Suspense } from "react";
import { ShoppingBag } from "lucide-react";
import { KatalogFiltreleri } from "@/components/katalog/katalog-filtreleri";
import { KatalogListesi } from "@/components/katalog/katalog-listesi";
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
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* Katalog Başlığı */}
      <div className="flex flex-col gap-1 border-b border-border/60 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <ShoppingBag className="size-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              B2B Ürün Kataloğu
            </h1>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300 sm:inline-flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Canlı Toptan Fiyatlar
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Yetkili tedarikçilerin güncel toptan ürün listesi ve KDV hariç/dahil birim fiyatları.
        </p>
      </div>

      <KatalogFiltreleri
        yol="/katalog"
        tedarikciler={secenekler.tedarikciler}
        kategoriler={secenekler.kategoriler}
      />

      <KatalogListesi {...liste} sp={sp} urunAdresi={(id) => `/katalog/urun/${id}`} />
    </div>
  );
}

import { Suspense } from "react";
import { KatalogFiltreleri } from "@/components/katalog/katalog-filtreleri";
import { KatalogListesi } from "@/components/katalog/katalog-listesi";
import { rolGerekli } from "@/lib/authz";
import { katalogFiltresiOku, katalogListesi, katalogSecenekleri } from "@/lib/katalog";
import { kapsamliDb } from "@/lib/scope";

type Arama = Promise<Record<string, string | string[] | undefined>>;

// Rol kontrolü sayfanın kendisinde (README: "Sayfa yazma kuralı").
export default function KatalogSayfasi({ searchParams }: { searchParams: Arama }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Yükleniyor…</p>}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: Arama }) {
  const aktor = await rolGerekli("alici");
  const vt = await kapsamliDb("alici");
  const sp = await searchParams;
  const [liste, secenekler] = await Promise.all([katalogListesi(vt, aktor, katalogFiltresiOku(sp)), katalogSecenekleri(vt, aktor)]);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3">
      <KatalogFiltreleri yol="/katalog" tedarikciler={secenekler.tedarikciler} kategoriler={secenekler.kategoriler} />
      <KatalogListesi {...liste} sp={sp} urunAdresi={(id) => `/katalog/urun/${id}`} />
    </div>
  );
}

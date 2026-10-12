import { Suspense } from "react";
import { KatalogFiltreleri } from "@/components/katalog/katalog-filtreleri";
import { KatalogListesi } from "@/components/katalog/katalog-listesi";
import { AdminIletisim } from "@/components/katalog/admin-iletisim";
import { rolGerekli } from "@/lib/authz";
import { katalogFiltresiOku, katalogListesi, katalogSecenekleri } from "@/lib/katalog";
import { kapsamliDb } from "@/lib/scope";

type Arama = Promise<Record<string, string | string[] | undefined>>;

// Tedarikçi ekranı: kendi ürünleri, salt okunur (pasifler dahil, işaretli).
export default function TedarikciSayfasi({ searchParams }: { searchParams: Arama }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Yükleniyor…</p>}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: Arama }) {
  const aktor = await rolGerekli("tedarikci");
  const vt = await kapsamliDb("tedarikci");
  const sp = await searchParams;
  const [liste, secenekler] = await Promise.all([katalogListesi(vt, aktor, katalogFiltresiOku(sp)), katalogSecenekleri(vt, aktor)]);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3">
      <h1 className="text-lg font-semibold">Ürünlerim</h1>
      <AdminIletisim />
      <KatalogFiltreleri yol="/tedarikci" tedarikciler={[]} kategoriler={secenekler.kategoriler} tedarikciFiltresi={false} />
      <KatalogListesi {...liste} sp={sp} urunAdresi={(id) => `/tedarikci/urun/${id}`} durumGoster />
    </div>
  );
}

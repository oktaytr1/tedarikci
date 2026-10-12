import { Suspense } from "react";
import { Store } from "lucide-react";
import { AdminIletisim } from "@/components/katalog/admin-iletisim";
import { KatalogFiltreleri } from "@/components/katalog/katalog-filtreleri";
import { KatalogListesi } from "@/components/katalog/katalog-listesi";
import { rolGerekli } from "@/lib/authz";
import { katalogFiltresiOku, katalogListesi, katalogSecenekleri } from "@/lib/katalog";
import { kapsamliDb } from "@/lib/scope";

type Arama = Promise<Record<string, string | string[] | undefined>>;

// Tedarikçi ekranı: kendi ürünleri, salt okunur (pasifler dahil, işaretli).
export default function TedarikciSayfasi({ searchParams }: { searchParams: Arama }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Ürünleriniz yükleniyor…</p>}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: Arama }) {
  const aktor = await rolGerekli("tedarikci");
  const vt = await kapsamliDb("tedarikci");
  const sp = await searchParams;
  const [liste, secenekler] = await Promise.all([
    katalogListesi(vt, aktor, katalogFiltresiOku(sp)),
    katalogSecenekleri(vt, aktor),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* Sayfa Başlığı */}
      <div className="flex flex-col gap-1 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="size-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Ürün Portföyüm
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Firmanıza ait sisteme kayıtlı ürünler ve güncel katalog durumları aşağıda listelenmektedir.
        </p>
      </div>

      <AdminIletisim />

      <KatalogFiltreleri
        yol="/tedarikci"
        tedarikciler={[]}
        kategoriler={secenekler.kategoriler}
        tedarikciFiltresi={false}
      />

      <KatalogListesi
        {...liste}
        sp={sp}
        urunAdresi={(id) => `/tedarikci/urun/${id}`}
        durumGoster
      />
    </div>
  );
}

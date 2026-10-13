import Link from "next/link";
import { Suspense } from "react";
import { CalendarClock, ChevronRight, Receipt, ShieldCheck } from "lucide-react";
import { KatalogFiltreleri } from "@/components/katalog/katalog-filtreleri";
import { KatalogListesi } from "@/components/katalog/katalog-listesi";
import { KategoriSeridi } from "@/components/katalog/kategori-seridi";
import { IletisimBandi } from "@/components/site/bolumler";
import { katalogFiltresiOku, katalogListesi, katalogSecenekleri } from "@/lib/katalog";
import { db } from "@/lib/db";

type Arama = Promise<Record<string, string | string[] | undefined>>;

export const metadata = {
  title: "Ürün Kataloğu — tedarikcim.net.tr",
  description: "Faktoring destekli B2B toptan ürün kataloğu. Liste fiyatları, KDV bilgisi ve vadeli alım seçenekleri.",
};

export default function KatalogSayfasi({ searchParams }: { searchParams: Arama }) {
  return (
    <>
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div aria-hidden className="pointer-events-none absolute -top-32 right-0 size-[480px] rounded-full bg-emerald-500/15 blur-[110px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-16">
          <nav aria-label="Konum" className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Link href="/" className="hover:text-white">Ana Sayfa</Link>
            <ChevronRight className="size-3.5" />
            <span className="text-zinc-200">Ürün Kataloğu</span>
          </nav>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Ürün Kataloğu</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Toptan liste fiyatlarını inceleyin; vadeli alım ve teklif talepleriniz için ürün kartından bize doğrudan
            ulaşın.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
            {[
              { ikon: CalendarClock, m: "30–180 gün vade" },
              { ikon: Receipt, m: "Fiyatlar KDV hariç" },
              { ikon: ShieldCheck, m: "Teyitli fatura süreci" },
            ].map(({ ikon: Ikon, m }) => (
              <li key={m} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-200">
                <Ikon className="size-3.5 text-emerald-400" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Katalog yükleniyor…</p>}>
          <Icerik searchParams={searchParams} />
        </Suspense>
      </div>

      <IletisimBandi />
    </>
  );
}

async function Icerik({ searchParams }: { searchParams: Arama }) {
  const sp = await searchParams;
  const filtre = katalogFiltresiOku(sp);
  const [liste, secenekler] = await Promise.all([katalogListesi(db, filtre), katalogSecenekleri(db)]);

  return (
    <>
      {secenekler.kategoriler.length > 0 && <KategoriSeridi kategoriler={secenekler.kategoriler} />}
      <KatalogFiltreleri yol="/katalog" tedarikciler={[]} tedarikciFiltresi={false} kategoriler={secenekler.kategoriler} />
      <KatalogListesi {...liste} sp={sp} urunAdresi={(id) => `/katalog/urun/${id}`} />
    </>
  );
}

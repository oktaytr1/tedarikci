import Link from "next/link";
import { ArrowLeft, ArrowRight, PackageSearch } from "lucide-react";
import type { KatalogUrunu } from "@/lib/katalog";
import { UrunKarti } from "./urun-karti";

type Arama = Record<string, string | string[] | undefined>;

/** Ürün kartları + büyük dokunma hedefli sayfa düğmeleri (sunucu taraflı sayfalama). */
export function KatalogListesi(p: {
  urunler: KatalogUrunu[];
  toplam: number;
  sayfa: number;
  sayfaSayisi: number;
  sp: Arama;
  urunAdresi: (id: number) => string;
  durumGoster?: boolean;
}) {
  const adres = (n: number) => {
    const q = new URLSearchParams(
      Object.entries(p.sp).flatMap(([k, v]) =>
        v === undefined || k === "sayfa" ? [] : [[k, Array.isArray(v) ? v[0] : v]],
      ),
    );
    q.set("sayfa", String(n));
    return `?${q}`;
  };

  if (p.urunler.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center shadow-2xs">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
          <PackageSearch className="size-7" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">Uygun Ürün Bulunamadı</h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Arama kriterlerinize uyan herhangi bir ürün kaydı bulunmuyor. Farklı bir arama terimi veya filtre deneyebilirsiniz.
        </p>
      </div>
    );
  }

  const dugme =
    "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background px-4 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-muted active:scale-95";

  return (
    <div className="flex flex-col gap-4">
      {/* Liste Üst Bilgi Başlığı */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>Toplam <strong className="font-semibold text-foreground">{p.toplam}</strong> ürün listeleniyor</span>
        </span>
        {p.sayfaSayisi > 1 && (
          <span className="tabular-nums">
            Sayfa {p.sayfa} / {p.sayfaSayisi}
          </span>
        )}
      </div>

      {/* Ürün Izgarası */}
      <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {p.urunler.map((u) => (
          <li key={u.id}>
            <UrunKarti u={u} href={p.urunAdresi(u.id)} durumGoster={p.durumGoster} />
          </li>
        ))}
      </ul>

      {/* Sayfalama */}
      {p.sayfaSayisi > 1 && (
        <nav
          className="flex items-center justify-between border-t border-border/60 pt-4"
          aria-label="Sayfalar"
        >
          {p.sayfa > 1 ? (
            <Link className={dugme} href={adres(p.sayfa - 1)}>
              <ArrowLeft className="size-3.5" />
              <span>Önceki Sayfa</span>
            </Link>
          ) : (
            <span className={`${dugme} opacity-40 pointer-events-none`}>
              <ArrowLeft className="size-3.5" />
              <span>Önceki Sayfa</span>
            </span>
          )}

          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground tabular-nums">
            <span className="rounded-lg bg-muted px-2.5 py-1 font-semibold text-foreground">
              {p.sayfa}
            </span>
            <span>/</span>
            <span>{p.sayfaSayisi}</span>
          </div>

          {p.sayfa < p.sayfaSayisi ? (
            <Link className={dugme} href={adres(p.sayfa + 1)}>
              <span>Sonraki Sayfa</span>
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <span className={`${dugme} opacity-40 pointer-events-none`}>
              <span>Sonraki Sayfa</span>
              <ArrowRight className="size-3.5" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}

import Link from "next/link";
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
      Object.entries(p.sp).flatMap(([k, v]) => (v === undefined || k === "sayfa" ? [] : [[k, Array.isArray(v) ? v[0] : v]])),
    );
    q.set("sayfa", String(n));
    return `?${q}`;
  };
  if (p.urunler.length === 0) {
    return <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">Aramanıza uygun ürün yok.</p>;
  }
  const dugme = "flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-medium active:bg-muted";
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{p.toplam} ürün</p>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {p.urunler.map((u) => (
          <li key={u.id}>
            <UrunKarti u={u} href={p.urunAdresi(u.id)} durumGoster={p.durumGoster} />
          </li>
        ))}
      </ul>
      {p.sayfaSayisi > 1 && (
        <nav className="flex items-center gap-2 pt-2" aria-label="Sayfalar">
          {p.sayfa > 1 ? <Link className={dugme} href={adres(p.sayfa - 1)}>← Önceki</Link> : <span className={`${dugme} opacity-40`}>← Önceki</span>}
          <span className="px-2 text-sm text-muted-foreground tabular-nums">
            {p.sayfa}/{p.sayfaSayisi}
          </span>
          {p.sayfa < p.sayfaSayisi ? <Link className={dugme} href={adres(p.sayfa + 1)}>Sonraki →</Link> : <span className={`${dugme} opacity-40`}>Sonraki →</span>}
        </nav>
      )}
    </div>
  );
}

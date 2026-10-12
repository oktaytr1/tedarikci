"use client";

// Arama ve filtreler URL'de durur. Telefonda ekranın üstüne yapışık; dokunma hedefleri 44 px.

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search, Store, Tag, X } from "lucide-react";

export function KatalogFiltreleri({
  yol,
  tedarikciler,
  kategoriler,
  tedarikciFiltresi = true,
}: {
  /** Liste sayfasının sabit yolu. */
  yol: "/katalog" | "/tedarikci";
  tedarikciler: { id: number; unvan: string }[];
  kategoriler: string[];
  tedarikciFiltresi?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  function uygula(d: Record<string, string | null>) {
    const p = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(d)) {
      if (!v) p.delete(k);
      else p.set(k, v);
    }
    p.delete("sayfa");
    router.replace(`${yol}?${p}`, { scroll: false });
  }

  useEffect(
    () => () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    },
    [],
  );

  const seciliTedarikci = sp.get("tedarikci");
  const seciliKategori = sp.get("kategori");
  const filtreVar = !!(sp.get("q") || seciliTedarikci || seciliKategori);

  return (
    <div className="sticky top-[53px] z-20 -mx-4 flex flex-col gap-2.5 border-b border-border/80 bg-background/95 px-4 py-3 shadow-xs backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:p-4">
      {/* Arama Girişi */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
        <input
          type="search"
          enterKeyHint="search"
          aria-label="Ürün ara"
          placeholder="Ürün adı, barkod veya kodu ile ara…"
          className="h-11 w-full rounded-xl border border-input bg-background/80 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            if (zamanlayici.current) clearTimeout(zamanlayici.current);
            zamanlayici.current = setTimeout(() => uygula({ q: v.trim() }), 350);
          }}
        />
        {q && (
          <button
            type="button"
            aria-label="Aramayı temizle"
            onClick={() => {
              setQ("");
              uygula({ q: null });
            }}
            className="absolute right-3 flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Seçim Filtreleri */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {tedarikciFiltresi && (
          <div className="relative">
            <Store className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              aria-label="Tedarikçi Filtresi"
              className="h-11 w-full rounded-xl border border-input bg-background/80 pl-10 pr-8 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              value={seciliTedarikci ?? ""}
              onChange={(e) => uygula({ tedarikci: e.target.value })}
            >
              <option value="">Tüm Tedarikçiler ({tedarikciler.length})</option>
              {tedarikciler.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.unvan}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative">
          <Tag className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <select
            aria-label="Kategori Filtresi"
            className="h-11 w-full rounded-xl border border-input bg-background/80 pl-10 pr-8 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            value={seciliKategori ?? ""}
            onChange={(e) => uygula({ kategori: e.target.value })}
          >
            <option value="">Tüm Kategoriler ({kategoriler.length})</option>
            {kategoriler.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aktif Filtre Rozetleri & Sıfırla */}
      {filtreVar && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-muted-foreground">Aktif:</span>
            {q && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-medium">
                &ldquo;{q}&rdquo;
              </span>
            )}
            {seciliTedarikci && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-medium">
                {tedarikciler.find((t) => String(t.id) === seciliTedarikci)?.unvan ?? "Tedarikçi"}
              </span>
            )}
            {seciliKategori && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-medium">
                {seciliKategori}
              </span>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-destructive transition-colors hover:bg-destructive/10"
            onClick={() => {
              setQ("");
              router.replace(yol, { scroll: false });
            }}
          >
            <RotateCcw className="size-3" />
            Filtreleri Temizle
          </button>
        </div>
      )}
    </div>
  );
}

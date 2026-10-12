"use client";

// Arama ve filtreler URL'de durur. Telefonda ekranın üstüne yapışık; dokunma hedefleri 44 px.

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const secim =
  "h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm";

export function KatalogFiltreleri({
  yol,
  tedarikciler,
  kategoriler,
  tedarikciFiltresi = true,
}: {
  /** Liste sayfasının sabit yolu. usePathname kullanılmaz: girişten sonra "/" üzerinden yönlenince
   *  bir an "/" döner ve filtre "/?q=…" adresine gider, kök yönlendirmesi de sorguyu düşürürdü. */
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

  const filtreVar = !!(sp.get("q") || sp.get("tedarikci") || sp.get("kategori"));

  return (
    <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur">
      <input
        type="search"
        enterKeyHint="search"
        aria-label="Ürün ara"
        placeholder="Ürün adı veya kodu ara"
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={q}
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          if (zamanlayici.current) clearTimeout(zamanlayici.current);
          zamanlayici.current = setTimeout(() => uygula({ q: v.trim() }), 350);
        }}
      />
      <div className="flex gap-2">
        {tedarikciFiltresi && (
          <select aria-label="Tedarikçi" className={secim} value={sp.get("tedarikci") ?? ""} onChange={(e) => uygula({ tedarikci: e.target.value })}>
            <option value="">Tüm tedarikçiler</option>
            {tedarikciler.map((t) => (
              <option key={t.id} value={t.id}>
                {t.unvan}
              </option>
            ))}
          </select>
        )}
        <select aria-label="Kategori" className={secim} value={sp.get("kategori") ?? ""} onChange={(e) => uygula({ kategori: e.target.value })}>
          <option value="">Tüm kategoriler</option>
          {kategoriler.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      {filtreVar && (
        <button
          type="button"
          className="h-9 self-start text-sm text-muted-foreground underline"
          onClick={() => {
            setQ("");
            router.replace(yol, { scroll: false });
          }}
        >
          Filtreleri temizle
        </button>
      )}
    </div>
  );
}

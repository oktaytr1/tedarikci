"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Coffee, Droplets, Package, Sparkles, UtensilsCrossed, Wheat, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

const KATEGORI_IKONLARI: Record<string, React.ReactNode> = {
  "Yağ & Gıda": <Droplets className="size-3.5" />,
  "Bakliyat": <Wheat className="size-3.5" />,
  "Temel Gıda": <UtensilsCrossed className="size-3.5" />,
  "Temizlik": <Wind className="size-3.5" />,
  "Kişisel Bakım": <Sparkles className="size-3.5" />,
  "Ambalaj & Kâğıt": <Package className="size-3.5" />,
  "İçecek & Çay": <Coffee className="size-3.5" />,
};

export function KategoriSeridi({ kategoriler }: { kategoriler: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const secili = sp.get("kategori");

  function sec(k: string | null) {
    const p = new URLSearchParams(sp);
    if (!k) p.delete("kategori");
    else p.set("kategori", k);
    p.delete("sayfa");
    router.replace(`/katalog?${p}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        <span>Hızlı Kategori Seçimi</span>
        {secili && (
          <button
            onClick={() => sec(null)}
            className="text-[11px] font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Tüm Kategorileri Göster
          </button>
        )}
      </div>

      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => sec(null)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95",
            !secili
              ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
              : "border-border/80 bg-card text-foreground hover:bg-muted/80",
          )}
        >
          <Sparkles className="size-3.5" />
          <span>Tümü</span>
        </button>

        {kategoriler.map((k) => {
          const aktif = secili === k;
          const ikon = KATEGORI_IKONLARI[k] ?? <Package className="size-3.5" />;

          return (
            <button
              key={k}
              type="button"
              onClick={() => sec(aktif ? null : k)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95",
                aktif
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                  : "border-border/80 bg-card text-foreground hover:bg-muted/80",
              )}
            >
              {ikon}
              <span>{k}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

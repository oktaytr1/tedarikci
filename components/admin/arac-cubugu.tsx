"use client";

// Liste arama ve filtreleri URL'de durur (paylaşılabilir, geri tuşuyla geri gelir).

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Filtre = {
  ad: string;
  etiket: string;
  secenekler: { deger: string; etiket: string }[];
};

const secim =
  "h-9 rounded-xl border border-input bg-background/80 px-3 text-xs font-medium shadow-2xs outline-none transition-all focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export function AracCubugu({
  aramaIpucu,
  filtreler,
}: {
  aramaIpucu: string;
  filtreler: Filtre[];
}) {
  const router = useRouter();
  const yol = usePathname();
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

  const filtreVar = [...sp.keys()].some((k) => !["sirala", "yon", "sayfa"].includes(k));

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Ara"
          placeholder={aramaIpucu}
          className="h-9 w-64 rounded-xl pl-9 text-xs sm:w-72"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            if (zamanlayici.current) clearTimeout(zamanlayici.current);
            zamanlayici.current = setTimeout(() => uygula({ q: v.trim() }), 300);
          }}
        />
      </div>

      {filtreler.map((f) => (
        <select
          key={f.ad}
          aria-label={f.etiket}
          className={secim}
          value={sp.get(f.ad) ?? ""}
          onChange={(e) => uygula({ [f.ad]: e.target.value })}
        >
          <option value="">{f.etiket}: Tümü</option>
          {f.secenekler.map((s) => (
            <option key={s.deger} value={s.deger}>
              {s.etiket}
            </option>
          ))}
        </select>
      ))}

      {filtreVar && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          onClick={() => {
            setQ("");
            router.replace(yol, { scroll: false });
          }}
        >
          <RotateCcw className="size-3" />
          <span>Sıfırla</span>
        </Button>
      )}
    </div>
  );
}

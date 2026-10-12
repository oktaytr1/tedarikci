"use client";

// Liste arama ve filtreleri URL'de durur (paylaşılabilir, geri tuşuyla geri gelir).

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Filtre = { ad: string; etiket: string; secenekler: { deger: string; etiket: string }[] };

const secim =
  "h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AracCubugu({ aramaIpucu, filtreler }: { aramaIpucu: string; filtreler: Filtre[] }) {
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
    <div className="flex flex-wrap items-center gap-2">
      <Input
        aria-label="Ara"
        placeholder={aramaIpucu}
        className="w-72"
        value={q}
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          if (zamanlayici.current) clearTimeout(zamanlayici.current);
          zamanlayici.current = setTimeout(() => uygula({ q: v.trim() }), 300);
        }}
      />
      {filtreler.map((f) => (
        <select key={f.ad} aria-label={f.etiket} className={secim} value={sp.get(f.ad) ?? ""} onChange={(e) => uygula({ [f.ad]: e.target.value })}>
          <option value="">{f.etiket}: tümü</option>
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
          onClick={() => {
            setQ("");
            router.replace(yol, { scroll: false });
          }}
        >
          Filtreleri temizle
        </Button>
      )}
    </div>
  );
}

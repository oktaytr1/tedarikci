"use client";

// Admin listelerinin ortak tablosu. Filtre, sıralama ve sayfalama sunucuda (URL parametreleri);
// TanStack Table sütun modeli ve hücre çizimi içindir. Sütunlar çağıran istemci modülünde tanımlanır.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { tableFeatures, useTable, type ColumnDef, type RowData } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

export const ozellikler = tableFeatures({});
export type Sutun<T extends RowData> = ColumnDef<typeof ozellikler, T, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function VeriTablosu<T extends RowData>(p: {
  satirlar: T[];
  sutunlar: Sutun<T>[];
  /** sütun id → sunucudaki sıralama alanı */
  siralama: Record<string, string>;
  varsayilanSira: string;
  varsayilanYon?: "artan" | "azalan";
  satirAdresi: (t: T) => string;
  soluk?: (t: T) => boolean;
  sagHizali?: string[];
  bosMesaj?: string;
}) {
  const tablo = useTable({ features: ozellikler, columns: p.sutunlar, data: p.satirlar });
  const router = useRouter();
  const sp = useSearchParams();
  const aktifSira = sp.get("sirala") ?? p.varsayilanSira;
  const aktifYon = sp.get("yon") ?? p.varsayilanYon ?? "artan";

  function siralamaAdresi(alan: string) {
    const q = new URLSearchParams(sp);
    q.set("sirala", alan);
    q.set("yon", aktifSira === alan && aktifYon === "artan" ? "azalan" : "artan");
    q.delete("sayfa");
    return `?${q}`;
  }

  if (p.satirlar.length === 0) {
    return <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">{p.bosMesaj ?? "Kayıt yok."}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
          {tablo.getHeaderGroups().map((g) => (
            <tr key={g.id}>
              {g.headers.map((b) => {
                const alan = p.siralama[b.column.id];
                return (
                  <th key={b.id} className={cn("whitespace-nowrap px-3 py-2 font-medium", p.sagHizali?.includes(b.column.id) && "text-right")}>
                    {alan ? (
                      <Link href={siralamaAdresi(alan)} scroll={false} className="hover:text-foreground">
                        <tablo.FlexRender header={b} />
                        {aktifSira === alan ? (aktifYon === "artan" ? " ↑" : " ↓") : ""}
                      </Link>
                    ) : (
                      <tablo.FlexRender header={b} />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {tablo.getRowModel().rows.map((satir) => (
            <tr
              key={satir.id}
              onClick={() => router.push(p.satirAdresi(satir.original))}
              className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/40", p.soluk?.(satir.original) && "text-muted-foreground")}
            >
              {satir.getAllCells().map((h) => (
                <td key={h.id} className={cn("px-3 py-2 align-top", p.sagHizali?.includes(h.column.id) && "text-right tabular-nums")}>
                  <tablo.FlexRender cell={h} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

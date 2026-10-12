"use client";

import Link from "next/link";
import { AktifRozeti } from "@/components/admin/durum-rozeti";
import { oranYaz, paraYaz } from "@/lib/money";

type UrunSatiri = {
  id: number;
  kod: string;
  ad: string;
  kategori: string | null;
  birim: string;
  liste_fiyat: { toString(): string };
  kdv_orani: { toString(): string };
  aktif: boolean;
  fotograf_url: string | null;
};

export function UrunTablosu({ satirlar }: { satirlar: UrunSatiri[]; oneriler?: unknown }) {
  if (satirlar.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Henüz ürün yok.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
            <th className="px-3 py-2">Kod</th>
            <th className="px-3 py-2">Ad</th>
            <th className="px-3 py-2">Kategori</th>
            <th className="px-3 py-2 text-right">Fiyat</th>
            <th className="px-3 py-2 text-right">KDV</th>
            <th className="px-3 py-2">Durum</th>
          </tr>
        </thead>
        <tbody>
          {satirlar.map((u) => (
            <tr key={u.id} className={`border-b hover:bg-muted/30 ${!u.aktif ? "opacity-50" : ""}`}>
              <td className="px-3 py-2 font-mono text-xs">
                <Link href={`/admin/urunler/${u.id}`} className="hover:underline">{u.kod}</Link>
              </td>
              <td className="px-3 py-2">
                <Link href={`/admin/urunler/${u.id}`} className="hover:underline">{u.ad}</Link>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{u.kategori ?? "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {paraYaz(u.liste_fiyat)} <span className="text-xs text-muted-foreground">/ {u.birim}</span>
              </td>
              <td className="px-3 py-2 text-right">%{oranYaz(u.kdv_orani)}</td>
              <td className="px-3 py-2"><AktifRozeti aktif={u.aktif} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { AktifRozeti } from "@/components/admin/durum-rozeti";
import { ozellikler, VeriTablosu } from "@/components/admin/veri-tablosu";
import type { UrunSatiri } from "@/lib/admin/listeler";
import { oranYaz, paraYaz } from "@/lib/money";

const h = createColumnHelper<typeof ozellikler, UrunSatiri>();
const sutunlar = h.columns([
  h.accessor("kod", { header: "Kod", cell: (c) => <span className="font-mono text-xs">{c.getValue()}</span> }),
  h.accessor("ad", {
    header: "Ad",
    cell: (c) => (
      <span>
        {c.getValue()}
        {!c.row.original.fotografVar && <span className="ml-2 text-[11px] text-muted-foreground">fotoğrafsız</span>}
      </span>
    ),
  }),
  h.accessor("tedarikci", {
    header: "Tedarikçi",
    cell: (c) => (
      <span>
        {c.getValue()}
        {c.row.original.tedarikciPasif && <span className="ml-1 text-[11px] text-muted-foreground">(pasif firma)</span>}
      </span>
    ),
  }),
  h.accessor("kategori", { header: "Kategori", cell: (c) => c.getValue() ?? <span className="text-muted-foreground">—</span> }),
  h.accessor("listeFiyat", {
    header: "Liste fiyatı",
    cell: (c) => (
      <span>
        {paraYaz(c.getValue())} <span className="text-xs text-muted-foreground">/ {c.row.original.birim}</span>
      </span>
    ),
  }),
  h.accessor("kdvOrani", { header: "KDV", cell: (c) => `%${oranYaz(c.getValue())}` }),
  h.accessor("aktif", { header: "Durum", cell: (c) => <AktifRozeti aktif={c.getValue()} /> }),
]);

export function UrunTablosu({ satirlar }: { satirlar: UrunSatiri[] }) {
  return (
    <VeriTablosu
      satirlar={satirlar}
      sutunlar={sutunlar}
      siralama={{ kod: "kod", ad: "ad", kategori: "kategori", listeFiyat: "liste_fiyat" }}
      varsayilanSira="kod"
      satirAdresi={(u) => `/admin/urunler/${u.id}`}
      soluk={(u) => !u.aktif}
      sagHizali={["listeFiyat", "kdvOrani"]}
      bosMesaj="Bu filtrelerle ürün yok."
    />
  );
}

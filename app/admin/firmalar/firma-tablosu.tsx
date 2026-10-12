"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { AktifRozeti } from "@/components/admin/durum-rozeti";
import { ozellikler, VeriTablosu } from "@/components/admin/veri-tablosu";
import { FIRMA_TIP_ETIKETI } from "@/lib/admin/firma-etiket";
import type { FirmaSatiri } from "@/lib/admin/listeler";

const h = createColumnHelper<typeof ozellikler, FirmaSatiri>();
const sutunlar = h.columns([
  h.accessor("unvan", { header: "Ünvan" }),
  h.accessor("vergiNo", { header: "Vergi no", cell: (c) => <span className="font-mono text-xs">{c.getValue()}</span> }),
  h.accessor("tip", { header: "Tip", cell: (c) => FIRMA_TIP_ETIKETI[c.getValue()] }),
  h.accessor("telefon", { header: "Telefon", cell: (c) => c.getValue() ?? <span className="text-muted-foreground">—</span> }),
  h.accessor("kullaniciSayisi", { header: "Kullanıcı" }),
  h.accessor("urunSayisi", { header: "Ürün" }),
  h.accessor("aktif", { header: "Durum", cell: (c) => <AktifRozeti aktif={c.getValue()} /> }),
]);

export function FirmaTablosu({ satirlar }: { satirlar: FirmaSatiri[] }) {
  return (
    <VeriTablosu
      satirlar={satirlar}
      sutunlar={sutunlar}
      siralama={{ unvan: "unvan", vergiNo: "vergi_no" }}
      varsayilanSira="unvan"
      satirAdresi={(f) => `/admin/firmalar/${f.id}`}
      soluk={(f) => !f.aktif}
      sagHizali={["kullaniciSayisi", "urunSayisi"]}
      bosMesaj="Bu filtrelerle firma yok."
    />
  );
}

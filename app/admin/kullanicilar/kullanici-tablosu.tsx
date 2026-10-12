"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { AktifRozeti } from "@/components/admin/durum-rozeti";
import { ozellikler, VeriTablosu } from "@/components/admin/veri-tablosu";
import { ROL_ETIKETI } from "@/lib/admin/firma-etiket";
import type { KullaniciSatiri } from "@/lib/admin/listeler";
import { zamanYaz } from "@/lib/tarih";

const h = createColumnHelper<typeof ozellikler, KullaniciSatiri>();
const sutunlar = h.columns([
  h.accessor("email", { header: "E-posta" }),
  h.accessor("rol", { header: "Rol", cell: (c) => ROL_ETIKETI[c.getValue()] }),
  h.accessor("firma", {
    header: "Firma",
    cell: (c) =>
      c.getValue() ? (
        <span>
          {c.getValue()}
          {c.row.original.firmaPasif && <span className="ml-1 text-[11px] text-muted-foreground">(pasif firma)</span>}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  }),
  h.accessor("olusturma", { header: "Açılış", cell: (c) => zamanYaz(new Date(c.getValue())) }),
  h.accessor("aktif", { header: "Durum", cell: (c) => <AktifRozeti aktif={c.getValue()} /> }),
]);

export function KullaniciTablosu({ satirlar }: { satirlar: KullaniciSatiri[] }) {
  return (
    <VeriTablosu
      satirlar={satirlar}
      sutunlar={sutunlar}
      siralama={{ email: "email", rol: "rol", olusturma: "olusturma" }}
      varsayilanSira="email"
      satirAdresi={(k) => `/admin/kullanicilar/${k.id}`}
      soluk={(k) => !k.aktif || k.firmaPasif}
      bosMesaj="Bu filtrelerle kullanıcı yok."
    />
  );
}

import { oranYaz, paraYaz } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Liste fiyatı (KDV hariç) / birim; altında KDV oranı ve KDV dahil fiyat. */
export function Fiyat({
  listeFiyat,
  kdvOrani,
  kdvDahil,
  birim,
  buyuk,
}: {
  listeFiyat: string;
  kdvOrani: string;
  kdvDahil: string;
  birim: string;
  buyuk?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className={cn("font-semibold tabular-nums", buyuk ? "text-2xl" : "text-base")}>
        {paraYaz(listeFiyat)} TL <span className="text-sm font-normal text-muted-foreground">/ {birim}</span>
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        KDV hariç · +%{oranYaz(kdvOrani)} KDV · KDV dahil {paraYaz(kdvDahil)} TL
      </span>
    </div>
  );
}

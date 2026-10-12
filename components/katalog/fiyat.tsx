import { oranYaz, paraYaz } from "@/lib/money";

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
  if (buyuk) {
    return (
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/20 p-4 shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Liste Fiyatı (KDV Hariç)
            </span>
            <div className="mt-0.5 flex items-baseline gap-1.5 font-bold tabular-nums text-foreground">
              <span className="text-3xl font-extrabold tracking-tight">{paraYaz(listeFiyat)}</span>
              <span className="text-lg font-semibold text-muted-foreground">TL</span>
              <span className="text-sm font-medium text-muted-foreground">/ {birim}</span>
            </div>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
            +%{oranYaz(kdvOrani)} KDV
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
          <span>KDV Dahil Tutar:</span>
          <span className="font-semibold tabular-nums text-foreground">
            {paraYaz(kdvDahil)} TL <span className="font-normal text-muted-foreground">/ {birim}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-1 font-semibold tabular-nums text-foreground">
        <span className="text-base font-bold">{paraYaz(listeFiyat)}</span>
        <span className="text-xs text-muted-foreground">TL / {birim}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground">
        <span className="font-medium text-emerald-700 dark:text-emerald-400">
          +%{oranYaz(kdvOrani)}
        </span>
        <span>·</span>
        <span>KDV dahil {paraYaz(kdvDahil)} TL</span>
      </div>
    </div>
  );
}

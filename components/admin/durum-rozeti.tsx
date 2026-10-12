import { cn } from "@/lib/utils";

export function AktifRozeti({ aktif, pasifEtiket = "Pasif" }: { aktif: boolean; pasifEtiket?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        aktif
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
      )}
    >
      {aktif ? "Aktif" : pasifEtiket}
    </span>
  );
}

import { cn } from "@/lib/utils";

export function AktifRozeti({
  aktif,
  pasifEtiket = "Pasif",
}: {
  aktif: boolean;
  pasifEtiket?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-2xs",
        aktif
          ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          aktif ? "bg-emerald-500" : "bg-zinc-400",
        )}
      />
      <span>{aktif ? "Aktif" : pasifEtiket}</span>
    </span>
  );
}

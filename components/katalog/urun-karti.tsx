import Link from "next/link";
import type { KatalogUrunu } from "@/lib/katalog";
import { Fiyat } from "./fiyat";
import { UrunGorseli } from "./urun-gorseli";

/** Telefonda tam genişlikte, tek dokunuşla açılan ürün satırı; geniş ekranda ızgara hücresi. */
export function UrunKarti({ u, href, durumGoster }: { u: KatalogUrunu; href: string; durumGoster?: boolean }) {
  return (
    <Link
      href={href}
      className="flex gap-3 rounded-xl border bg-card p-3 active:bg-muted/60 sm:hover:bg-muted/40"
    >
      <UrunGorseli url={u.fotografUrl} alt={u.ad} className="size-24 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 font-medium leading-snug">{u.ad}</span>
        <span className="truncate text-xs text-muted-foreground">
          <span className="font-mono">{u.kod}</span> · {u.tedarikci}
        </span>
        {durumGoster && !u.aktif && (
          <span className="w-fit rounded bg-zinc-200 px-1.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Pasif — katalogda görünmüyor
          </span>
        )}
        <div className="mt-auto">
          <Fiyat listeFiyat={u.listeFiyat} kdvOrani={u.kdvOrani} kdvDahil={u.kdvDahil} birim={u.birim} />
        </div>
      </div>
    </Link>
  );
}

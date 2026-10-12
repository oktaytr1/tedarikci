import Link from "next/link";
import { Building2, ChevronRight, Tag } from "lucide-react";
import type { KatalogUrunu } from "@/lib/katalog";
import { Fiyat } from "./fiyat";
import { UrunGorseli } from "./urun-gorseli";

/** Telefonda tam genişlikte, tek dokunuşla açılan ürün satırı; geniş ekranda ızgara hücresi. */
export function UrunKarti({
  u,
  href,
  durumGoster,
}: {
  u: KatalogUrunu;
  href: string;
  durumGoster?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs transition-all duration-200 hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
    >
      {/* Ürün Görseli */}
      <UrunGorseli
        url={u.fotografUrl}
        alt={u.ad}
        className="size-24 shrink-0 rounded-xl border border-border/50 bg-background object-contain sm:size-28"
      />

      {/* Ürün Detayları */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
        <div className="flex flex-col gap-1">
          {/* Üst Bilgiler: Kod & Kategori */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-mono font-medium text-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded-md">
              {u.kod}
            </span>
            {u.kategori && (
              <span className="inline-flex items-center gap-0.5 truncate">
                <span>·</span>
                <Tag className="size-3 shrink-0" />
                <span className="truncate">{u.kategori}</span>
              </span>
            )}
          </div>

          {/* Ürün Adı */}
          <span className="line-clamp-2 font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
            {u.ad}
          </span>

          {/* Tedarikçi Adı */}
          <span className="inline-flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Building2 className="size-3.5 shrink-0 text-muted-foreground/70" />
            <span className="truncate">{u.tedarikci}</span>
          </span>

          {/* Pasif Ürün Uyarısı (Tedarikçi ekranında) */}
          {durumGoster && !u.aktif && (
            <span className="mt-1 w-fit rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              Pasif · Katalogda gizli
            </span>
          )}
        </div>

        {/* Fiyat ve İncele Oku */}
        <div className="mt-2 flex items-end justify-between border-t border-border/40 pt-2">
          <Fiyat
            listeFiyat={u.listeFiyat}
            kdvOrani={u.kdvOrani}
            kdvDahil={u.kdvDahil}
            birim={u.birim}
          />
          <div className="hidden size-7 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground sm:flex">
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

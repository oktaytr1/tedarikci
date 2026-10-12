import Link from "next/link";
import { Building2, ChevronRight, MessageCircle, Tag } from "lucide-react";
import type { KatalogUrunu } from "@/lib/katalog";
import { oranYaz, paraYaz } from "@/lib/money";
import { UrunGorseli } from "./urun-gorseli";

/** Modern dikey B2B ürün kartı — E-ticaret standardında görsel hiyerarşi, KDV rozeti ve WhatsApp sipariş butonu. */
export function UrunKarti({
  u,
  href,
  durumGoster,
}: {
  u: KatalogUrunu;
  href: string;
  durumGoster?: boolean;
}) {
  const whatsAppMesaji = `Merhaba, tedarikcim.net.tr üzerinden "${u.ad}" (${u.kod}) ürününüz hakkında toptan sipariş ve fiyat bilgisi almak istiyorum.`;
  const whatsAppAdresi = `https://wa.me/908503000000?text=${encodeURIComponent(whatsAppMesaji)}`;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl">
      {/* Üst Görsel Bölümü */}
      <Link href={href} className="relative aspect-4/3 w-full overflow-hidden bg-white p-3 dark:bg-zinc-950/40">
        <UrunGorseli
          url={u.fotografUrl}
          alt={u.ad}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />

        {/* Sol Üst Kategori Rozeti */}
        {u.kategori && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-zinc-900/80 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-xs dark:bg-white/90 dark:text-zinc-900">
            <Tag className="size-2.5" />
            <span>{u.kategori}</span>
          </span>
        )}

        {/* Sağ Üst KDV Rozeti */}
        <span className="absolute right-3 top-3 rounded-lg border border-emerald-300/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-xs dark:border-emerald-800/80 dark:bg-emerald-950 dark:text-emerald-300">
          +%{oranYaz(u.kdvOrani)} KDV
        </span>
      </Link>

      {/* Orta Bilgi Bölümü */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {/* Ürün Kodu & Tedarikçi */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
            {u.kod}
          </span>
          <span className="inline-flex items-center gap-1 truncate text-[11px] font-medium text-muted-foreground">
            <Building2 className="size-3 shrink-0 text-muted-foreground/70" />
            <span className="truncate">{u.tedarikci}</span>
          </span>
        </div>

        {/* Ürün Başlığı */}
        <Link href={href} className="flex-1">
          <h3 className="line-clamp-2 text-sm font-bold text-foreground transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400 leading-snug">
            {u.ad}
          </h3>
        </Link>

        {/* Pasif Durum Uyarısı */}
        {durumGoster && !u.aktif && (
          <span className="w-fit rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Pasif · Katalogda Gizli
          </span>
        )}

        {/* Fiyat Bloğu */}
        <div className="mt-1 rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-900/50 border border-border/50">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Liste Fiyatı:</span>
            <div className="flex items-baseline gap-1 font-bold tabular-nums text-foreground">
              <span className="text-lg font-extrabold text-foreground">{paraYaz(u.listeFiyat)}</span>
              <span className="text-xs text-muted-foreground">TL / {u.birim}</span>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-1">
            <span>KDV Dahil:</span>
            <span className="font-semibold tabular-nums text-foreground/80">
              {paraYaz(u.kdvDahil)} TL
            </span>
          </div>
        </div>
      </div>

      {/* Alt Aksiyon Butonları */}
      <div className="flex items-center gap-2 border-t border-border/60 bg-muted/20 p-3">
        {/* WhatsApp Hızlı Sipariş */}
        <a
          href={whatsAppAdresi}
          target="_blank"
          rel="noopener noreferrer"
          title="WhatsApp ile bu ürün hakkında sipariş / bilgi iste"
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-emerald-700 active:scale-95"
        >
          <MessageCircle className="size-3.5" />
          <span>WhatsApp Sipariş</span>
        </a>

        {/* Ürün Detayı */}
        <Link
          href={href}
          title="Ürün detaylarını gör"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background text-foreground shadow-2xs transition-all hover:bg-muted active:scale-95"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

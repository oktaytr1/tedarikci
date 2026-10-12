import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * tedarikcim.net.tr kurumsal marka logosu.
 * Modern B2B tedarik zinciri ve depo/kutu geometrisini temsil eden özel SVG logomark.
 */
export function Logo({
  boyut = "orta",
  baglanti = true,
  href = "/",
  altMetin = true,
  className,
}: {
  boyut?: "kucuk" | "orta" | "buyuk";
  baglanti?: boolean;
  href?: string;
  altMetin?: boolean;
  className?: string;
}) {
  const boyutlar = {
    kucuk: {
      kutu: "size-7",
      svg: "size-4",
      baslik: "text-base font-bold",
      alan: "text-[10px]",
      alt: "text-[9px]",
    },
    orta: {
      kutu: "size-9",
      svg: "size-5",
      baslik: "text-lg font-bold tracking-tight",
      alan: "text-xs",
      alt: "text-[10px]",
    },
    buyuk: {
      kutu: "size-12",
      svg: "size-7",
      baslik: "text-2xl font-extrabold tracking-tight",
      alan: "text-sm",
      alt: "text-xs",
    },
  }[boyut];

  const icerik = (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Geometrik B2B Logomark: Akıllı kutu ve bağlantı halkaları */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white shadow-sm ring-1 ring-black/5 dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900",
          boyutlar.kutu,
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={boyutlar.svg}
        >
          {/* İzometrik B2B Tedarik Kutusu */}
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="M12 12 4 7.5" />
          <path d="m12 12 8-4.5" />
          <path d="M12 12v9" />
          {/* Merkez bağlantı noktası */}
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span className={cn("font-bold text-foreground", boyutlar.baslik)}>
            tedarikcim
          </span>
          <span
            className={cn(
              "ml-0.5 font-semibold text-emerald-600 dark:text-emerald-400",
              boyutlar.alan,
            )}
          >
            .net.tr
          </span>
        </div>
        {altMetin && (
          <span
            className={cn(
              "font-medium text-muted-foreground tracking-wider uppercase mt-0.5",
              boyutlar.alt,
            )}
          >
            B2B Kapalı Katalog
          </span>
        )}
      </div>
    </div>
  );

  if (baglanti) {
    return (
      <Link href={href} className="inline-flex transition-opacity hover:opacity-90">
        {icerik}
      </Link>
    );
  }

  return icerik;
}

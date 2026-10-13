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
  ters,
}: {
  boyut?: "kucuk" | "orta" | "buyuk";
  baglanti?: boolean;
  href?: string;
  altMetin?: boolean;
  className?: string;
  /** Koyu zemin üzerinde kullanım. */
  ters?: boolean;
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
          ters ? "relative flex items-center justify-center rounded-md bg-white text-lacivert-900" : "relative flex items-center justify-center rounded-md bg-lacivert-900 text-white",
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
          <span className={cn("font-bold", ters ? "text-white" : "text-lacivert-950", boyutlar.baslik)}>
            tedarikcim
          </span>
          <span
            className={cn(
              cn("ml-0.5 font-semibold", ters ? "text-lacivert-300" : "text-marka-600"),
              boyutlar.alan,
            )}
          >
            .net.tr
          </span>
        </div>
        {altMetin && (
          <span
            className={cn(
              "font-medium text-lacivert-500 tracking-wider uppercase mt-0.5",
              boyutlar.alt,
            )}
          >
            B2B Vadeli Tedarik
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

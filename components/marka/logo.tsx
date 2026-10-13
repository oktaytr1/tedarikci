import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * tedarikcim.net.tr logosu: "köprü". İki nokta market ve üreticiyi, aradaki kemer ikisini bağlayan
 * tedarikcim'i temsil eder. Aynı şekil app/icon.svg ve app/opengraph-image.tsx içinde de kullanılır.
 */
export function KopruIsareti({ className, ters }: { className?: string; ters?: boolean }) {
  return (
    <svg viewBox="0 0 56 34" aria-hidden className={className}>
      <path
        d="M8 26C16 4 40 4 48 26"
        fill="none"
        className={ters ? "stroke-white" : "stroke-lacivert-900"}
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <circle cx="8" cy="26" r="5.5" className={ters ? "fill-white" : "fill-lacivert-900"} />
      <circle cx="48" cy="26" r="5.5" className={ters ? "fill-[#5fbf94]" : "fill-marka-600"} />
    </svg>
  );
}

export function Logo({
  boyut = "orta",
  baglanti = true,
  href = "/",
  className,
  ters,
}: {
  boyut?: "kucuk" | "orta" | "buyuk";
  baglanti?: boolean;
  href?: string;
  className?: string;
  /** Koyu zemin üzerinde kullanım. */
  ters?: boolean;
}) {
  const boyutlar = {
    kucuk: { isaret: "h-4", yazi: "text-base" },
    orta: { isaret: "h-5", yazi: "text-xl" },
    buyuk: { isaret: "h-7", yazi: "text-3xl" },
  }[boyut];

  const icerik = (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <KopruIsareti ters={ters} className={cn("w-auto shrink-0", boyutlar.isaret)} />
      <span
        className={cn(
          "font-semibold tracking-tight leading-none",
          ters ? "text-white" : "text-lacivert-950",
          boyutlar.yazi,
        )}
      >
        tedarikcim
      </span>
    </span>
  );

  if (baglanti) {
    return (
      <Link href={href} aria-label="tedarikcim.net.tr ana sayfa" className="inline-flex transition-opacity hover:opacity-80">
        {icerik}
      </Link>
    );
  }

  return icerik;
}

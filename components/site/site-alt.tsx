import Link from "next/link";
import { Logo } from "@/components/marka/logo";
import { SITE_BAGLANTILARI } from "./site-ust";

// İletişim bilgileri ana sayfanın "Bize ulaşın" bölümünde; footer yalnız gezinme ve telif içerir.
export function SiteAlt() {
  return (
    <footer className="border-t border-white/10 bg-lacivert-950 text-lacivert-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:items-center lg:justify-between">
        <Logo href="/" altMetin={false} ters />
        <nav aria-label="Alt menü" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {SITE_BAGLANTILARI.map((b) => (
            <Link key={b.href} href={b.href} className="transition-colors hover:text-white">
              {b.etiket}
            </Link>
          ))}
        </nav>
        <span className="text-xs">© 2026 tedarikcim.net.tr</span>
      </div>
    </footer>
  );
}

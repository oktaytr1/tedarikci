import Link from "next/link";
import { Phone } from "lucide-react";
import { Logo } from "@/components/marka/logo";
import { TELEFON_ADRESI, TELEFON_GORUNEN } from "@/lib/iletisim";
import { MobilMenu } from "./mobil-menu";

export const SITE_BAGLANTILARI = [
  { href: "/#cozumler", etiket: "Çözümler" },
  { href: "/#nasil-calisir", etiket: "Nasıl Çalışır" },
  { href: "/#kategoriler", etiket: "Ürün Grupları" },
  { href: "/#avantajlar", etiket: "Avantajlar" },
  { href: "/#sss", etiket: "SSS" },
  { href: "/#iletisim", etiket: "İletişim" },
] as const;

export function SiteUst() {
  return (
    <header className="sticky top-0 z-40 border-b border-lacivert-100 bg-white">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4">
        <Logo href="/" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
          {SITE_BAGLANTILARI.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="px-3 py-2 text-[15px] font-medium text-lacivert-700 transition-colors hover:text-lacivert-950"
            >
              {b.etiket}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a href={TELEFON_ADRESI} className="hidden items-center gap-1.5 text-sm font-medium text-lacivert-700 hover:text-lacivert-950 xl:inline-flex">
            <Phone className="size-4" strokeWidth={1.75} />
            {TELEFON_GORUNEN}
          </a>
          <Link
            href="/#iletisim"
            className="hidden h-10 items-center gap-2 rounded-md bg-lacivert-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-lacivert-800 sm:inline-flex"
          >
            Teklif al
          </Link>
          <MobilMenu baglantilar={SITE_BAGLANTILARI} />
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { Phone } from "lucide-react";
import { Logo } from "@/components/marka/logo";
import { MESAJLAR, TELEFON_ADRESI, TELEFON_GORUNEN, whatsAppAdresi } from "@/lib/iletisim";
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
    <>
      {/* İnce üst bilgi şeridi */}
      <div className="hidden bg-lacivert-950 text-lacivert-300 sm:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs">
          <span>Faktoring destekli B2B toptan tedarik</span>
          <a href={TELEFON_ADRESI} className="inline-flex items-center gap-1.5 font-medium text-white hover:text-lacivert-100">
            <Phone className="size-3.5" />
            {TELEFON_GORUNEN}
          </a>
        </div>
      </div>

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

          <div className="flex items-center gap-2">
            <a
              href={whatsAppAdresi(MESAJLAR.genel)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 items-center gap-2 rounded-md bg-lacivert-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-lacivert-800 sm:inline-flex"
            >
              Teklif al
            </a>
            <MobilMenu baglantilar={SITE_BAGLANTILARI} />
          </div>
        </div>
      </header>
    </>
  );
}

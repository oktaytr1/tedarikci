import { Logo } from "@/components/marka/logo";

// Menü header'da sabit, iletişim "Bize ulaşın" bölümünde; footer yalnız marka ve telif içerir.
export function SiteAlt() {
  return (
    <footer className="border-t border-white/10 bg-lacivert-950 text-lacivert-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <Logo href="/" altMetin={false} ters />
          <span className="text-sm">Marketlere vadeli mal tedariki, üreticilere anında nakit.</span>
        </div>
        <span className="text-xs">© 2026 tedarikcim.net.tr</span>
      </div>
    </footer>
  );
}

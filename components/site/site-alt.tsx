import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/marka/logo";
import { MESAJLAR, TELEFON_ADRESI, TELEFON_GORUNEN, whatsAppAdresi } from "@/lib/iletisim";

const SUTUNLAR = [
  {
    baslik: "Kurumsal",
    baglantilar: [
      { href: "/#cozumler", etiket: "Çözümler" },
      { href: "/#nasil-calisir", etiket: "Nasıl Çalışır" },
      { href: "/#avantajlar", etiket: "Avantajlar" },
      { href: "/#sss", etiket: "Sıkça Sorulan Sorular" },
    ],
  },
  {
    baslik: "Başvuru",
    baglantilar: [
      { href: "/#cozumler", etiket: "Marketler için" },
      { href: "/#cozumler", etiket: "Üreticiler için" },
      { href: "/#iletisim", etiket: "İletişim" },
    ],
  },
] as const;

export function SiteAlt() {
  return (
    <footer className="bg-lacivert-950 text-lacivert-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <Logo href="/" altMetin={false} ters />
          <p className="max-w-xs text-sm leading-relaxed">
            Marketlere vadeli mal tedariki, üreticilere anında nakit.
          </p>
        </div>

        {SUTUNLAR.map((s) => (
          <div key={s.baslik}>
            <h3 className="text-sm font-semibold text-white">{s.baslik}</h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {s.baglantilar.map((b) => (
                <li key={b.etiket}>
                  <Link href={b.href} className="transition-colors hover:text-white">
                    {b.etiket}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-sm font-semibold text-white">İletişim</h3>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li>
              <a href={TELEFON_ADRESI} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                <Phone className="size-4 text-lacivert-300" />
                {TELEFON_GORUNEN}
              </a>
            </li>
            <li>
              <a
                href={whatsAppAdresi(MESAJLAR.genel)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-white"
              >
                <MessageCircle className="size-4 text-lacivert-300" />
                WhatsApp ile yazın
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 tedarikcim.net.tr · Tüm hakları saklıdır.</span>
        </div>
      </div>
    </footer>
  );
}

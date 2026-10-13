"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobilMenu({ baglantilar }: { baglantilar: ReadonlyArray<{ href: string; etiket: string }> }) {
  const [acik, setAcik] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={acik ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={acik}
        onClick={() => setAcik((a) => !a)}
        className="inline-flex size-10 items-center justify-center rounded-md border border-lacivert-200 text-lacivert-900 hover:bg-lacivert-50"
      >
        {acik ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {acik && (
        <div className="absolute inset-x-0 top-full border-b border-lacivert-100 bg-white shadow-md">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {baglantilar.map((b) => (
              <Link
                key={b.href}
                href={b.href}
                onClick={() => setAcik(false)}
                className="border-b border-lacivert-100 px-1 py-3.5 text-[15px] font-medium text-lacivert-900"
              >
                {b.etiket}
              </Link>
            ))}
            <Link
              href="/#iletisim"
              onClick={() => setAcik(false)}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-lacivert-900 text-sm font-semibold text-white hover:bg-lacivert-800"
            >
              Teklif al
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { CikisDugmesi } from "@/components/oturum/cikis-dugmesi";
import { kapsamliDb } from "@/lib/scope";
import type { Aktor } from "@/lib/scope-cekirdek";

export type MenuOgesi = { href: string; etiket: string };

// Admin ve tedarikçi ekran setlerinin ortak üst çubuğu.
export async function PanelKabugu({
  aktor,
  baslik,
  menu = [],
  children,
}: {
  aktor: Aktor;
  baslik: string;
  menu?: MenuOgesi[];
  children: React.ReactNode;
}) {
  const vt = await kapsamliDb();
  const ben = await vt.kullanici.findUnique({
    where: { id: aktor.kullaniciId },
    select: { email: true, firma: { select: { unvan: true } } },
  });
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="font-semibold">{baslik}</div>
          <nav className="flex flex-wrap gap-1 text-sm">
            {menu.map((m) => (
              <Link key={m.href} href={m.href} className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                {m.etiket}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {ben?.email}
            {ben?.firma ? ` · ${ben.firma.unvan}` : ""}
          </span>
          <CikisDugmesi />
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}

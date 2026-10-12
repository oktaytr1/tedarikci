import { CikisDugmesi } from "@/components/oturum/cikis-dugmesi";
import { kapsamliDb } from "@/lib/scope";
import type { Aktor } from "@/lib/scope-cekirdek";

// Admin ve tedarikçi ekran setlerinin ortak üst çubuğu.
export async function PanelKabugu({
  aktor,
  baslik,
  children,
}: {
  aktor: Aktor;
  baslik: string;
  children: React.ReactNode;
}) {
  const vt = await kapsamliDb();
  const ben = await vt.kullanici.findUnique({
    where: { id: aktor.kullaniciId },
    select: { email: true, firma: { select: { unvan: true } } },
  });
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div className="font-semibold">{baslik}</div>
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

import Link from "next/link";

export function SayfaBasligi({ baslik, geri, sag }: { baslik: React.ReactNode; geri?: { href: string; etiket: string }; sag?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {geri && (
          <Link href={geri.href} className="text-sm text-muted-foreground hover:text-foreground">
            ← {geri.etiket}
          </Link>
        )}
        <h1 className="text-lg font-semibold">{baslik}</h1>
      </div>
      {sag}
    </div>
  );
}

export function Bildirim({ children, tur = "basari" }: { children: React.ReactNode; tur?: "basari" | "uyari" }) {
  return (
    <div
      className={
        tur === "basari"
          ? "rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
          : "rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
      }
    >
      {children}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type MenuOgesi = { href: string; etiket: string; ikon?: React.ReactNode };

export function PanelNav({ menu }: { menu: MenuOgesi[] }) {
  const pathname = usePathname();

  if (!menu || menu.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm font-medium" aria-label="Ana Menü">
      {menu.map((m) => {
        const aktif =
          pathname === m.href ||
          (m.href !== "/admin" && m.href !== "/katalog" && m.href !== "/tedarikci" && pathname.startsWith(`${m.href}/`));

        return (
          <Link
            key={m.href}
            href={m.href}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              aktif
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {m.ikon}
            <span>{m.etiket}</span>
          </Link>
        );
      })}
    </nav>
  );
}

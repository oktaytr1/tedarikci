import type { Metadata } from "next";
import { Package } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/marka/logo";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo baglanti={false} />
            <span className="text-sm font-semibold text-muted-foreground">Yönetim</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/admin/urunler" className="flex items-center gap-1 hover:text-foreground text-muted-foreground">
              <Package className="size-4" /> Ürünler
            </Link>
          </nav>
          <div className="flex-1" />
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
            Siteye git →
          </Link>
        </div>
      </header>
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

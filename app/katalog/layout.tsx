import { Logo } from "@/components/marka/logo";

export default function KatalogDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Logo href="/katalog" className="h-7" />
        </div>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © 2026 tedarikcim.net.tr
      </footer>
    </div>
  );
}

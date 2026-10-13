import Link from "next/link";
import { SiteAlt } from "@/components/site/site-alt";
import { SiteUst } from "@/components/site/site-ust";

export default function BulunamadiSayfasi() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteUst />
      <main className="flex flex-1 items-center bg-lacivert-50">
        <div className="mx-auto max-w-7xl px-4 py-32">
          <p className="text-sm font-semibold text-lacivert-500">404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-lacivert-950 sm:text-4xl">Sayfa bulunamadı</h1>
          <p className="mt-3 text-lg text-lacivert-500">Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.</p>
          <Link
            href="/"
            className="mt-8 inline-flex h-12 items-center rounded-md bg-lacivert-900 px-6 text-sm font-semibold text-white hover:bg-lacivert-800"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </main>
      <SiteAlt />
    </div>
  );
}

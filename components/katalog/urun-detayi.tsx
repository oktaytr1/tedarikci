import Link from "next/link";
import type { KatalogDetayi } from "@/lib/katalog";
import { miktarYaz, oranYaz } from "@/lib/money";
import { Fiyat } from "./fiyat";
import { UrunGorseli } from "./urun-gorseli";

/** Ürün detayı (alıcı ve tedarikçi ortak). Telefonda tek sütun; `altEylem` alt kenarda sabit durur. */
export function UrunDetayi({
  u,
  geri,
  ek,
  altEylem,
}: {
  u: KatalogDetayi;
  geri: { href: string; etiket: string };
  ek?: React.ReactNode;
  altEylem?: React.ReactNode;
}) {
  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-4 pb-24 md:pb-0">
      <Link href={geri.href} className="-ml-2 flex h-11 w-fit items-center px-2 text-sm text-muted-foreground">
        ← {geri.etiket}
      </Link>
      <div className="grid gap-6 md:grid-cols-2">
        <UrunGorseli url={u.fotografUrl} alt={u.ad} className="aspect-square w-full rounded-xl border" />
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold leading-snug">{u.ad}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{u.kod}</span>
              {u.kategori && <> · {u.kategori}</>}
            </p>
          </div>
          {ek}
          <Fiyat listeFiyat={u.listeFiyat} kdvOrani={u.kdvOrani} kdvDahil={u.kdvDahil} birim={u.birim} buyuk />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border p-3 text-sm">
            <dt className="text-muted-foreground">Birim</dt>
            <dd>{u.birim}</dd>
            <dt className="text-muted-foreground">KDV oranı</dt>
            <dd>%{oranYaz(u.kdvOrani)}</dd>
            <dt className="text-muted-foreground">Koli adedi</dt>
            <dd>{u.koliAdedi ?? "—"}</dd>
            <dt className="text-muted-foreground">Min. sipariş</dt>
            <dd>{u.minSiparis ? `${miktarYaz(u.minSiparis)} ${u.birim}` : "—"}</dd>
            <dt className="text-muted-foreground">Kategori</dt>
            <dd>{u.kategori ?? "—"}</dd>
          </dl>
          {u.aciklama && (
            <section>
              <h2 className="mb-1 text-sm font-semibold">Açıklama</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed">{u.aciklama}</p>
            </section>
          )}
          <section className="rounded-xl border p-3 text-sm">
            <h2 className="mb-1 text-sm font-semibold">Tedarikçi</h2>
            <p className="font-medium">{u.tedarikciBilgisi.unvan}</p>
            {u.tedarikciBilgisi.adres && <p className="whitespace-pre-line text-muted-foreground">{u.tedarikciBilgisi.adres}</p>}
            {u.tedarikciBilgisi.telefon && <p className="text-muted-foreground">{u.tedarikciBilgisi.telefon}</p>}
          </section>
        </div>
      </div>
      {altEylem && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
          {altEylem}
        </div>
      )}
    </article>
  );
}

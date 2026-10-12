import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  MapPin,
  Phone,
  Tag,
} from "lucide-react";
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
    <article className="mx-auto flex max-w-5xl flex-col gap-6 pb-28 md:pb-8">
      {/* Geri Dönüş Linki */}
      <div>
        <Link
          href={geri.href}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>{geri.etiket}</span>
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Sol Kolon: Ürün Görseli & Rozet */}
        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
            <UrunGorseli
              url={u.fotografUrl}
              alt={u.ad}
              className="aspect-square w-full rounded-xl object-contain"
            />
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>tedarikcim.net.tr Doğrulanmış Firma Kataloğu</span>
          </div>
        </div>

        {/* Sağ Kolon: Detaylar, Fiyat ve Tedarikçi */}
        <div className="flex flex-col gap-5">
          {/* Başlık ve Kod */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-semibold bg-muted px-2 py-0.5 rounded-md text-foreground/80">
                {u.kod}
              </span>
              {u.kategori && (
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Tag className="size-3" />
                  <span>{u.kategori}</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
              {u.ad}
            </h1>
          </div>

          {ek}

          {/* Fiyat Kartı */}
          <Fiyat
            listeFiyat={u.listeFiyat}
            kdvOrani={u.kdvOrani}
            kdvDahil={u.kdvDahil}
            birim={u.birim}
            buyuk
          />

          {/* Tedarikçi Finansmanı & Vade Seçenekleri */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-2xs">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CalendarClock className="size-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                    Tedarikçi Finansmanı & Vadeli Alım
                  </h2>
                  <span className="text-[11px] text-muted-foreground">30 - 180 Güne Varan Vade İmkanı</span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                Faktoring Destekli
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 py-2 text-center text-xs font-semibold">
              <div className="rounded-lg border border-emerald-500/20 bg-background/80 py-1.5 text-foreground">
                30 Gün
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-background/80 py-1.5 text-foreground">
                60 Gün
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-background/80 py-1.5 text-foreground">
                90 Gün
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-600 text-white shadow-2xs">
                180 Gün
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Marketler ve perakende alıcılar için vadeli ödeme kolaylığı. Mal teslimi teyit edildiğinde üreticinin fatura bedeli finansman ortaklığıyla peşin ödenir.
            </p>
          </div>

          {/* Ürün B2B Özellik Tablosu */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Boxes className="size-3.5" />
              <span>Sipariş & Birim Parametreleri</span>
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Birim</dt>
                <dd className="font-semibold text-foreground">{u.birim}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">KDV Oranı</dt>
                <dd className="font-semibold text-foreground">%{oranYaz(u.kdvOrani)}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Koli İçi Adet</dt>
                <dd className="font-semibold text-foreground">{u.koliAdedi ?? "Serbest"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Min. Sipariş</dt>
                <dd className="font-semibold text-foreground">
                  {u.minSiparis ? `${miktarYaz(u.minSiparis)} ${u.birim}` : "Limit yok"}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Kategori</dt>
                <dd className="font-semibold text-foreground truncate">{u.kategori ?? "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Açıklama */}
          {u.aciklama && (
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <FileText className="size-3.5" />
                <span>Teknik Açıklama</span>
              </h2>
              <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                {u.aciklama}
              </p>
            </div>
          )}

          {/* Tedarikçi Kartı */}
          <section className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/20 p-4 shadow-2xs">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Yetkili Tedarikçi
                </span>
                <h2 className="text-sm font-bold text-foreground">{u.tedarikciBilgisi.unvan}</h2>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              {u.tedarikciBilgisi.adres && (
                <p className="flex items-start gap-1.5">
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground/70 mt-0.5" />
                  <span className="whitespace-pre-line">{u.tedarikciBilgisi.adres}</span>
                </p>
              )}
              {u.tedarikciBilgisi.telefon && (
                <p className="flex items-center gap-1.5 font-medium text-foreground">
                  <Phone className="size-3.5 shrink-0 text-muted-foreground/70" />
                  <span>{u.tedarikciBilgisi.telefon}</span>
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Aksiyon Butonları (Mobilde Alt Bar, Masaüstünde Sabit Blok) */}
      {altEylem && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 p-3.5 shadow-lg backdrop-blur-md md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          {altEylem}
        </div>
      )}
    </article>
  );
}

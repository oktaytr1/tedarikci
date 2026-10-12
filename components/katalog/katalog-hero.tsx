import { ArrowRight, Banknote, CalendarClock, MessageCircle, ShieldCheck } from "lucide-react";

export function KatalogHero() {
  return (
    <section className="flex flex-col gap-6">
      {/* Ana Değer Önerisi */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Tedarikçi Finansmanı Destekli B2B Toptan Katalog
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl leading-[1.15]">
            Marketlere vadeli mal tedariki,{" "}
            <span className="text-emerald-700 dark:text-emerald-500">üreticilere anında nakit.</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            Alıcılar anlaşmaya göre 30–180 gün vadeli mal alsın, üreticiler fatura bedelini
            teslimatta peşin tahsil etsin. Faktoring destekli toptan ürün kataloğu.
          </p>
        </div>

        {/* CTA Butonları */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <a
            href="https://wa.me/905012542020?text=Merhaba,%20tedarikcim.net.tr%20üzerinden%20vadeli%20mal%20alımı%20hakkında%20bilgi%20almak%20istiyorum."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <MessageCircle className="size-3.5" />
            <span>Vadeli Alım Talebi</span>
            <ArrowRight className="size-3.5" />
          </a>

          <a
            href="https://wa.me/905012542020?text=Merhaba,%20tedarikcim.net.tr%20üzerinden%20alacaklarımı%20peşine%20çevirme%20hakkında%20bilgi%20almak%20istiyorum."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Banknote className="size-3.5" />
            <span>Üreticiyim: Alacağımı Peşine Çevir</span>
          </a>
        </div>
      </div>

      {/* 4 Değer Kartı */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-card p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CalendarClock className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">Esnek Vade</span>
            <span className="text-[11px] text-muted-foreground leading-snug">Anlaşmaya göre 30–180 gün</span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-card p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
            <Banknote className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">Peşin Tahsilat</span>
            <span className="text-[11px] text-muted-foreground leading-snug">Üretici teslimatta nakit alır</span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-card p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            <ShieldCheck className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">Teyitli Fatura</span>
            <span className="text-[11px] text-muted-foreground leading-snug">Çift taraflı teslim onayı</span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-card p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <MessageCircle className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">Hızlı Teklif</span>
            <span className="text-[11px] text-muted-foreground leading-snug">WhatsApp ile 1 dakikada</span>
          </div>
        </div>
      </div>
    </section>
  );
}

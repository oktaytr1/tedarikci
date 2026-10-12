import { Banknote, CalendarClock, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";

export function NasilCalisir() {
  return (
    <section className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <HelpCircle className="size-3.5" />
            <span>İşin Mantığı</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Tedarikçi Finansmanı ve Vadeli Alım Nasıl Çalışır?
          </h2>
        </div>
        <p className="text-xs text-muted-foreground sm:max-w-xs">
          Alıcının vade ihtiyacı ile üreticinin nakit ihtiyacını aynı platformda buluşturan 3 adımlı model.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
        {/* Adım 1: Alıcı (Market) */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-background p-5 shadow-2xs">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 font-bold text-xs text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                1
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Alıcı (Market)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarClock className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-foreground text-sm">Vadeli Alım Talebi</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Market veya işletme ürününü seçer. Nakit akışını korumak için <strong>30, 60, 90 veya 180 gün vadeli</strong> alım talep eder. Kasadan peşin para çıkmaz.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Market nakdini korur</span>
            <ChevronRight className="size-3" />
          </div>
        </div>

        {/* Adım 2: Teslimat ve Onay */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-background p-5 shadow-2xs">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex size-7 items-center justify-center rounded-lg bg-teal-100 font-bold text-xs text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                2
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Mal Teslimatı & Teyit
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-foreground text-sm">Fatura & Kabul Onayı</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Fabrika ürünü sevk eder. Alıcı malı eksiksiz teslim aldığını ve vadeli faturayı platformda onaylar: <em>&ldquo;Malı teslim aldım, borcu teyit ediyorum.&rdquo;</em>
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
            <span>Teyitli alacak doğar</span>
            <ChevronRight className="size-3" />
          </div>
        </div>

        {/* Adım 3: Tedarikçi Peşin Nakit (Faktoring) */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-background p-5 shadow-2xs">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-100 font-bold text-xs text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">
                3
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Üretici (Fabrika)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Banknote className="size-5 text-cyan-600 dark:text-cyan-400" />
              <h3 className="font-bold text-foreground text-sm">Anında Peşin Nakit</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Faktoring & finansman altyapısı onaylı alacağı devralır. Fabrika 6 ay beklemez; <strong>fatura bedelini küçük iskonto ile bugün peşin tahsil eder</strong>. Vade gününde alıcı öder.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
            <span>Fabrika anında nakde kavuşur</span>
            <CheckCircle2 className="size-3.5" />
          </div>
        </div>
      </div>
    </section>
  );
}

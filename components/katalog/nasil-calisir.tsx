import { Banknote, CalendarClock, CheckCircle2 } from "lucide-react";

export function NasilCalisir() {
  return (
    <section className="rounded-xl border border-border/80 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Nasıl Çalışır?</h2>
        <span className="text-[11px] text-muted-foreground">3 adımda vadeli tedarik</span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {/* Adım 1 */}
        <div className="flex gap-3 p-5">
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
              1
            </span>
            <div className="hidden h-full w-px bg-border/60 sm:block" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-foreground">Vadeli Alım Talebi</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Market ürünü seçer, ticari anlaşmaya göre 30–180 gün vadeli alım talep eder.
            </p>
          </div>
        </div>

        {/* Adım 2 */}
        <div className="flex gap-3 p-5">
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
              2
            </span>
            <div className="hidden h-full w-px bg-border/60 sm:block" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-foreground">Teslimat &amp; Fatura Teyidi</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Fabrika sevk eder, alıcı malı ve faturayı teslim alarak onaylar.
            </p>
          </div>
        </div>

        {/* Adım 3 */}
        <div className="flex gap-3 p-5">
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
              3
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Banknote className="size-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-foreground">Üreticiye Peşin Nakit</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Faktoring altyapısı teyitli alacağı devralır, fabrika bedelini hemen tahsil eder.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

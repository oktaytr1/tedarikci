import { ArrowRight, Banknote, CalendarClock, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

export function KatalogHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 text-white shadow-xl">
      {/* Arka plan dekoratif desenleri */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_50%)]" />
      <div className="absolute -left-12 -top-12 size-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 md:p-10">
        {/* Üst Model Rozeti */}
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
          <Sparkles className="size-3.5 text-emerald-400" />
          <span>Tedarikçi Finansmanı & Vadeli Alacak Destekli B2B Katalog</span>
        </div>

        {/* Ana Başlık ve Net Değer Önerisi */}
        <div className="max-w-3xl space-y-3">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
            Alıcıya <span className="text-emerald-400">Anlaşmaya Göre Esnek Vade</span>, <br className="hidden sm:inline" />
            Üreticiye <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">Anında Peşin Nakit</span>
          </h1>
          <p className="text-sm text-zinc-300 sm:text-base leading-relaxed max-w-2xl">
            Marketler ticari anlaşmaya ve firma limitine göre 30 günden 180 güne varan esnek vadelerle mal alsın; fabrikalar vade beklemeden fatura bedelini teslimatta peşin tahsil etsin. Finansman ve faktoring destekli toptan ürün pazarı.
          </p>
        </div>

        {/* 2 Temel Kitle Çağrısı (WhatsApp Doğrudan Bağlantılı) */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href="https://wa.me/908503000000?text=Merhaba,%20tedarikcim.net.tr%20üzerinden%20anlaşmaya%20göre%20vadeli%20mal%20alımı%20hakkında%20bilgi%20almak%20istiyorum."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-xs font-bold text-zinc-950 shadow-md transition-all hover:bg-emerald-400 active:scale-95"
          >
            <CalendarClock className="size-4" />
            <span>Alıcıyım (Market): Vadeli Mal Almak İstiyorum</span>
            <ArrowRight className="size-3.5" />
          </a>

          <a
            href="https://wa.me/908503000000?text=Merhaba,%20tedarikcim.net.tr%20üzerinden%20fatura%20finansmanı%20ve%20alacaklarımı%20peşine%20çevirme%20hakkında%20bilgi%20almak%20istiyorum."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-xs font-bold text-white backdrop-blur-xs transition-all hover:bg-white/20 active:scale-95"
          >
            <Banknote className="size-4" />
            <span>Üreticiyim (Fabrika): Alacağımı Peşine Çevir</span>
          </a>
        </div>

        {/* 4 Öne Çıkan Değer Rozeti */}
        <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <CalendarClock className="size-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-white">Anlaşmaya Göre Vade</span>
              <span className="text-[11px] text-zinc-400">30 - 180 güne kadar esnek</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
              <Banknote className="size-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-white">Teslimatta Peşin Nakit</span>
              <span className="text-[11px] text-zinc-400">Üretici 6 ay beklemez</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              <ShieldCheck className="size-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-white">Teyitli Fatura Güvencesi</span>
              <span className="text-[11px] text-zinc-400">Çift taraflı teslim onayı</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <MessageCircle className="size-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-white">WhatsApp ile 1 Dk</span>
              <span className="text-[11px] text-zinc-400">Hızlı vadeli teklif alma</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

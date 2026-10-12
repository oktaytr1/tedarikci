import { Boxes, MessageCircle, ShieldCheck, Sparkles, Truck } from "lucide-react";

export function KatalogHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 text-white shadow-xl">
      {/* Arka plan dekoratif desenleri */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
      <div className="absolute -left-12 -top-12 size-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 md:p-10">
        {/* Üst Rozet */}
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
          <Sparkles className="size-3.5 text-emerald-400" />
          <span>Doğrudan Üretici & İmalatçı Toptan Fiyatları</span>
        </div>

        {/* Başlık ve Açıklama */}
        <div className="max-w-3xl space-y-3">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
            Türkiye&apos;nin Güvenilir <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Toptan B2B Tedarik Portalı
            </span>
          </h1>
          <p className="text-sm text-zinc-300 sm:text-base leading-relaxed max-w-2xl">
            Gıda, bakliyat, endüstriyel temizlik ve ambalaj ürünlerinde aracı komisyonu olmadan doğrudan üreticiden tedarik edin. Net koli fiyatları ve anında WhatsApp siparişi.
          </p>
        </div>

        {/* 4 Öne Çıkan Değer Rozeti */}
        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <MessageCircle className="size-4" />
            </div>
            <div className="flex flex-col text-xs leading-tight">
              <span className="font-semibold text-white">WhatsApp Siparişi</span>
              <span className="text-[11px] text-zinc-400">Tek tıkla üreticiye ulaşın</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
              <Boxes className="size-4" />
            </div>
            <div className="flex flex-col text-xs leading-tight">
              <span className="font-semibold text-white">Net Koli Fiyatları</span>
              <span className="text-[11px] text-zinc-400">KDV hariç şeffaf liste</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              <Truck className="size-4" />
            </div>
            <div className="flex flex-col text-xs leading-tight">
              <span className="font-semibold text-white">Ambar & Kargo</span>
              <span className="text-[11px] text-zinc-400">Tüm Türkiye toptan sevkiyat</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="size-4" />
            </div>
            <div className="flex flex-col text-xs leading-tight">
              <span className="font-semibold text-white">Onaylı İmalatçılar</span>
              <span className="text-[11px] text-zinc-400">Doğrulanmış B2B firmalar</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

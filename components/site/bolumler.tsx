// Kurumsal ana sayfa bölümleri. Sade, düz renkli tasarım: lacivert ana renk, koyu yeşil yalnız vurgu.

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  Coffee,
  Factory,
  Droplets,
  Package,
  Phone,
  Receipt,
  ShoppingBasket,
  Store,
  Sparkles,
  Tags,
  UtensilsCrossed,
  Wallet,
  Wheat,
  Wind,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { GORSELLER } from "@/lib/gorseller";
import { MESAJLAR, TELEFON_ADRESI, TELEFON_GORUNEN, whatsAppAdresi } from "@/lib/iletisim";

// ---------------------------------------------------------------------------
// Ortak parçalar
// ---------------------------------------------------------------------------

export function BolumBasligi({
  baslik,
  aciklama,
  koyu,
}: {
  baslik: React.ReactNode;
  aciklama?: string;
  koyu?: boolean;
}) {
  return (
    <div className="gorun flex max-w-2xl flex-col gap-3">
      <h2
        className={cn(
          "text-3xl font-semibold tracking-tight text-balance sm:text-[2.5rem] sm:leading-[1.15]",
          koyu ? "text-white" : "text-lacivert-950",
        )}
      >
        {baslik}
      </h2>
      {aciklama && (
        <p className={cn("text-lg leading-relaxed text-pretty", koyu ? "text-lacivert-300" : "text-lacivert-500")}>
          {aciklama}
        </p>
      )}
    </div>
  );
}

const birincilDugme =
  "inline-flex h-12 items-center justify-center gap-2 rounded-md bg-lacivert-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-lacivert-800";
const ikincilDugme =
  "inline-flex h-12 items-center justify-center gap-2 rounded-md border border-lacivert-200 bg-white px-6 text-sm font-semibold text-lacivert-900 transition-colors hover:border-lacivert-300 hover:bg-lacivert-50";

function Disari({ mesaj, className, children }: { mesaj: string; className: string; children: React.ReactNode }) {
  return (
    <a href={whatsAppAdresi(mesaj)} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------

export function Hero() {
  return (
    <section className="border-b border-lacivert-100 bg-lacivert-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-lacivert-950 text-balance sm:text-5xl">
            Marketlere vadeli mal tedariki, üreticilere anında nakit.
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-lacivert-500 text-pretty">
            Market ihtiyacı olan malı bugün alır, parasını anlaştığımız vadede öder. Üretici ise faturasının
            bedelini vadeyi beklemeden, teslimattan sonra alır.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Disari mesaj={MESAJLAR.alici} className={birincilDugme}>
              Teklif isteyin
              <ArrowRight className="size-4" />
            </Disari>
            <Disari mesaj={MESAJLAR.uretici} className={ikincilDugme}>
              Üretici başvurusu
            </Disari>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-lacivert-100">
          <Image
            src={GORSELLER.depo.src}
            alt={GORSELLER.depo.alt}
            fill
            priority
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
          />
          <dl className="absolute bottom-4 left-4 grid grid-cols-2 divide-x divide-lacivert-100 rounded-md bg-white/95 text-sm shadow-md">
            <div className="px-4 py-3">
              <dt className="text-xs text-lacivert-500">Market öder</dt>
              <dd className="mt-0.5 font-semibold text-lacivert-950">Vade sonunda</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-xs text-lacivert-500">Üretici alır</dt>
              <dd className="mt-0.5 font-semibold text-marka-700">Teslimattan sonra</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Kimler için
// ---------------------------------------------------------------------------

export function KimlerIcin() {
  const ogeler = [
    { ikon: Store, baslik: "Zincir marketler", alt: "Şubeleri için toplu alım yapanlar" },
    { ikon: ShoppingBasket, baslik: "Yerel marketler", alt: "Mahalle marketleri ve bakkallar" },
    { ikon: Factory, baslik: "Fabrikalar", alt: "Markete vadeli mal satan üreticiler" },
    { ikon: Tags, baslik: "Yeni markalar", alt: "Market rafına girmek isteyenler" },
  ];
  return (
    <div className="border-b border-lacivert-100 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <p className="pt-8 text-xs font-semibold uppercase tracking-wider text-lacivert-500">Kimlerle çalışıyoruz</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {ogeler.map((o) => (
            <div key={o.baslik} className="flex items-start gap-3 border-lacivert-100 py-6 sm:pr-6 lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
              <o.ikon className="mt-0.5 size-5 shrink-0 text-marka-700" strokeWidth={1.75} />
              <div>
                <p className="font-semibold text-lacivert-950">{o.baslik}</p>
                <p className="text-sm text-lacivert-500">{o.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Çözümler: alıcı / üretici
// ---------------------------------------------------------------------------

export function Cozumler() {
  const kartlar = [
    {
      baslik: "Marketler için",
      aciklama: "Malı şimdi alırsınız, ödemeyi ürün satıldıktan sonra yaparsınız.",
      maddeler: [
        "30 ile 180 gün arası vade",
        "Gıda, temizlik, kişisel bakım ve ambalaj ürünleri",
        "Malı teslim alıp onaylamadan ödeme süreci başlamaz",
        "Teklif ve sipariş için tek muhatap",
      ],
      cta: "Teklif isteyin",
      mesaj: MESAJLAR.alici,
      gorsel: GORSELLER.market,
    },
    {
      baslik: "Üreticiler için",
      aciklama: "Markete vadeli satarsınız ama paranızı vadeyi beklemeden alırsınız.",
      maddeler: [
        "Onaylanan faturanın bedeli teslimattan sonra hesabınızda",
        "Tahsilat riskini tek başınıza taşımazsınız",
        "Yeni marketlere satış imkânı",
        "Vade verdiğiniz için nakitsiz kalmazsınız",
      ],
      cta: "Başvurun",
      mesaj: MESAJLAR.uretici,
      gorsel: GORSELLER.uretim,
    },
  ];

  return (
    <section id="cozumler" className="mx-auto max-w-7xl px-4 py-24">
      <BolumBasligi
        baslik="Market de üretici de kazanır"
        aciklama="Market vadeyle alır, üretici beklemeden parasını alır. Aradaki finansmanı faktoring şirketi üstlenir."
      />

      <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {kartlar.map((k) => (
          <article key={k.baslik} className="gorun flex flex-col overflow-hidden rounded-lg border border-lacivert-200 bg-white">
            <div className="relative aspect-[16/7] bg-lacivert-100">
              <Image src={k.gorsel.src} alt={k.gorsel.alt} fill sizes="(min-width: 1024px) 620px, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col p-8 sm:p-10">
              <h3 className="text-2xl font-semibold tracking-tight text-lacivert-950">{k.baslik}</h3>
              <p className="mt-2 text-lacivert-500">{k.aciklama}</p>

              <ul className="mt-8 flex flex-1 flex-col divide-y divide-lacivert-100 border-y border-lacivert-100">
                {k.maddeler.map((m) => (
                  <li key={m} className="flex items-start gap-3 py-3.5 text-[15px] text-lacivert-800">
                    <Check className="mt-0.5 size-4 shrink-0 text-marka-600" strokeWidth={2.5} />
                    {m}
                  </li>
                ))}
              </ul>

              <Disari mesaj={k.mesaj} className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-lacivert-900 hover:text-marka-700">
                {k.cta}
                <ArrowRight className="size-4" />
              </Disari>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3b. Sevkiyat bandı (fotoğraflı)
// ---------------------------------------------------------------------------

export function SevkiyatBandi() {
  return (
    <section className="relative isolate overflow-hidden bg-lacivert-950 text-white">
      <Image src={GORSELLER.sevkiyat.src} alt="" fill sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-lacivert-950/95 via-lacivert-950/80 to-lacivert-950/40" />
      <div className="mx-auto max-w-7xl px-4 py-24 sm:py-32">
        <div className="gorun max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.75rem] sm:leading-[1.12]">
            Fabrikadan çıkan mal, doğrudan markete.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-lacivert-200">
            Sevkiyatı üretici yapar, market malı teslim alıp faturayı onaylar. Arada depo ya da ek aracı yoktur;
            her teslimatın kaydı tutulur.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Nasıl çalışır
// ---------------------------------------------------------------------------

export function NasilCalisirBolumu() {
  const adimlar = [
    { baslik: "Talep", aciklama: "Market ihtiyacını ve miktarını bize iletir, fiyat ve vade teklifini alır." },
    { baslik: "Anlaşma", aciklama: "Vade süresi ve teslim koşulları birlikte belirlenir." },
    { baslik: "Teslimat", aciklama: "Üretici malı gönderir, market teslim alıp faturayı onaylar." },
    { baslik: "Ödeme", aciklama: "Onaylı fatura faktoring şirketine devredilir ve üretici parasını alır. Market vade gelince öder." },
  ];
  return (
    <section id="nasil-calisir" className="border-y border-lacivert-100 bg-lacivert-50">
      <div className="mx-auto max-w-7xl px-4 py-24">
        <BolumBasligi
          baslik="Nasıl işliyor?"
          aciklama="Talepten ödemeye dört adım."
        />

        <ol className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-lacivert-200 bg-lacivert-200 md:grid-cols-2 lg:grid-cols-4">
          {adimlar.map((a, i) => (
            <li key={a.baslik} className="flex flex-col bg-white p-8">
              <span className="text-3xl font-semibold tabular-nums text-lacivert-200">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-6 text-lg font-semibold text-lacivert-950">{a.baslik}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-lacivert-500">{a.aciklama}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4b. Karşılaştırma
// ---------------------------------------------------------------------------

const KARSILASTIRMA = [
  { konu: "Üretici parasını ne zaman alır?", klasik: "Vade dolunca", biz: "Teslimattan sonra" },
  { konu: "Ne kadar vade verilebilir?", klasik: "Üreticinin nakdi ne kadar dayanırsa", biz: "30 ile 180 gün arası" },
  { konu: "Tahsilat riski kimde?", klasik: "Üreticide", biz: "Faktoring şirketiyle paylaşılır" },
  { konu: "Üreticinin nakdi", klasik: "Alacaklarda bekler", biz: "Üretime geri döner" },
];

export function Karsilastirma() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <BolumBasligi
        baslik="Klasik vadeli satıştan farkı"
      />

      <div className="gorun mt-14 overflow-x-auto rounded-lg border border-lacivert-200">
        <table className="w-full min-w-[36rem] text-left">
          <thead>
            <tr className="border-b border-lacivert-200 bg-lacivert-50 text-sm">
              <th className="w-1/3 px-6 py-4 font-medium text-lacivert-500"><span className="sr-only">Konu</span></th>
              <th className="w-1/3 px-6 py-4 font-semibold text-lacivert-500">Klasik vadeli satış</th>
              <th className="w-1/3 bg-lacivert-900 px-6 py-4 font-semibold text-white">tedarikcim ile</th>
            </tr>
          </thead>
          <tbody>
            {KARSILASTIRMA.map((r) => (
              <tr key={r.konu} className="border-b border-lacivert-100 last:border-b-0">
                <th scope="row" className="px-6 py-5 font-semibold text-lacivert-950">{r.konu}</th>
                <td className="px-6 py-5 text-lacivert-500">{r.klasik}</td>
                <td className="bg-marka-50/60 px-6 py-5 font-medium text-lacivert-950">
                  <span className="inline-flex items-start gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-marka-600" strokeWidth={2.5} />
                    {r.biz}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5. Vade seçenekleri
// ---------------------------------------------------------------------------

export function VadeBandi() {
  const vadeler = [30, 60, 90, 120, 180];
  return (
    <section className="bg-lacivert-900 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 lg:grid-cols-[1fr_1.2fr]">
        <BolumBasligi
          koyu
          baslik="Vade süresi"
          aciklama="Vadeyi ürünün rafta ne kadar hızlı satıldığına göre birlikte belirliyoruz. Hızlı satan ürünlerde kısa, sezonluk alımlarda daha uzun vade verilebilir."
        />
        <div className="gorun">
          <div className="grid grid-cols-5 overflow-hidden rounded-lg border border-white/15">
            {vadeler.map((v) => (
              <div key={v} className="border-l border-white/15 px-2 py-6 text-center first:border-l-0">
                <p className="text-3xl font-semibold tabular-nums sm:text-4xl">{v}</p>
                <p className="mt-1 text-sm text-lacivert-300">gün</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-lacivert-300">Örnek vade seçenekleri.</p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. Ürün grupları
// ---------------------------------------------------------------------------

const SEKTORLER: { ad: string; ikon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { ad: "Temel Gıda", ikon: UtensilsCrossed },
  { ad: "Yağ & Gıda", ikon: Droplets },
  { ad: "Bakliyat", ikon: Wheat },
  { ad: "İçecek & Çay", ikon: Coffee },
  { ad: "Temizlik", ikon: Wind },
  { ad: "Kişisel Bakım", ikon: Sparkles },
  { ad: "Ambalaj & Kâğıt", ikon: Package },
];

export function Kategoriler() {
  return (
    <section id="kategoriler" className="mx-auto max-w-7xl px-4 py-24">
      <BolumBasligi
        baslik="Ürün grupları"
        aciklama="Marketin her gün ihtiyaç duyduğu ürünler."
      />

      <ul className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-lacivert-200 bg-lacivert-200 sm:grid-cols-4">
        {SEKTORLER.map((s) => (
          <li key={s.ad} className="flex items-center gap-3 bg-white px-6 py-7">
            <s.ikon className="size-5 shrink-0 text-lacivert-500" strokeWidth={1.75} />
            <span className="font-medium text-lacivert-950">{s.ad}</span>
          </li>
        ))}
        <li className="bg-white">
          <Disari
            mesaj={MESAJLAR.alici}
            className="flex h-full items-center justify-between gap-3 px-6 py-7 font-semibold text-marka-700 hover:bg-marka-50"
          >
            Fiyat bilgisi al
            <ArrowRight className="size-4" />
          </Disari>
        </li>
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 7. Avantajlar
// ---------------------------------------------------------------------------

export function Avantajlar() {
  const ogeler = [
    { ikon: Wallet, baslik: "Para beklemez", aciklama: "Üretici vadeli sattığı malın parasını vade dolmadan alır." },
    { ikon: BadgeCheck, baslik: "Onaysız ödeme yok", aciklama: "Market malı ve faturayı onaylamadan ödeme süreci başlamaz." },
    { ikon: Receipt, baslik: "Açık teklif", aciklama: "Fiyat, KDV ve vade teklifte yazılı olarak belirtilir." },
    { ikon: Building2, baslik: "Faturalı ticaret", aciklama: "Her sevkiyat faturalıdır ve kaydı tutulur." },
  ];
  return (
    <section id="avantajlar" className="border-y border-lacivert-100 bg-lacivert-50">
      <div className="mx-auto max-w-7xl px-4 py-24">
        <BolumBasligi
          baslik="Neden tedarikcim?"
        />
        <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {ogeler.map((o) => (
            <div key={o.baslik} className="gorun border-t border-lacivert-200 pt-6">
              <o.ikon className="size-6 text-marka-700" strokeWidth={1.75} />
              <h3 className="mt-4 text-lg font-semibold text-lacivert-950">{o.baslik}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-lacivert-500">{o.aciklama}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 8. SSS
// ---------------------------------------------------------------------------

const SORULAR = [
  {
    s: "Vade süresi nasıl belirleniyor?",
    c: "Market ile yapılan anlaşmaya göre 30 ile 180 gün arasında belirlenir.",
  },
  {
    s: "Üretici ödemesini ne zaman alır?",
    c: "Market malı teslim alıp faturayı onayladıktan sonra fatura faktoring şirketine devredilir ve üretici bedelini alır.",
  },
  {
    s: "Nasıl teklif alırım?",
    c: "İhtiyacınız olan ürünleri ve miktarları WhatsApp’tan yazın. Fiyat, KDV ve vadeyi içeren teklifi size iletelim.",
  },
  {
    s: "Hangi ürün gruplarında tedarik sağlıyorsunuz?",
    c: "Temel gıda, yağ, bakliyat, içecek, temizlik, kişisel bakım ve ambalaj ürünleri.",
  },
  {
    s: "Üretici olarak nasıl çalışabilirim?",
    c: "WhatsApp’tan ya da telefonla bize ulaşın, ürünleriniz ve çalışma koşulları için görüşelim.",
  },
];

export function Sss() {
  return (
    <section id="sss" className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-24 lg:grid-cols-[1fr_1.5fr]">
      <div className="flex flex-col gap-6">
        <BolumBasligi
          baslik="Sık sorulan sorular"
          aciklama="Sorunuz burada yoksa bize yazın."
        />
        <Disari mesaj={MESAJLAR.genel} className={cn(ikincilDugme, "w-fit")}>
          WhatsApp’tan yazın
        </Disari>
      </div>

      <div className="border-t border-lacivert-200">
        {SORULAR.map((q) => (
          <details key={q.s} className="group border-b border-lacivert-200 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-medium text-lacivert-950">
              {q.s}
              <ChevronDown className="size-5 shrink-0 text-lacivert-300 transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-6 pr-10 leading-relaxed text-lacivert-500">{q.c}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 9. İletişim
// ---------------------------------------------------------------------------

export function IletisimBandi() {
  return (
    <section id="iletisim" className="bg-lacivert-900 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.5rem] sm:leading-[1.15]">
            Bize ulaşın
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-lacivert-300">
            Market ya da üretici olarak çalışmak isterseniz WhatsApp’tan yazın veya arayın.
          </p>
          <a href={TELEFON_ADRESI} className="mt-2 inline-flex w-fit items-center gap-2 text-lg font-semibold hover:text-lacivert-200">
            <Phone className="size-5" strokeWidth={1.75} />
            {TELEFON_GORUNEN}
          </a>
        </div>

        <div className="divide-y divide-white/15 rounded-lg border border-white/15">
          {[
            { baslik: "Market olarak", alt: "Vadeli alım için teklif isteyin", mesaj: MESAJLAR.alici },
            { baslik: "Üretici olarak", alt: "Çalışma koşullarını konuşalım", mesaj: MESAJLAR.uretici },
          ].map((b) => (
            <Disari key={b.baslik} mesaj={b.mesaj} className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-white/5">
              <span className="flex-1">
                <span className="block font-semibold">{b.baslik}</span>
                <span className="block text-sm text-lacivert-300">{b.alt}</span>
              </span>
              <ArrowRight className="size-5 text-lacivert-300" />
            </Disari>
          ))}
        </div>
      </div>
    </section>
  );
}

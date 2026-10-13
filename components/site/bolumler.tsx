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
  ust,
  baslik,
  aciklama,
  koyu,
}: {
  ust: string;
  baslik: React.ReactNode;
  aciklama?: string;
  koyu?: boolean;
}) {
  return (
    <div className="gorun flex max-w-2xl flex-col gap-3">
      <span className={cn("text-sm font-semibold", koyu ? "text-lacivert-300" : "text-marka-700")}>{ust}</span>
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
          <p className="text-sm font-semibold text-marka-700">Faktoring destekli B2B toptan tedarik</p>

          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-lacivert-950 text-balance sm:text-5xl">
            Marketlere vadeli mal tedariki, <span className="text-lacivert-500">üreticilere anında nakit.</span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-lacivert-500 text-pretty">
            Alıcılar anlaşmaya göre 30–180 gün vadeli mal alır, üreticiler fatura bedelini teslimatta peşin tahsil
            eder. Ticaretin iki tarafını tek bir süreçte buluşturuyoruz.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Disari mesaj={MESAJLAR.alici} className={birincilDugme}>
              Vadeli alım talebi
              <ArrowRight className="size-4" />
            </Disari>
            <Disari mesaj={MESAJLAR.uretici} className={ikincilDugme}>
              Üreticiyim, alacağımı peşine çevir
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
              <dt className="text-xs text-lacivert-500">Alıcı öder</dt>
              <dd className="mt-0.5 font-semibold text-lacivert-950">Vade sonunda</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-xs text-lacivert-500">Üretici tahsil eder</dt>
              <dd className="mt-0.5 font-semibold text-marka-700">Teslimatta</dd>
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
    { ikon: Store, baslik: "Zincir marketler", alt: "Çok şubeli alımlarda vadeli tedarik" },
    { ikon: ShoppingBasket, baslik: "Yerel marketler", alt: "Mahalle marketleri için düzenli tedarik" },
    { ikon: Factory, baslik: "Fabrikalar", alt: "Vadeli satışını nakde çevirmek isteyenler" },
    { ikon: Tags, baslik: "Üretici markalar", alt: "Yeni market kanallarına ulaşmak isteyenler" },
  ];
  return (
    <div className="border-b border-lacivert-100 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <p className="pt-8 text-xs font-semibold uppercase tracking-wider text-lacivert-500">Kimler için</p>
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
      etiket: "Alıcılar için",
      baslik: "Marketler ve perakendeciler",
      aciklama: "Rafınızı doldurun, ödemeyi satış döngünüze göre planlayın.",
      maddeler: [
        "Ticari anlaşmaya göre 30–180 gün vadeli alım",
        "Temel ürün gruplarında toptan tedarik",
        "Teslimat ve fatura teyidiyle güvenli süreç",
        "Tek noktadan teklif ve sipariş iletişimi",
      ],
      cta: "Vadeli alım talebi oluştur",
      mesaj: MESAJLAR.alici,
      gorsel: GORSELLER.market,
    },
    {
      etiket: "Üreticiler için",
      baslik: "Fabrikalar ve tedarikçiler",
      aciklama: "Vadeli satış yapın, nakit akışınızı bekletmeyin.",
      maddeler: [
        "Teyitli fatura bedelini teslimatta peşin tahsil edin",
        "Alacak riskini faktoring altyapısıyla paylaşın",
        "Ürünlerinizi yeni alıcılarla buluşturun",
        "Vade yükü olmadan büyüme imkânı",
      ],
      cta: "Alacağımı peşine çevir",
      mesaj: MESAJLAR.uretici,
      gorsel: GORSELLER.uretim,
    },
  ];

  return (
    <section id="cozumler" className="mx-auto max-w-7xl px-4 py-24">
      <BolumBasligi
        ust="Çözümler"
        baslik="Ticaretin iki tarafı için tek süreç"
        aciklama="Alıcı vadesini, üretici nakdini alır. Teyitli teslimat ve fatura süreci iki tarafın da güvencesidir."
      />

      <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {kartlar.map((k) => (
          <article key={k.etiket} className="gorun flex flex-col overflow-hidden rounded-lg border border-lacivert-200 bg-white">
            <div className="relative aspect-[16/7] bg-lacivert-100">
              <Image src={k.gorsel.src} alt={k.gorsel.alt} fill sizes="(min-width: 1024px) 620px, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col p-8 sm:p-10">
              <p className="text-sm font-semibold text-marka-700">{k.etiket}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-lacivert-950">{k.baslik}</h3>
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
          <p className="text-sm font-semibold text-lacivert-300">Üretimden rafa</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-[2.75rem] sm:leading-[1.12]">
            Malınız yolda, ödemeniz güvencede.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-lacivert-200">
            Ürünler üreticiden marketinize sevk edilir, her teslimat ve fatura kayıt altına alınır. Siz satışınıza,
            biz sürecin geri kalanına odaklanırız.
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
    { baslik: "İhtiyacın iletilmesi", aciklama: "Market ihtiyaç duyduğu ürünleri ve miktarları bize iletir, teklifini alır." },
    { baslik: "Vadeli alım anlaşması", aciklama: "Ticari anlaşmaya göre 30–180 gün arası vade belirlenir." },
    { baslik: "Teslimat ve fatura teyidi", aciklama: "Üretici sevk eder; alıcı malı ve faturayı teslim alarak onaylar." },
    { baslik: "Üreticiye peşin ödeme", aciklama: "Faktoring altyapısı teyitli alacağı devralır, üretici bedeli hemen tahsil eder." },
  ];
  return (
    <section id="nasil-calisir" className="border-y border-lacivert-100 bg-lacivert-50">
      <div className="mx-auto max-w-7xl px-4 py-24">
        <BolumBasligi
          ust="Süreç"
          baslik="Dört adımda vadeli tedarik"
          aciklama="Talepten üreticinin tahsilatına kadar her adım teyitli ve izlenebilir ilerler."
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
  { konu: "Üreticinin tahsilatı", klasik: "Vade sonunu bekler", biz: "Teslimatta peşin" },
  { konu: "Verilebilen vade", klasik: "Üreticinin nakit gücüyle sınırlı", biz: "Anlaşmaya göre 30–180 gün" },
  { konu: "Tahsilat riski", klasik: "Tamamen üreticide", biz: "Faktoring altyapısıyla paylaşılır" },
  { konu: "İşletme sermayesi", klasik: "Alacaklarda bağlı kalır", biz: "Üretim ve büyümeye ayrılır" },
  { konu: "Teslimat kaydı", klasik: "Taraflar arasında dağınık", biz: "Teslimat ve fatura teyidiyle kayıt altında" },
];

export function Karsilastirma() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <BolumBasligi
        ust="Fark"
        baslik="Klasik vadeli satış ile farkımız"
        aciklama="Aynı ticaret, iki taraf için daha dengeli bir ödeme düzeni."
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
          ust="Vade seçenekleri"
          baslik="Nakit akışınıza uyan vade"
          aciklama="Vadeyi marketin stok devir hızına ve satış döngüsüne göre birlikte belirliyoruz. Hızlı dönen ürünlerde kısa, mevsimsel alımlarda daha uzun vade mümkündür."
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
          <p className="mt-3 text-sm text-lacivert-300">Gösterilen süreler örnek vade seçenekleridir.</p>
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
        ust="Ürün grupları"
        baslik="Hizmet verdiğimiz ürün grupları"
        aciklama="Marketlerin raflarındaki temel ürün gruplarında toptan tedarik."
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
    { ikon: Wallet, baslik: "Güçlü nakit akışı", aciklama: "Üretici vadeli satışın bedelini beklemeden tahsil eder; işletme sermayesi serbest kalır." },
    { ikon: BadgeCheck, baslik: "Teyitli işlem", aciklama: "Teslimat ve fatura alıcı tarafından onaylanmadan ödeme süreci başlamaz." },
    { ikon: Receipt, baslik: "Şeffaf teklif", aciklama: "Fiyat, KDV ve vade koşulları teklif aşamasında açıkça paylaşılır." },
    { ikon: Building2, baslik: "Kurumsal tedarik", aciklama: "Üretici ile alıcı arasında düzenli, faturalı ve izlenebilir B2B tedarik." },
  ];
  return (
    <section id="avantajlar" className="border-y border-lacivert-100 bg-lacivert-50">
      <div className="mx-auto max-w-7xl px-4 py-24">
        <BolumBasligi
          ust="Neden tedarikcim"
          baslik="Vadeli ticareti iki taraf için de kolaylaştırıyoruz"
          aciklama="Finansman, tedarik ve iletişimi tek bir akışta birleştiren yalın bir model."
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
    c: "Vade süresi, alıcı ile yapılan ticari anlaşmaya göre 30 ile 180 gün arasında belirlenir.",
  },
  {
    s: "Üretici ödemesini ne zaman alır?",
    c: "Teslimat ve fatura alıcı tarafından teyit edildikten sonra, faktoring altyapısı teyitli alacağı devralır ve üretici fatura bedelini peşin tahsil eder.",
  },
  {
    s: "Nasıl teklif alırım?",
    c: "İhtiyaç duyduğunuz ürünleri ve miktarları WhatsApp üzerinden iletin. Ekibimiz fiyat, KDV ve vade koşullarını içeren teklifi sizinle paylaşır.",
  },
  {
    s: "Hangi ürün gruplarında tedarik sağlıyorsunuz?",
    c: "Temel gıda, yağ, bakliyat, içecek, temizlik, kişisel bakım ve ambalaj gibi marketlerin temel ürün gruplarında tedarik sağlıyoruz.",
  },
  {
    s: "Üretici olarak nasıl katılabilirim?",
    c: "İletişim bölümündeki “Üretici başvurusu” bağlantısıyla bize ulaşın; ürünleriniz ve tahsilat süreciniz için sizinle görüşelim.",
  },
];

export function Sss() {
  return (
    <section id="sss" className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-24 lg:grid-cols-[1fr_1.5fr]">
      <div className="flex flex-col gap-6">
        <BolumBasligi
          ust="Sıkça sorulan sorular"
          baslik="Merak edilenler"
          aciklama="Aradığınız yanıtı bulamadıysanız bize doğrudan yazabilirsiniz."
        />
        <Disari mesaj={MESAJLAR.genel} className={cn(ikincilDugme, "w-fit")}>
          Soru sorun
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
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4">
          <span className="text-sm font-semibold text-lacivert-300">İletişim</span>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.5rem] sm:leading-[1.15]">
            Vadeli tedarik ya da peşin tahsilat için görüşelim
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-lacivert-300">
            Alıcı ya da üretici olarak başvurunuzu iletin, size uygun koşulları birlikte belirleyelim.
          </p>
          <a href={TELEFON_ADRESI} className="mt-2 inline-flex w-fit items-center gap-2 text-lg font-semibold hover:text-lacivert-200">
            <Phone className="size-5" strokeWidth={1.75} />
            {TELEFON_GORUNEN}
          </a>
        </div>

        <div className="divide-y divide-white/15 rounded-lg border border-white/15">
          {[
            { baslik: "Alıcı başvurusu", alt: "Vadeli mal alımı için", mesaj: MESAJLAR.alici },
            { baslik: "Üretici başvurusu", alt: "Alacağınızı peşine çevirin", mesaj: MESAJLAR.uretici },
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

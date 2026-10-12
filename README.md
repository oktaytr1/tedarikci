# Tedarikçi Pazarlama Platformu

İlk sürüm **kapalı bir B2B katalog**: yetkili firmalar giriş yapıp tedarikçileri ve ürünleri
fiyatlarıyla görür. Giriş yapmadan hiçbir ürün, fiyat ya da firma bilgisi görünmez; site arama
motorlarına kapalıdır. Sipariş, fatura, ödeme ve alıcı onayı bu sürümde yok: tabloları, kuralları
ve servisleri yazılı ve testli olarak duruyor, ekranları `operasyon-ekranlar` dalında.

Neden-öyle soruları için **mimari doküman** (`… — Mimari Dokümanı.md`), yapılacaklar için **task1.md**.

## Yerel kurulum

Gerekenler: Node 24+, Docker Desktop.

```bash
cp .env.example .env               # AUTH_SECRET için: openssl rand -base64 32
docker compose up -d db            # PostgreSQL 16 (+ tedarikci_test veritabanı)
npm install                        # postinstall: prisma generate
npm run db:deploy                  # migration'ları uygular
npm run admin:olustur -- sen@firma.com   # ilk admin (parola terminalden sorulur)
npm run db:ornek                   # (isteğe bağlı) geliştirme örnek verisi; parola .env'e yazılır
npm run dev                        # http://localhost:3000
```

Kontroller:

```bash
npm run lint && npm run typecheck && npm test
```

Üretim imajını yerelde denemek: `docker compose --profile app up --build`
(imaj açılışta `prisma migrate deploy` çalıştırır, sonra `next start`).

## Kurallar ve nerede zorlandıkları

| Kural | Uygulama | Veritabanı |
| --- | --- | --- |
| Para `numeric(18,2)`, float yok | `lib/money.ts` (decimal.js, string ile taşıma); ESLint `parseFloat`/`toFixed`/`Math.round` yasağı | `Decimal(18,2)` kolonlar |
| Para/KDV hesabı tek modülde, KDV satır bazında | `lib/money.ts` → `satirHesapla`, `siparisToplamlari`; dışarıda aritmetik ESLint ile yasak | `genel_toplam = ara_toplam + kdv_toplam` CHECK |
| Hiçbir kayıt silinmez | Kapsamlı istemcide `delete` yok; ham istemcide extension; ESLint | Her tabloda `BEFORE DELETE` tetikleyicisi |
| `fatura_no` + `satici_firma_id` tekil | — | Tekil indeks |
| Tedarikçi yalnız kendi ürünlerini görür | `lib/scope.ts` → her sorguya zorunlu filtre + ilişki beyaz listesi | Satır/ürün/firma tipi tutarlılık tetikleyicileri |
| Alıcı yalnız aktif kataloğu görür | Aktif tedarikçinin aktif ürünleri; tedarikçinin yalnız vitrin alanları (ünvan, adres, telefon — vergi no gizli: alan beyaz listesi); operasyon tabloları, denetim kaydı ve yazma kapalı | Alıcı kullanıcısı alıcı tipi firmaya bağlı (tetikleyici) |
| Admin firmasız, tedarikçi/alıcı firmaya bağlı | — | `kullanici_firma_rol_uyumu` CHECK |
| Ürün fotoğrafı dış link | Yükleme yok; `Referrer-Policy: no-referrer` | Yalnız `https://`, boşluksuz, ≤ 2000 karakter (CHECK) |
| Kritik işlemler denetlenir | Tüm yazmalar `denetimli()` içinde; eski/yeni fark aynı transaction'da `denetim_kaydi`na | `denetim_kaydi` değiştirilemez/silinemez |
| Onay kaydı değişmez, admin alıcı adına onaylayamaz | Kapsamlı istemci yalnız bağlantı kaydı oluşturmaya izin verir | Kullanılmış onayda UPDATE tetikleyiciyle reddedilir |
| Girişsiz veri yok | Üç rol parolayla girer (Auth.js). `proxy.ts`: oturumsuz her istek → `/giris`, rol alanları (`/admin`, `/tedarikci`, `/katalog`) yalnız kendi rolüne; sayfalar ayrıca `rolGerekli()` ile, sorgular `lib/scope.ts` ile denetlenir | — |
| Arama motorlarına kapalı | `app/robots.ts` (`Disallow: /`), `noindex` meta, her yanıtta `X-Robots-Tag` | — |

### Veritabanına erişim

```ts
import { kapsamliDb, denetimli } from "@/lib/scope";

const vt = await kapsamliDb();              // okuma — rol/firma filtresi otomatik
const siparisler = await vt.siparis.findMany();

await denetimli("siparis.iptal", (vt) =>   // yazma — tek transaction + denetim kaydı
  vt.siparis.update({ where: { id }, data: { iptal_mi: true, iptal_nedeni, iptal_zamani: new Date() } }),
);
```

`@/lib/db` (ham, kapsamsız istemci) uygulama kodundan import edilemez (ESLint).

### Sayfa yazma kuralı: rol kontrolü her sayfada

Rol kontrolü düzende (layout) değil, **her sayfanın kendisinde** yapılır:

```tsx
export default function Sayfa() {
  return <Suspense fallback={null}><Icerik /></Suspense>;
}
async function Icerik() {
  await rolGerekli("alici");   // önce kontrol, sonra içerik
  …
}
```

Next 16 düzeni ve sayfayı ayrı render eder (Partial Prerender); düzendeki kontrol, sayfanın önceden
render edilen kısmının başka role gönderilmesini durdurmaz. Proxy'deki rol alanı kontrolü iyimserdir
(JWT'deki giriş anı rolü); bayat oturumu sayfa kontrolü yakalar ve girişe gönderir.

### `prisma migrate reset` ve silme tetikleyicisi

Tetikleyici yalnız `DELETE` ifadesinde çalışır. `migrate reset` şemayı `DROP SCHEMA` ile düşürür,
testler `TRUNCATE` ile temizler; ikisi de satır tetikleyicisini çalıştırmaz. Bu yüzden tetikleyici
geliştirmede de açıktır, ayrı bir "geliştirme modu" yoktur.

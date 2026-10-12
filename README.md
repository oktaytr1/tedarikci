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

## Yayına alma

Uygulama tek bir Docker imajıdır (`Dockerfile`): açılışta bekleyen migration'ları uygular
(`prisma migrate deploy`), sonra `next start` ile 3000 portunda çalışır. Yanında PostgreSQL 16
gerekir. Başka bileşen (kuyruk, Redis, dosya deposu) yoktur.

### 1. Ortam değişkenleri

Şablon ve açıklamalar: `.env.example`. Üretimde barındırma panelinin ortam değişkenleri bölümüne yazılır.

| Değişken | Zorunlu | Ne | Nasıl üretilir |
| --- | --- | --- | --- |
| `DATABASE_URL` | Evet | Üretim PostgreSQL bağlantısı | Barındırmanın verdiği bağlantı; ayrı kullanıcı + güçlü parola, uzaksa `sslmode=require` |
| `AUTH_SECRET` | Evet | Oturum (JWT) imza anahtarı | `openssl rand -base64 32` — geliştirmedekinden **farklı** |
| `AUTH_URL` | Evet | Dış adres, ör. `https://katalog.ornek.com` | Alan adı belli olunca |
| `AUTH_TRUST_HOST` | Kendi sunucuda | Ters vekil arkasında Host başlığına güven | `true` (Vercel'de gerekmez) |
| `PLATFORM_ILETISIM_EPOSTA` | Önerilir | Tedarikçi ekranındaki düzeltme iletişimi | Gerçek destek adresi |
| `PLATFORM_ILETISIM_TELEFON` | Hayır | Aynı, telefon; boşsa gösterilmez | — |
| `DIRECT_DATABASE_URL` | Havuz varsa | Migration'lar için doğrudan bağlantı | Havuzlu (pooler) bağlantı kullanılıyorsa |

Üretime **konmayanlar**: `TEST_DATABASE_URL`, `ORNEK_ADMIN_PAROLA` (örnek veri betiği üretimde çalışmayı reddeder).

### 2. Veritabanı

- PostgreSQL **16**. Migration `unaccent` eklentisini kurar (`CREATE EXTENSION`): kullanıcının
  eklenti kurma yetkisi olmalı (kendi Postgres'te var; yönetilen hizmetlerde `unaccent` genelde izinli).
- Saat dilimi: imaj `TZ=Europe/Istanbul` ile çalışır; zaman damgaları `timestamptz` olarak saklanır.

### 3. İlk yayın

```bash
# İmajı derle (barındırma Dockerfile'dan kendisi de derleyebilir)
docker build -t tedarikci-pazarlama .

# Çalıştır: açılışta migration'lar uygulanır
docker run -d --name tedarikci -p 3000:3000 --env-file .env.uretim tedarikci-pazarlama

# İlk admin (parola terminalden gizli sorulur; kayıt formu yoktur)
docker exec -it tedarikci npx tsx scripts/admin-olustur.ts admin@firma.com
```

Sonra admin panelinden firmalar, kullanıcılar ve ürünler açılır. `npm run db:ornek` üretimde **çalıştırılmaz**.

### 4. Günlük yedek (sunucu dışında) ve geri yükleme provası

Para ve fiyat kaydı tutan sistem yedeksiz çalıştırılmaz; yedek sunucunun **dışında** durmalı.

```bash
# Sunucuda crontab -e — her gece 03:00 (sunucu saatiyle)
0 3 * * * YEDEK_DATABASE_URL="postgresql://…" YEDEK_RCLONE_HEDEF="b2:tedarikci-yedek" /opt/tedarikci/scripts/yedek-al.sh >> /var/log/tedarikci-yedek.log 2>&1
```

- `scripts/yedek-al.sh`: `pg_dump` (özel biçim) + arşivin okunabildiği denetimi + `rclone` ile sunucu
  dışına kopya (Backblaze B2, S3, Google Drive…; `rclone config` ile bir kez tanımlanır) + yerelde 14 gün saklama.
- **Geri yükleme provası** (yayından önce en az bir kez, sonra düzenli aralıklarla):

```bash
PROVA_SUNUCU_URL="postgresql://…/postgres" KAYNAK_DATABASE_URL="postgresql://…/uretim_db" \
  ./scripts/geri-yukleme-provasi.sh /var/backups/tedarikci/tedarikci-<tarih>.dump
```

  Yedeği geçici bir veritabanına yükler, tüm tabloları (kayıt sayısı + içerik özeti), tetikleyicileri ve
  CHECK kısıtlarını kaynakla karşılaştırır, silme engelinin çalıştığını doğrular, geçici veritabanını kaldırır.

### 5. Yayın sonrası kontrol

- `https://…/robots.txt` → `Disallow: /`; sayfa başlıklarında `X-Robots-Tag: noindex`.
- Oturumsuz `https://…/katalog` → giriş sayfasına yönlenir.
- Alıcı, tedarikçi ve admin hesaplarıyla birer kez giriş; katalogda aksansız arama ("pecete").
- Yedek betiğinin ilk gece çalıştığı ve dosyanın sunucu dışına ulaştığı.

### Güncelleme

Yeni sürüm: imajı yeniden derleyip konteyneri değiştirmek yeterli; migration'lar açılışta uygulanır.
Migration'lar yalnız ileriye doğrudur; üretimde `prisma migrate reset` **asla** çalıştırılmaz.

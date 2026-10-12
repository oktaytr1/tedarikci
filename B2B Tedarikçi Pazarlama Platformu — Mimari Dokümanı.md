# B2B Tedarikçi Pazarlama Platformu — Mimari Dokümanı

Oct 12, 2026 · @makro

## Kapsam

Platform aracıdır: mal ve fatura doğrudan tedarikçiden alıcıya gider, para platformun üzerinden geçmez. Platformun kaydı tuttuğu ilişki tedarikçi ile alıcı arasındaki tek faturadır; platformun geliri ayrıca kesilen komisyon faturasıdır.

Siparişleri yalnızca admin girer. Sipariş dış kanallardan (telefon, WhatsApp) gelir, sisteme platform işler. Alıcının tek işlemi, kendisine gönderilen imzalı bağlantıyla teslimi ve borcu onaylamaktır; bunun için panele girmesi gerekmez.

Kayıt formu yoktur; firmaları, kullanıcıları ve ürünleri admin açar. Fiyat listesi yönetimi, kampanya, raporlar, e-fatura gönderimi ve faktoring bu sürümde yoktur. Amaç, gerçek iki firma arasındaki ilk siparişin baştan sona sistemden geçmesidir.

## Ekranlar

Tek uygulama, role göre üç ekran seti. Panel sayısı değil, ekran seti sayısı: ortak yetki sistemi ve ortak veri, farklı görünümler.

1. **Admin paneli (geniş).** Sipariş girişi, tüm siparişler tek tabloda, durum değiştirme, fatura no ve tutar, ödeme bildirimi, firma ve ürün yönetimi. Sistemin merkezi burasıdır; hızlı giriş ve hızlı arama doğrudan operasyon maliyetidir.
2. **Tedarikçi ekranı (dar).** Kendi siparişlerinin listesi ve üç işlem: onaylıyorum, sevk ettim, fatura no ve tutar. Aynı sipariş listesinin filtreli görünümüdür.
3. **Alıcı onay sayfası (tek sayfa).** Üyelik ve parola yok. Tek kullanımlık bağlantıdan açılan sayfada sipariş kalemleri ve tutar görünür, tek tıkla teslim ve borç onaylanır.

## Sipariş durumları

Tek yönlü beş durum. Dördüncü adım tek önemli adımdır: alıcının onayı, platformun değil alıcının kaydıdır ve ileride finansmanın tek dayanağı olacaktır.

1. Girildi — admin siparişi sisteme işledi
2. Tedarikçi onayladı
3. Sevk edildi — fatura no ve tutar kaydedildi
4. Alıcı onayladı — bağlantıdan imzalandı; zaman ve kayıt saklanır
5. Ödendi — tedarikçiye yapılan ödeme bildirildi, sipariş kapandı

İptal ayrı bir işarettir: kayıt silinmez, iptal edildi olarak kalır.

## Veri temeli

Ekran sayısı azalabilir, bu kurallar azalamaz. Sonradan düzeltmeleri tüm sipariş geçmişini elden geçirmek demektir.

- **Tek fatura zinciri.** Fatura tedarikçiden alıcıya kesilir; sistemde bir siparişin bir fatura kaydı olur. Platform komisyonu bu faturanın parçası değildir, sipariş üzerinde ayrı alanlarda (oran, tutar) durur.
- **Ödeme kaydı bir bildirimdir, tahsilat değil.** Para platformdan geçmediği için `odeme` kaydı "alıcı tedarikçiye şu tarihte şu tutarı ödedi" bilgisini tutar. Kimin kime ödediği alanda açıkça yazılır.
- **Onay kaydı silinemez.** Alıcının imzalı bağlantıdan verdiği onay; bağlantı kimliği, zaman damgası ve onaylanan tutar ayrı tabloda saklanır. Admin bu kaydı alıcı adına oluşturamaz.
- **Onay bağlantısının kuralları.** Tahmin edilemez uzun anahtar, tek kullanım, süre sınırı (7 gün). Onay anında sipariş kalemleri ve tutar onay kaydının içine kopyalanır: sipariş sonradan değişse de alıcının neyi onayladığı sabit kalır.
- **Fiyat siparişe kopyalanır.** Ürün fiyatı değişince geçmiş siparişlerin tutarı değişmemeli; fiyat `siparis_satir` içinde durur.
- **Vade tarihi ve ödeme alanları baştan olmalı.** Ekranı olmasa bile alan bulunsun: vade tarihi, ödendi mi, ödeme tarihi. Vadeli satışın gelecek modülleri buna bağlanacak.
- **Para `numeric(18,2)`, silme yok.** Ondalıklı sayı (float) kullanılmaz. Sipariş, fatura ve ödeme kaydı silinmez, iptal işaretlenir.
- **KDV satır bazında tutulur.** Her satırda KDV oranı ve tutarı ayrı; fatura toplamı satırlardan hesaplanır. Yuvarlama tek bir modülde yapılır.
- **Günlük otomatik yedek.** Para ve borç kaydı tutan bir sistem yedeksiz çalıştırılmaz; geri yükleme en az bir kez denenir.

Başlangıç tabloları: `firma`, `kullanici`, `urun`, `siparis`, `siparis_satir`, `odeme`, `onay`. Yedi tablo yeterli.

## Teknoloji

Tek Next.js uygulaması, kendi sunucusunda Node süreci olarak, yanında PostgreSQL. Başka hiçbir bileşen yok.

| Katman | Seçim | Not |
| --- | --- | --- |
| Uygulama | Next.js (TypeScript) | Hem arayüz hem API tek projede |
| Çalışma | Docker içinde `next start`, kendi sunucuda | Serverless'ta transaction ve uzun işlem kırılgan olur |
| Veritabanı | PostgreSQL | Para ve sipariş tutarlılığı için transaction ve kısıt şart |
| ORM | Prisma veya Drizzle | Şema değişiklikleri migration ile |
| Arayüz | Sunucu taraflı render + shadcn/ui + TanStack Table | Tablo ve form ağırlıklı; ayrı SPA gereksiz |
| Kimlik | Auth.js veya Better Auth | Admin ve tedarikçi parolayla girer; alıcı imzalı bağlantıyla onaylar |

## Sistem bileşenleri

&#91;embedded content: sistem mimarisi · 3 ekran seti, 1 uygulama, 1 veritabanı\]

Üç ekran seti de aynı Next.js uygulamasından gelir, uygulama tek bir PostgreSQL veritabanına yazar. Ayrı panel uygulaması, ayrı yetki sistemi yok; alıcı tarafı uygulamanın parolasız bir sayfasıdır. Kuyruk, worker ve dış servis de yok: e-posta bildirimi ilk sürümde doğrudan gönderilir.

## Sonraya bırakılanlar

Aşağıdakiler ilk sürümün dışındadır ve ancak gerçek firmalarla sipariş akmaya başladıktan sonra ele alınır.

- Cari hesap defteri, alıcı limiti, gecikme takibi
- Müşteriye özel fiyat listeleri, kampanyalar, raporlar
- Alıcının kendi sipariş girişi — ancak taraflar sistemi benimsedikten sonra
- E-fatura entegrasyonu; ilk sürümde fatura no ve tutar elle girilir
- Ödemeyi platform üzerinden toplamak. Üçüncü kişiler adına para tahsil etmek ödeme hizmeti kapsamına girer ve izne tabidir; aracı kaldığımız sürece para taraflar arasında kalır.
- Faktoring / tedarikçi finansmanı. Lisanslı bir finans kuruluşuyla anlaşma gerektirir; platform kendi başına alacak satın alıp peşin ödeme yapamaz. Üzerinde gerçek sipariş akan bir sistem olmadan o anlaşma da alınmaz.

# B2B Tedarikçi Pazarlama Platformu — Mimari Dokümanı

Oct 12, 2026 · @makro

## Kapsam

İlk sürüm kapalı bir B2B katalogdur: yetkilendirilmiş firmalar giriş yapar, tedarikçileri ve ürünleri fiyatlarıyla görür. Sipariş, fatura, borç ve onay akışı bu sürümde yoktur; ticaret telefon ve WhatsApp üzerinden dönmeye devam eder.

Giriş yapmadan hiçbir ürün ve fiyat görünmez. Toptan fiyat ve katalog detayı rakibe açık olmamalıdır; site arama motorlarına kapalıdır.

Kayıt formu yoktur. Firmaları, kullanıcıları ve ürünleri admin açar. Her kullanıcı bir firmaya bağlıdır ve üç rolden birini taşır: admin, tedarikçi, alıcı.

## Ekranlar

Tek uygulama, role göre üç ekran seti. Ortak yetki sistemi ve ortak veri, farklı görünümler.

1. **Admin paneli.** Firma ekleme ve düzenleme, kullanıcı açma, ürün ekleme ve düzenleme (tedarikçi bazlı), ürünü pasife alma. Katalogdaki her şeyin kaynağı burasıdır.
2. **Katalog (alıcı).** Tedarikçi listesi ve ürün listesi: arama, tedarikçiye ve kategoriye göre filtre, ürün detay sayfası. Salt okunur; sepet ve sipariş yok.
3. **Tedarikçi ekranı.** Kendi ürünlerinin listesi, salt okunur. Düzeltme talebi admin'e iletilir; ilk sürümde tedarikçi ürün girmez.

## Veri temeli

Ekran sayısı azalabilir, bu kurallar azalamaz.

- **Giriş olmadan veri yok.** Ürün, fiyat ve firma bilgisi yalnız oturum açmış kullanıcıya döner. Kontrol sunucu tarafında; arama motorlarına kapalı (`noindex`, `robots.txt`).
- **Para `numeric(18,2)`, silme yok.** Ondalıklı sayı (float) kullanılmaz. Kayıtlar silinmez, pasife alınır.
- **Fiyat ve KDV hesabı tek modülde** (`lib/money.ts`). Katalogda yalnız gösterim var, ama hesap tek yerde kalır.
- **Rol kapsamı merkezi katmanda.** Tedarikçi yalnız kendi ürünlerini görür; alıcı aktif ürünlerin katalogunu görür, başka firmanın kullanıcı ve firma verisine erişemez.
- **Günlük otomatik yedek.** Yedek sunucunun dışında bir yerde durur; geri yükleme en az bir kez denenir.
- **Denetim kaydı.** Fiyat ve ürün değişiklikleri kim/ne zaman/eski-yeni değer olarak saklanır.

Bu sürümde kullanılan tablolar: `firma`, `kullanici`, `urun`, `denetim_kaydi`. Operasyon tabloları (`siparis`, `siparis_satir`, `odeme`, `onay`) şemada durur, ekranı yoktur; silinmezler, ileride kullanılacaklardır.

## Teknoloji

Tek Next.js uygulaması, kendi sunucusunda Node süreci olarak, yanında PostgreSQL. Başka hiçbir bileşen yok.

| Katman | Seçim | Not |
| --- | --- | --- |
| Uygulama | Next.js (TypeScript) | Hem arayüz hem API tek projede |
| Çalışma | Docker içinde `next start`, kendi sunucuda | Serverless'ta transaction ve uzun işlem kırılgan olur |
| Veritabanı | PostgreSQL | Para ve sipariş tutarlılığı için transaction ve kısıt şart |
| ORM | Prisma veya Drizzle | Şema değişiklikleri migration ile |
| Arayüz | Sunucu taraflı render + shadcn/ui + TanStack Table | Tablo ve form ağırlıklı; ayrı SPA gereksiz |
| Kimlik | Auth.js veya Better Auth | Üç rol parolayla girer: admin, tedarikçi, alıcı. Girişsiz erişim yok |

## Sistem bileşenleri

&#91;embedded content: sistem mimarisi · 3 ekran seti, 1 uygulama, 1 veritabanı\]

Üç ekran seti de aynı Next.js uygulamasından gelir, uygulama tek bir PostgreSQL veritabanına yazar. Ayrı panel uygulaması, ayrı yetki sistemi yok; alıcı tarafı uygulamanın parolasız bir sayfasıdır. Kuyruk, worker ve dış servis de yok: e-posta bildirimi ilk sürümde doğrudan gönderilir.

## Sonraya bırakılanlar

Aşağıdakiler ilk sürümün dışındadır ve ancak gerçek firmalarla sipariş akmaya başladıktan sonra ele alınır.

- **Operasyon akışı: sipariş girişi, fatura kaydı, ödeme bildirimi, alıcının imzalı onayı, durum akışı.** Tabloları ve kuralları yazıldı, ekranları yapılmadı. Katalog benimsendikten sonra açılacak.
- Tedarikçinin kendi ürününü girmesi ve fiyat güncellemesi
- Müşteriye özel fiyat listeleri, kampanyalar, raporlar
- Cari hesap defteri, alıcı limiti, gecikme takibi
- E-fatura entegrasyonu
- Ödemeyi platform üzerinden toplamak. Üçüncü kişiler adına para tahsil etmek ödeme hizmeti kapsamına girer ve izne tabidir; aracı kaldığımız sürece para taraflar arasında kalır.
- Faktoring / tedarikçi finansmanı. Lisanslı bir finans kuruluşuyla anlaşma gerektirir; platform kendi başına alacak satın alıp peşin ödeme yapamaz.

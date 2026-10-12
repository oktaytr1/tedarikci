# task.md — B2B Kapalı Katalog (İlk Sürüm)

Kaynak: "B2B Tedarikçi Pazarlama Platformu — Mimari Dokümanı".

**Konsept değişikliği (12 Ekim 2026):** İlk sürüm artık operasyon sistemi değil,
**kapalı bir B2B katalog**. Giriş yapmadan hiçbir ürün ve fiyat görünmez.
Sipariş, fatura, borç ve onay akışı bu sürümde YOK — ticaret telefon ve
WhatsApp üzerinden dönmeye devam ediyor.

Operasyon tabloları (`siparis`, `siparis_satir`, `odeme`, `onay`) ve kuralları
şemada DURUYOR. Silinmez, migration geçmişi bozulmaz; yalnızca ekranları
yapılmaz. İleride geri açılacak.

Hedef: yetkili firmalar giriş yapıp tedarikçileri ve ürünleri fiyatlarıyla görsün.

---

## 0. Kurulum — TAMAMLANDI

- [x] Next.js 16 + TypeScript, PostgreSQL, Prisma 7, shadcn/ui, Auth.js v5
- [x] Docker compose (yalnız db servisi), Dockerfile
- [x] Git deposu ve ilk commit'ler
- [ ] PostgreSQL 16'da tüm testlerin geçtiğini doğrula (Docker kurulunca)

## 1. Veri modeli — BÜYÜK ÖLÇÜDE TAMAMLANDI

- [x] `firma`, `kullanici`, `urun`, `denetim_kaydi` (bu sürümde kullanılacaklar)
- [x] `siparis`, `siparis_satir`, `odeme`, `onay` (kullanılmayacak, şemada kalır)
- [x] Para alanları `numeric(18,2)`, float yok
- [x] Silme yasağı (tetikleyici + Prisma extension + ESLint)
- [x] `lib/money.ts` ve testleri

### Bu sürüm için eklenecekler

- [ ] `Rol` enum'una `alici` eklenir
- [ ] `urun.aciklama` — teknik detay, uzun metin
- [ ] `urun.fotograf_url` — tek fotoğraf, dışarıdan link (yükleme YOK)
- [ ] `urun.kategori` — basit metin veya küçük enum; katalog filtresi buna dayanır
- [ ] Migration yazılır, PostgreSQL 16'da denenir

## 2. Yetki ve oturum — KISMEN TAMAMLANDI

- [x] Parolalı giriş, rol bazlı yetki, merkezi scope katmanı
- [x] Oturumda rol ve aktiflik her istekte DB'den tazelenir
- [ ] **`alici` rolü scope katmanına eklenir:**
  - [ ] Alıcı: aktif ürünlerin tamamını ve tedarikçi firmaların vitrin bilgisini görür
  - [ ] Alıcı: başka firmanın kullanıcı kaydına, pasif ürüne, denetim kaydına erişemez
  - [ ] Tedarikçi: yalnız kendi ürünlerini görür (mevcut kural korunur)
- [ ] Testler: alıcı hesabıyla yetkisiz veriye erişim denemeleri reddedilmeli

## 3. Admin paneli

- [x] Firma listesi + ekle/düzenle (tedarikçi ve alıcı), pasife alma
- [x] Kullanıcı açma: firma seçimi, rol seçimi (admin/tedarikçi/alıcı), parola belirleme
- [x] Ürün listesi: tedarikçiye göre filtre, arama, aktif/pasif
- [x] Ürün ekle/düzenle: kod, ad, açıklama, kategori, birim, koli adedi,
      min. sipariş, liste fiyatı, KDV oranı, fotoğraf linki
- [x] Ürünü pasife alma (silme yok)
- [ ] Toplu ürün girişi için CSV içe aktarma (opsiyonel, çok ürün varsa şart olur) — *bu turda yapılmadı*

## 4. Katalog (alıcı ekranı)

- [ ] Giriş sonrası ana sayfa: tedarikçi firmalar listesi
- [ ] Ürün listesi: kart veya tablo görünümü, fotoğraf + ad + fiyat + birim
- [ ] Arama: ürün adı ve kodunda
- [ ] Filtre: tedarikçi, kategori
- [ ] Ürün detay sayfası: büyük fotoğraf, açıklama, tüm alanlar, tedarikçi bilgisi
- [ ] Sepet, sipariş, "teklif iste" YOK — iletişim bilgisi gösterilir, o kadar
- [ ] Mobilde düzgün çalışmalı (alıcılar telefondan bakacak)

## 5. Tedarikçi ekranı

- [ ] Kendi ürünlerinin listesi, salt okunur
- [ ] Ürün detayını görme
- [ ] Düzeltme için admin iletişim bilgisi (bu sürümde tedarikçi ürün girmiyor)

## 6. Gizlilik ve erişim

- [ ] Oturumsuz her istek giriş sayfasına yönlenir (sunucu tarafında)
- [ ] `robots.txt` ile tüm site kapalı, sayfalarda `noindex`
- [ ] Ürün fotoğrafı linkleri dışarıdan geliyorsa bile sayfa oturumsuz açılmasın
- [ ] Giriş denemesi sınırı (hâlihazırda bellekte, 15 dk / 5 hata)

## 7. Yayına alma

- [ ] Sunucu/barındırma kararı: Vercel + Neon veya kendi sunucu (Coolify)
- [ ] Domain A kaydı, HTTPS
- [ ] `AUTH_SECRET` üretimde yeniden üretilir, `DATABASE_URL` üretim veritabanı
- [ ] Migration'lar çalıştırılır, ilk admin `scripts/admin-olustur.ts` ile açılır
- [ ] **Günlük otomatik yedek + geri yükleme provası** (sunucu dışında saklanır)
- [ ] Hata kaydı (Sentry veya benzeri)

## 8. Kabul testi

- [ ] Admin bir tedarikçi firma, bir alıcı firma ve beş ürün ekler
- [ ] Alıcı hesabıyla giriş yapılır, ürünler fiyatlarıyla görünür
- [ ] Çıkış yapılır; aynı ürün sayfası doğrudan açılmaya çalışılır → giriş sayfası
- [ ] Tedarikçi hesabı yalnız kendi ürünlerini görür, başkasınınkini göremez
- [ ] Ürün pasife alınır, katalogda kaybolur, admin listesinde kalır
- [ ] Fiyat değiştirilir, denetim kaydında eski ve yeni değer görünür
- [ ] Mobil tarayıcıda katalog kullanılabilir durumda
- [ ] Yedekten geri yükleme ile tüm veri geri gelir

---

## Kapsam dışı (bu sürümde yapılmayacak)

- Sipariş girişi, fatura, ödeme, alıcı onayı, durum akışı
  (tabloları ve kuralları hazır, ekranları yok — ileride açılacak)
- Tedarikçinin kendi ürününü girmesi, fiyat güncellemesi
- Fotoğraf yükleme (şimdilik dış link; ileride basit storage)
- Müşteriye özel fiyat, kampanya, rapor
- Cari hesap, limit, gecikme takibi
- E-fatura, faktoring, platform üzerinden tahsilat

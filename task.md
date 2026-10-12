# task.md — B2B Tedarikçi Pazarlama Platformu (İlk Sürüm)

Kaynak: "B2B Tedarikçi Pazarlama Platformu — Mimari Dokümanı".
Model: aracı platform. Fatura tedarikçiden alıcıya kesilir, para platformdan geçmez.
Siparişi yalnızca admin girer. Alıcı tek kullanımlık bağlantıyla onaylar.

Hedef: gerçek iki firma arasındaki ilk siparişin baştan sona sistemden geçmesi.

---

## 0. Kurulum

- [x] Next.js (TypeScript) projesi oluştur, App Router
- [x] PostgreSQL kur (yerel: Docker), bağlantıyı `.env` ile yönet
- [x] Prisma (veya Drizzle) kur, ilk migration akışını çalıştır
- [x] shadcn/ui + TanStack Table ekle
- [x] Auth.js (veya Better Auth) kur — e-posta + parola
- [ ] Dockerfile + `next start` ile çalışan üretim imajı — *yazıldı, Docker kurulunca denenecek*
- [ ] Git deposu, `main` korumalı, `.env` commit edilmiyor — *yerel depo + .gitignore hazır; `main` koruması uzak depo açılınca*

## 1. Veri modeli (yedi tablo)

- [x] `firma` — unvan, vergi_no (tekil), tip (tedarikçi/alıcı/her ikisi), durum, adres, telefon
- [x] `kullanici` — firma_id, e-posta (tekil), parola_hash, rol (admin/tedarikçi), aktif
- [x] `urun` — firma_id (satıcı), kod, ad, birim, koli_adedi, min_siparis, liste_fiyat, kdv_orani
- [x] `siparis` — alici_firma_id, satici_firma_id, tarih, odeme_tipi (peşin/vadeli), vade_gun, vade_tarihi, durum, ara_toplam, kdv_toplam, genel_toplam, komisyon_oran, komisyon_tutar, fatura_no, fatura_tarihi, iptal_mi, iptal_nedeni
- [x] `siparis_satir` — siparis_id, urun_id, ad (kopya), adet, birim_fiyat (kopya), kdv_orani, kdv_tutar, satir_toplam
- [x] `odeme` — siparis_id, odeyen_firma_id, alan_firma_id, tutar, tarih, yontem, not, iptal_mi
- [x] `onay` — siparis_id, token_hash, olusturma, son_gecerlilik, kullanildi_mi, onay_zamani, onaylanan_tutar, onaylanan_kalemler (JSON kopya), ip, user_agent

### Kurallar (kod seviyesinde zorunlu)

- [x] Tüm para alanları `numeric(18,2)` — float KULLANILMAZ
- [ ] Fiyat, ürün adı ve KDV oranı sipariş anında `siparis_satir`a kopyalanır — *kolonlar ve `lib/money.ts` hazır; kopyalayan sipariş servisi bölüm 3 ile*
- [x] KDV satır bazında hesaplanır; fatura toplamı satırlardan türetilir
- [x] Yuvarlama tek bir modülde (`lib/money.ts`), her yerde o kullanılır
- [x] Hiçbir kayıt silinmez — `iptal_mi` işaretlenir (DELETE yok)
- [x] `fatura_no` + `satici_firma_id` tekil kısıt (aynı fatura iki kez girilemez)
- [x] Rol/firma kapsamı her sorguda zorunlu: tedarikçi yalnız kendi siparişlerini görür

## 2. Yetki ve oturum

- [x] Admin ve tedarikçi için parolalı giriş
- [x] Rol bazlı yetki kontrolü **sunucu tarafında** (butonu gizlemek yetki değildir)
- [x] Tedarikçi oturumu kendi `firma_id` dışına çıkamaz (merkezi scope katmanı)
- [x] Alıcı için oturum YOK — erişim yalnız onay bağlantısıyla
- [x] Admin'in kritik işlemleri (durum değişikliği, ödeme girişi, iptal) denetim kaydına yazılır — *8. tablo `denetim_kaydi`; tüm yazmalar*

## 3. Admin paneli (geniş — asıl iş burada)

- [ ] Firma listesi + ekle/düzenle (tedarikçi ve alıcı)
- [ ] Kullanıcı ekleme (tedarikçi kullanıcıları admin açar)
- [ ] Ürün listesi + ekle/düzenle (tedarikçi bazlı)
- [ ] **Sipariş girişi**: alıcı, tedarikçi, satır ekleme (ürün/adet/fiyat), ödeme tipi, vade, komisyon oranı
  - [ ] Hızlı giriş: klavyeyle satır ekleme, ürün arama
  - [ ] Toplamlar canlı hesaplanır (ara toplam, KDV, genel toplam, komisyon)
- [ ] Tüm siparişler tek tablo: arama, firma/durum/tarih filtresi, sıralama
- [ ] Sipariş detayı: durum değiştirme, fatura no + tutar girişi, ödeme bildirimi ekleme, iptal
- [ ] Onay bağlantısı üretme ve kopyalama (WhatsApp/SMS ile elden gönderilir)

## 4. Tedarikçi ekranı (dar — üç işlem)

- [ ] Kendi siparişleri listesi (tarih, alıcı, tutar, vade, durum)
- [ ] "Onaylıyorum" — durumu *Tedarikçi onayladı*'ya taşır
- [ ] "Sevk ettim" — fatura no ve tutar girişi, durumu *Sevk edildi*'ye taşır
- [ ] Sipariş detayı görüntüleme (salt okunur)

## 5. Alıcı onay sayfası (tek sayfa, parolasız)

- [ ] `/onay/[token]` sayfası: tedarikçi, sipariş kalemleri, tutar, vade görünür
- [ ] Tek buton: "Teslim aldım, borcu onaylıyorum"
- [ ] Token kuralları:
  - [ ] Kriptografik rastgele, en az 32 bayt; veritabanında yalnız hash saklanır
  - [ ] Tek kullanım — onaydan sonra geçersiz
  - [ ] 7 gün süre sınırı
- [ ] Onay anında kalemler ve tutar `onay` kaydına kopyalanır (sipariş sonradan değişse de sabit kalır)
- [ ] Onay kaydı değiştirilemez; admin alıcı adına onay oluşturamaz (uygulama seviyesinde engelli)
- [ ] Geçersiz/süresi geçmiş/kullanılmış token için açık hata sayfası

## 6. Sipariş durum akışı

- [ ] Durumlar: `girildi` → `tedarikci_onayladi` → `sevk_edildi` → `alici_onayladi` → `odendi`
- [ ] Geçişler tek yönlü; izinsiz geçiş sunucuda reddedilir
- [ ] `alici_onayladi` durumuna **yalnız** onay sayfası taşıyabilir
- [ ] `odendi` durumu ödeme kaydı girilmeden verilmez
- [ ] İptal her durumda ayrı işaret olarak eklenir, kayıt silinmez

## 7. Bildirimler (basit)

- [ ] E-posta gönderimi (doğrudan, kuyruk yok): tedarikçiye yeni sipariş, admine alıcı onayı
- [ ] Onay bağlantısı metni hazır şablon olarak kopyalanabilir

## 8. Yayına alma

- [ ] Sunucu: TR veya AB bölgesinde VPS, Docker ile dağıtım
- [ ] HTTPS, alan adı, parola politikası
- [ ] **Günlük otomatik yedek** + geri yükleme provası (en az bir kez gerçekten denenecek)
- [ ] Hata kaydı (Sentry veya dosya bazlı log)

## 9. Kabul testi (canlıya geçiş kriteri)

- [ ] Admin bir alıcı, bir tedarikçi ve üç ürün ekler
- [ ] Admin vadeli bir sipariş girer; toplamlar ve KDV elle hesapla birebir tutar
- [ ] Tedarikçi onaylar, sevk eder, fatura no girer
- [ ] Alıcıya giden bağlantı tek tıkla onaylanır; onay kaydı tutar ve zamanla oluşur
- [ ] Aynı bağlantı ikinci kez açıldığında çalışmaz
- [ ] Ürün fiyatı değiştirilir; geçmiş siparişin tutarı DEĞİŞMEZ
- [ ] Aynı fatura numarası ikinci kez girilemez
- [ ] Ödeme bildirimi girilir, sipariş kapanır
- [ ] Yedekten geri yükleme ile tüm bu veri geri gelir

---

## Kapsam dışı (bu sürümde yapılmayacak)

- Alıcının kendi sipariş girişi, sepet
- Cari hesap defteri, alıcı limiti, gecikme takibi
- Müşteriye özel fiyat listeleri, kampanyalar, raporlar
- E-fatura entegrasyonu (fatura no ve tutar elle girilir)
- Ödemenin platform üzerinden toplanması (izne tabi — aracı modelde para taraflar arasında kalır)
- Faktoring / tedarikçi finansmanı (lisanslı kurumla anlaşma gerektirir)

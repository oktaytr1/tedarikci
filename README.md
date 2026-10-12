# tedarikcim.net.tr — B2B Ürün Kataloğu

Basit bir B2B ürün katalog sitesi. Ziyaretçiler ürünleri, fiyatları ve fotoğrafları görür. Admin panelinden ürün eklenir/düzenlenir.

## Kurulum

```bash
npm install
cp .env.example .env   # DATABASE_URL, ADMIN_PASSWORD ve ADMIN_SESSION_SECRET'i düzenle
npx prisma migrate dev
npm run dev
```

`ADMIN_PASSWORD` için en az 16 karakterlik güçlü bir parola, `ADMIN_SESSION_SECRET` için en az 32 baytlık rastgele bir değer kullanın. Oturum anahtarı üretmek için `openssl rand -base64 48` komutunu kullanabilirsiniz. Bu değerleri üretim ortamının gizli değişkenlerinde saklayın; `.env` dosyasını depoya eklemeyin.

## Yapı

- `/katalog` — Herkese açık ürün kataloğu (arama, kategori filtreleme)
- `/admin` — Gizli yönetim paneli (env şifresiyle giriş)
- `/admin/urunler` — Ürün ekleme, düzenleme, aktif/pasif

## Teknolojiler

- Next.js 16 (App Router)
- PostgreSQL + Prisma
- Tailwind CSS + shadcn/ui

# Tedarikçi Pazarlama Platformu

B2B aracı platform: fatura tedarikçiden alıcıya kesilir, para platformdan geçmez.
Neden-öyle soruları için **"B2B Tedarikçi Pazarlama Platformu — Mimari Dokümanı.md"**,
yapılacaklar için **task.md**.

## Yerel kurulum

Gerekenler: Node 24+, Docker Desktop.

```bash
cp .env.example .env               # AUTH_SECRET için: openssl rand -base64 32
docker compose up -d db            # PostgreSQL 16 (+ tedarikci_test veritabanı)
npm install                        # postinstall: prisma generate
npm run db:deploy                  # migration'ları uygular
npm run admin:olustur -- sen@firma.com   # ilk admin (parola terminalden sorulur)
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
| Tedarikçi kendi firması dışına çıkamaz | `lib/scope.ts` → her sorguya zorunlu filtre + ilişki beyaz listesi | Satır/ürün/firma tipi tutarlılık tetikleyicileri |
| Kritik işlemler denetlenir | Tüm yazmalar `denetimli()` içinde; eski/yeni fark aynı transaction'da `denetim_kaydi`na | `denetim_kaydi` değiştirilemez/silinemez |
| Onay kaydı değişmez, admin alıcı adına onaylayamaz | Kapsamlı istemci yalnız bağlantı kaydı oluşturmaya izin verir | Kullanılmış onayda UPDATE tetikleyiciyle reddedilir |
| Alıcı için oturum yok | Auth.js yalnız admin/tedarikçi; `/onay/*` proxy kapsamı dışında | — |

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

### `prisma migrate reset` ve silme tetikleyicisi

Tetikleyici yalnız `DELETE` ifadesinde çalışır. `migrate reset` şemayı `DROP SCHEMA` ile düşürür,
testler `TRUNCATE` ile temizler; ikisi de satır tetikleyicisini çalıştırmaz. Bu yüzden tetikleyici
geliştirmede de açıktır, ayrı bir "geliştirme modu" yoktur.

#!/usr/bin/env bash
# Geri yükleme provası: bir yedeği GEÇİCİ bir veritabanına yükler, tablo tablo kaynakla
# karşılaştırır (kayıt sayısı + içerik özeti), kuralların (tetikleyici, CHECK) geldiğini doğrular,
# sonra geçici veritabanını kaldırır. Kaynak veritabanına yazmaz.
#
#   PROVA_SUNUCU_URL="postgresql://postgres:…@sunucu:5432/postgres" \
#   KAYNAK_DATABASE_URL="postgresql://…/b2b_platform" \
#   ./scripts/geri-yukleme-provasi.sh /var/backups/tedarikci/tedarikci-20261012T030000Z.dump
#
#   PROVA_SUNUCU_URL     veritabanı oluşturma yetkisi olan bağlantı (geçici DB burada açılır)
#   KAYNAK_DATABASE_URL  karşılaştırılacak canlı veritabanı (yedek o andan sonra değiştiyse fark çıkar)
set -euo pipefail

YEDEK="${1:?Kullanım: $0 <yedek.dump>}"
: "${PROVA_SUNUCU_URL:?PROVA_SUNUCU_URL tanımlı olmalı}"
: "${KAYNAK_DATABASE_URL:?KAYNAK_DATABASE_URL tanımlı olmalı}"
IMAJ="postgres:16-alpine"
DB="tedarikci_prova_$(date +%s)"
PROVA_URL="${PROVA_SUNUCU_URL%/*}/$DB"
psql_() { docker run --rm -i --network host "$IMAJ" psql -v ON_ERROR_STOP=1 -qAt "$@"; }

psql_ "$PROVA_SUNUCU_URL" -c "CREATE DATABASE $DB"
trap 'psql_ "$PROVA_SUNUCU_URL" -c "DROP DATABASE IF EXISTS $DB" >/dev/null; echo "Geçici veritabanı kaldırıldı: $DB"' EXIT

docker run --rm --network host -v "$(cd "$(dirname "$YEDEK")" && pwd):/yedek" "$IMAJ" \
  pg_restore --no-owner --dbname "$PROVA_URL" "/yedek/$(basename "$YEDEK")"
echo "Geri yüklendi: $DB"

SORGU=""
for t in firma kullanici urun siparis siparis_satir odeme onay denetim_kaydi; do
  SORGU+="SELECT '$t', count(*), md5(coalesce(string_agg(x::text, '' ORDER BY id), '')) FROM \"$t\" x UNION ALL "
done
SORGU+="SELECT 'tetikleyici', count(*), '' FROM pg_trigger WHERE NOT tgisinternal UNION ALL "
SORGU+="SELECT 'check', count(*), '' FROM pg_constraint WHERE contype = 'c'"

diff <(psql_ "$KAYNAK_DATABASE_URL" -c "$SORGU") <(psql_ "$PROVA_URL" -c "$SORGU") \
  && echo "SONUÇ: yedekteki veri kaynakla birebir aynı (tüm tablolar, tetikleyiciler, kısıtlar)." \
  || { echo "SONUÇ: FARK VAR (yedek alındıktan sonra veri değiştiyse beklenir; değilse incele)." >&2; exit 1; }

# Kurallar gerçekten çalışıyor mu?
if psql_ "$PROVA_URL" -c "DELETE FROM urun WHERE id = (SELECT min(id) FROM urun)" 2>/dev/null; then
  echo "UYARI: geri yüklenen veritabanında silme engellenmedi!" >&2; exit 1
fi
echo "Silme tetikleyicisi geri yüklenen veritabanında çalışıyor."

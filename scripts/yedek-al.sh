#!/usr/bin/env bash
# Günlük veritabanı yedeği (sunucuda cron ile). pg_dump özel biçim + bütünlük denetimi +
# isteğe bağlı sunucu dışına kopya (rclone) + eski yedeklerin temizlenmesi.
#
#   YEDEK_DATABASE_URL="postgresql://…"  ./scripts/yedek-al.sh
#
# Ortam değişkenleri:
#   YEDEK_DATABASE_URL   (zorunlu) yedeklenecek veritabanı
#   YEDEK_DIZINI         yerel yedek klasörü (varsayılan /var/backups/tedarikci)
#   YEDEK_SAKLAMA_GUN    yerelde saklama süresi, gün (varsayılan 14)
#   YEDEK_RCLONE_HEDEF   sunucu dışı hedef, ör. "b2:tedarikci-yedek" ya da "s3:kova/yol" (boşsa kopyalanmaz)
#
# pg_dump sunucuya kurulu olmak zorunda değil: postgres:16 imajıyla çalıştırılır.
set -euo pipefail

: "${YEDEK_DATABASE_URL:?YEDEK_DATABASE_URL tanımlı olmalı}"
DIZIN="${YEDEK_DIZINI:-/var/backups/tedarikci}"
SAKLAMA="${YEDEK_SAKLAMA_GUN:-14}"
IMAJ="postgres:16-alpine"

mkdir -p "$DIZIN"
AD="tedarikci-$(date -u +%Y%m%dT%H%M%SZ).dump"

docker run --rm --network host -v "$DIZIN:/yedek" "$IMAJ" \
  pg_dump --format=custom --no-owner --file "/yedek/$AD" "$YEDEK_DATABASE_URL"

# Bütünlük: arşivin içindekiler okunabiliyor mu?
docker run --rm -v "$DIZIN:/yedek" "$IMAJ" pg_restore --list "/yedek/$AD" > /dev/null
echo "Yedek alındı: $DIZIN/$AD ($(du -h "$DIZIN/$AD" | cut -f1))"

if [ -n "${YEDEK_RCLONE_HEDEF:-}" ]; then
  rclone copy "$DIZIN/$AD" "$YEDEK_RCLONE_HEDEF"
  echo "Sunucu dışına kopyalandı: $YEDEK_RCLONE_HEDEF/$AD"
else
  echo "UYARI: YEDEK_RCLONE_HEDEF boş; yedek yalnız bu sunucuda. Sunucu kaybında yedek de gider." >&2
fi

# Yerelde eski yedekleri temizle (sunucu dışındaki kopyaların saklama süresi orada ayarlanır).
find "$DIZIN" -maxdepth 1 -name 'tedarikci-*.dump' -mtime +"$SAKLAMA" -print -delete

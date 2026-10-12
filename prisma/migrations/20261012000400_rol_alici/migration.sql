-- Alıcı rolü (kapalı katalog). Yeni enum değeri aynı transaction'da kullanılamadığı için
-- bu değeri kullanan kısıt ve tetikleyiciler bir sonraki migration'dadır.
ALTER TYPE "rol" ADD VALUE 'alici';

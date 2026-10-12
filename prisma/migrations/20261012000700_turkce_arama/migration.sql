-- Türkçe karakter ve büyük/küçük harf duyarsız ürün araması.
-- "pecete" → "Peçete", "yogurt" → "Yoğurt", "isik" / "IŞIK" / "ışık" → "Işık", "izmir" → "İzmir".
--
-- Sıra önemli: ÖNCE aksanlar atılır (unaccent: İ→I, ı→i, ç→c, ğ→g, ş→s, ö→o, ü→u, â→a …),
-- SONRA küçük harfe çevrilir. Böylece lower() yalnız ASCII harflere uygulanır ve sonuç
-- veritabanının yerel ayarından (collation/ctype) bağımsızdır. Uygulamadaki karşılığı:
-- lib/arama.ts → aramaNormalize (tests/arama.test.ts ikisinin aynı sonucu verdiğini doğrular).

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Sözlük açıkça verildiği için IMMUTABLE güvenle işaretlenebilir (indeks ve tetikleyicide kullanılır).
CREATE FUNCTION arama_normalize(metin text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$
  SELECT lower(public.unaccent('public.unaccent'::regdictionary, metin));
$$;

ALTER TABLE "urun" ADD COLUMN "arama_metni" TEXT;

-- arama_metni uygulama tarafından yazılmaz; kod ya da ad değişince tetikleyici doldurur.
CREATE FUNCTION urun_arama_metni() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.arama_metni := arama_normalize(NEW.kod || ' ' || NEW.ad);
  RETURN NEW;
END;
$$;

CREATE TRIGGER urun_arama_metni
  BEFORE INSERT OR UPDATE ON "urun"
  FOR EACH ROW EXECUTE FUNCTION urun_arama_metni();

-- Mevcut ürünler için doldur.
UPDATE "urun" SET arama_metni = arama_normalize(kod || ' ' || ad);

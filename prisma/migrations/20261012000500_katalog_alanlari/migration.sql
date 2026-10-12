-- Kapalı katalog: ürün katalog alanları ve alıcı kullanıcısı kuralları.

-------------------------------------------------------------------------------
-- 1. Ürün katalog alanları
-------------------------------------------------------------------------------
ALTER TABLE "urun"
  ADD COLUMN "aciklama" TEXT,
  ADD COLUMN "kategori" TEXT,
  ADD COLUMN "fotograf_url" TEXT;

CREATE INDEX "urun_kategori_idx" ON "urun"("kategori");

ALTER TABLE "urun"
  -- Kategori serbest metindir; boş metin yerine NULL kullanılır.
  ADD CONSTRAINT urun_kategori_bos_degil CHECK (kategori IS NULL OR (btrim(kategori) <> '' AND length(kategori) <= 100)),
  -- Fotoğraf dışarıdan link: yalnız https, boşluksuz, en fazla 2000 karakter.
  ADD CONSTRAINT urun_fotograf_url_https CHECK (
    fotograf_url IS NULL OR (fotograf_url ~ '^https://[^[:space:]]+$' AND length(fotograf_url) <= 2000)
  );

-------------------------------------------------------------------------------
-- 2. Kullanıcı ↔ firma: admin firmasız, tedarikçi ve alıcı firmaya bağlı
-------------------------------------------------------------------------------
ALTER TABLE "kullanici" DROP CONSTRAINT kullanici_tedarikci_firma_zorunlu;
ALTER TABLE "kullanici"
  ADD CONSTRAINT kullanici_firma_rol_uyumu CHECK ((rol = 'admin') = (firma_id IS NULL));

-- Tedarikçi kullanıcısının firması satıcı, alıcı kullanıcısının firması alıcı olabilmeli.
CREATE OR REPLACE FUNCTION kullanici_firma_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_tip firma_tip;
BEGIN
  IF NEW.rol = 'tedarikci' THEN
    PERFORM firma_satici_olmali(NEW.firma_id, 'Tedarikçi kullanıcısı');
  ELSIF NEW.rol = 'alici' THEN
    SELECT tip INTO v_tip FROM "firma" WHERE id = NEW.firma_id;
    IF v_tip = 'tedarikci' THEN
      RAISE EXCEPTION 'Alıcı kullanıcısı için firma #% alıcı tipinde olmalı.', NEW.firma_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

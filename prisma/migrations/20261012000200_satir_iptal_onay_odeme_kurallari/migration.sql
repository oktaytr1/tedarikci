-- Satır iptali, onay bağlantısı kuralları ve ödeme yönü.

-------------------------------------------------------------------------------
-- Kolonlar (schema.prisma ile aynı)
-------------------------------------------------------------------------------
ALTER TABLE "siparis_satir" ADD COLUMN "iptal_mi" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "onay" ADD COLUMN "iptal_zamani" TIMESTAMPTZ(3);

-------------------------------------------------------------------------------
-- 1. Sipariş satırları yalnız sipariş "girildi" iken (ve iptal edilmemişken) eklenir,
--    değiştirilir ya da iptal edilir. Tedarikçi onayından sonra satırlar donar.
-------------------------------------------------------------------------------
CREATE FUNCTION siparis_satir_donma_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_durum siparis_durum;
  v_iptal boolean;
BEGIN
  SELECT durum, iptal_mi INTO v_durum, v_iptal FROM "siparis" WHERE id = NEW.siparis_id;
  IF v_durum IS DISTINCT FROM 'girildi' THEN
    RAISE EXCEPTION 'Sipariş #% "%" durumunda; satırlar yalnız "girildi" durumunda değiştirilebilir.',
      NEW.siparis_id, v_durum;
  END IF;
  IF v_iptal THEN
    RAISE EXCEPTION 'Sipariş #% iptal edilmiş; satırları değiştirilemez.', NEW.siparis_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER siparis_satir_donma_kurali
  BEFORE INSERT OR UPDATE ON "siparis_satir"
  FOR EACH ROW EXECUTE FUNCTION siparis_satir_donma_kurali();

-------------------------------------------------------------------------------
-- 2. Onay bağlantısı
-------------------------------------------------------------------------------

-- Siparişte en fazla BİR kullanılmış onay.
CREATE UNIQUE INDEX onay_siparis_tek_kullanilmis ON "onay" ("siparis_id") WHERE kullanildi_mi;
-- Siparişte en fazla BİR geçerli (kullanılmamış, geçersiz kılınmamış) bağlantı.
-- Eşzamanlı iki bağlantı üretimi de bu indekse takılır.
CREATE UNIQUE INDEX onay_siparis_tek_gecerli ON "onay" ("siparis_id")
  WHERE NOT kullanildi_mi AND iptal_zamani IS NULL;

ALTER TABLE "onay"
  ADD CONSTRAINT onay_kullanilmis_gecersiz_olamaz CHECK (NOT (kullanildi_mi AND iptal_zamani IS NOT NULL));

-- Yeni bağlantı: kullanılmış onay varsa reddedilir; değilse eski geçerli bağlantılar geçersiz kılınır.
-- Bağlantı kullanılmamış olarak doğar (onayı yalnız alıcı verir).
CREATE FUNCTION onay_yeni_baglanti_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kullanildi_mi OR NEW.onay_zamani IS NOT NULL OR NEW.onaylanan_tutar IS NOT NULL
     OR NEW.onaylanan_kalemler IS NOT NULL OR NEW.iptal_zamani IS NOT NULL THEN
    RAISE EXCEPTION 'Onay bağlantısı kullanılmamış ve geçerli olarak oluşturulur.';
  END IF;
  IF EXISTS (SELECT 1 FROM "onay" WHERE siparis_id = NEW.siparis_id AND kullanildi_mi) THEN
    RAISE EXCEPTION 'Sipariş #% alıcı tarafından zaten onaylanmış; yeni bağlantı üretilemez.', NEW.siparis_id;
  END IF;
  UPDATE "onay" SET iptal_zamani = now()
   WHERE siparis_id = NEW.siparis_id AND NOT kullanildi_mi AND iptal_zamani IS NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER onay_yeni_baglanti_kurali
  BEFORE INSERT ON "onay"
  FOR EACH ROW EXECUTE FUNCTION onay_yeni_baglanti_kurali();

-- Değişmezlik kuralına ek: geçersiz kılınmış bağlantı da artık değiştirilemez.
CREATE OR REPLACE FUNCTION onay_degistirilemez() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.kullanildi_mi THEN
    RAISE EXCEPTION 'Kullanılmış onay kaydı değiştirilemez (onay #%).', OLD.id;
  END IF;
  IF OLD.iptal_zamani IS NOT NULL THEN
    RAISE EXCEPTION 'Geçersiz kılınmış onay bağlantısı değiştirilemez (onay #%).', OLD.id;
  END IF;
  IF NEW.siparis_id <> OLD.siparis_id
     OR NEW.token_hash <> OLD.token_hash
     OR NEW.olusturma <> OLD.olusturma THEN
    RAISE EXCEPTION 'Onay kaydının kimlik alanları değiştirilemez (onay #%).', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

-------------------------------------------------------------------------------
-- 3. Ödeme yönü: ödeyen = siparişin alıcısı, alan = siparişin satıcısı.
--    CHECK başka tabloya bakamadığı için tetikleyiciyle zorlanır.
-------------------------------------------------------------------------------
CREATE FUNCTION odeme_yon_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_alici integer;
  v_satici integer;
BEGIN
  SELECT alici_firma_id, satici_firma_id INTO v_alici, v_satici FROM "siparis" WHERE id = NEW.siparis_id;
  IF NEW.odeyen_firma_id IS DISTINCT FROM v_alici OR NEW.alan_firma_id IS DISTINCT FROM v_satici THEN
    RAISE EXCEPTION 'Ödeme yönü geçersiz: ödeyen siparişin alıcısı (firma #%), alan siparişin satıcısı (firma #%) olmalı.',
      v_alici, v_satici;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER odeme_yon_kurali
  BEFORE INSERT OR UPDATE OF siparis_id, odeyen_firma_id, alan_firma_id ON "odeme"
  FOR EACH ROW EXECUTE FUNCTION odeme_yon_kurali();

-- Ödemesi olan siparişin tarafları değiştirilemez (aksi hâlde ödeme yönü sonradan bozulurdu).
CREATE FUNCTION siparis_taraf_odeme_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.alici_firma_id <> OLD.alici_firma_id OR NEW.satici_firma_id <> OLD.satici_firma_id)
     AND EXISTS (SELECT 1 FROM "odeme" WHERE siparis_id = OLD.id) THEN
    RAISE EXCEPTION 'Sipariş #% için ödeme kaydı var; alıcı/satıcı değiştirilemez.', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER siparis_taraf_odeme_kurali
  BEFORE UPDATE OF alici_firma_id, satici_firma_id ON "siparis"
  FOR EACH ROW EXECUTE FUNCTION siparis_taraf_odeme_kurali();

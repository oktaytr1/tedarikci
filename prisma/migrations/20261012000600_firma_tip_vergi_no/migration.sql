-- Firma: vergi no biçimi ve tip değişikliğinin kullanıcı/ürün/siparişlerle tutarlılığı.

-- Vergi no metin olarak saklanır (baştaki sıfırlar korunur): yalnız rakam, 10 hane (VKN)
-- ya da 11 hane (TCKN).
ALTER TABLE "firma"
  ADD CONSTRAINT firma_vergi_no_bicimi CHECK (vergi_no ~ '^[0-9]{10,11}$');

-- Tip değişikliği mevcut kayıtlarla çelişemez: ürünü, tedarikçi kullanıcısı ya da satıcısı
-- olduğu siparişi olan firma "alıcı" yapılamaz; alıcı kullanıcısı ya da alıcısı olduğu
-- siparişi olan firma "tedarikçi" yapılamaz.
CREATE FUNCTION firma_tip_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tip = OLD.tip THEN
    RETURN NEW;
  END IF;
  IF NEW.tip = 'alici' AND (
       EXISTS (SELECT 1 FROM "urun" WHERE firma_id = OLD.id)
    OR EXISTS (SELECT 1 FROM "kullanici" WHERE firma_id = OLD.id AND rol = 'tedarikci')
    OR EXISTS (SELECT 1 FROM "siparis" WHERE satici_firma_id = OLD.id)
  ) THEN
    RAISE EXCEPTION 'Firma #% ürünü, tedarikçi kullanıcısı ya da satıcı siparişi olduğu için "alıcı" yapılamaz.', OLD.id;
  END IF;
  IF NEW.tip = 'tedarikci' AND (
       EXISTS (SELECT 1 FROM "kullanici" WHERE firma_id = OLD.id AND rol = 'alici')
    OR EXISTS (SELECT 1 FROM "siparis" WHERE alici_firma_id = OLD.id)
  ) THEN
    RAISE EXCEPTION 'Firma #% alıcı kullanıcısı ya da alıcı siparişi olduğu için "tedarikçi" yapılamaz.', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER firma_tip_kurali
  BEFORE UPDATE OF tip ON "firma"
  FOR EACH ROW EXECUTE FUNCTION firma_tip_kurali();

-- Sipariş durum akışı, donma noktaları ve toplam-satır tutarlılığı.
-- Uygulama tarafındaki karşılığı: lib/siparis-durum.ts. Buradaki kurallar son savunma hattıdır.

-------------------------------------------------------------------------------
-- 1. Sipariş güncelleme kuralı
-------------------------------------------------------------------------------
CREATE FUNCTION siparis_guncelleme_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_sira_eski integer := array_position(enum_range(NULL::siparis_durum), OLD.durum);
  v_sira_yeni integer := array_position(enum_range(NULL::siparis_durum), NEW.durum);
  v_odenen numeric(18, 2);
BEGIN
  -- İptal edilmiş sipariş dondurulmuştur; iptal geri alınamaz.
  IF OLD.iptal_mi THEN
    RAISE EXCEPTION 'Sipariş #% iptal edilmiş; değiştirilemez.', OLD.id;
  END IF;

  -- Durum yalnız bir adım ileri gider.
  IF NEW.durum <> OLD.durum THEN
    IF v_sira_yeni <> v_sira_eski + 1 THEN
      RAISE EXCEPTION 'Sipariş #%: "%" durumundan "%" durumuna geçilemez (yalnız bir adım ileri).',
        OLD.id, OLD.durum, NEW.durum;
    END IF;

    IF NEW.durum = 'sevk_edildi'
       AND (NEW.fatura_no IS NULL OR btrim(NEW.fatura_no) = '' OR NEW.fatura_tutar IS NULL) THEN
      RAISE EXCEPTION 'Sipariş #%: "sevk edildi" için fatura no ve fatura tutarı zorunlu.', OLD.id;
    END IF;

    -- Alıcı onayı yalnız kullanılmış bir onay kaydıyla (onay sayfası) verilir.
    IF NEW.durum = 'alici_onayladi'
       AND NOT EXISTS (SELECT 1 FROM "onay" WHERE siparis_id = OLD.id AND kullanildi_mi) THEN
      RAISE EXCEPTION 'Sipariş #%: alıcı onayı yalnız alıcının onay bağlantısından verilir.', OLD.id;
    END IF;

    -- Ödendi: iptal edilmemiş ödemeler fatura tutarını (yoksa genel toplamı) karşılamalı.
    IF NEW.durum = 'odendi' THEN
      SELECT COALESCE(SUM(tutar), 0) INTO v_odenen FROM "odeme" WHERE siparis_id = OLD.id AND NOT iptal_mi;
      IF v_odenen < COALESCE(NEW.fatura_tutar, NEW.genel_toplam) THEN
        RAISE EXCEPTION 'Sipariş #%: ödenen % < fatura tutarı %; "ödendi" verilemez.',
          OLD.id, v_odenen, COALESCE(NEW.fatura_tutar, NEW.genel_toplam);
      END IF;
    END IF;
  END IF;

  -- Donma 1: "girildi" sonrasında taraflar, tarih, ödeme koşulları, tutarlar ve komisyon değişmez.
  IF OLD.durum <> 'girildi' AND (
       NEW.alici_firma_id  IS DISTINCT FROM OLD.alici_firma_id
    OR NEW.satici_firma_id IS DISTINCT FROM OLD.satici_firma_id
    OR NEW.tarih           IS DISTINCT FROM OLD.tarih
    OR NEW.odeme_tipi      IS DISTINCT FROM OLD.odeme_tipi
    OR NEW.vade_gun        IS DISTINCT FROM OLD.vade_gun
    OR NEW.vade_tarihi     IS DISTINCT FROM OLD.vade_tarihi
    OR NEW.ara_toplam      IS DISTINCT FROM OLD.ara_toplam
    OR NEW.kdv_toplam      IS DISTINCT FROM OLD.kdv_toplam
    OR NEW.genel_toplam    IS DISTINCT FROM OLD.genel_toplam
    OR NEW.komisyon_oran   IS DISTINCT FROM OLD.komisyon_oran
    OR NEW.komisyon_tutar  IS DISTINCT FROM OLD.komisyon_tutar
  ) THEN
    RAISE EXCEPTION 'Sipariş #% "%" durumunda; taraflar, vade, tutarlar ve komisyon yalnız "girildi" iken değişir.',
      OLD.id, OLD.durum;
  END IF;

  -- Donma 2: alıcı onayından sonra fatura bilgisi değişmez (alıcı o tutarı onayladı).
  IF v_sira_eski >= array_position(enum_range(NULL::siparis_durum), 'alici_onayladi'::siparis_durum) AND (
       NEW.fatura_no     IS DISTINCT FROM OLD.fatura_no
    OR NEW.fatura_tarihi IS DISTINCT FROM OLD.fatura_tarihi
    OR NEW.fatura_tutar  IS DISTINCT FROM OLD.fatura_tutar
  ) THEN
    RAISE EXCEPTION 'Sipariş #%: alıcı onayından sonra fatura bilgisi değiştirilemez.', OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER siparis_guncelleme_kurali
  BEFORE UPDATE ON "siparis"
  FOR EACH ROW EXECUTE FUNCTION siparis_guncelleme_kurali();

-- Yeni sipariş "girildi" olarak ve iptalsiz doğar.
ALTER TABLE "siparis"
  ADD CONSTRAINT siparis_odeme_tarihi_yalniz_odendi CHECK ((odeme_tarihi IS NOT NULL) = (durum = 'odendi'));

CREATE FUNCTION siparis_ekleme_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.durum <> 'girildi' OR NEW.iptal_mi THEN
    RAISE EXCEPTION 'Sipariş "girildi" durumunda ve iptalsiz oluşturulur.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER siparis_ekleme_kurali
  BEFORE INSERT ON "siparis"
  FOR EACH ROW EXECUTE FUNCTION siparis_ekleme_kurali();

-------------------------------------------------------------------------------
-- 2. Toplam-satır tutarlılığı (transaction sonunda denetlenir)
--    ara_toplam = iptal edilmemiş satırların satir_toplam toplamı
--    kdv_toplam = iptal edilmemiş satırların kdv_tutar toplamı
--    (genel_toplam = ara + kdv zaten CHECK ile zorunlu.) Yuvarlama yok, yalnız toplama.
-------------------------------------------------------------------------------
CREATE FUNCTION siparis_toplam_tutarliligi_denetle(p_siparis_id integer) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_ara numeric(18, 2);
  v_kdv numeric(18, 2);
  v_satir_ara numeric(18, 2);
  v_satir_kdv numeric(18, 2);
BEGIN
  SELECT ara_toplam, kdv_toplam INTO v_ara, v_kdv FROM "siparis" WHERE id = p_siparis_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT COALESCE(SUM(satir_toplam), 0), COALESCE(SUM(kdv_tutar), 0) INTO v_satir_ara, v_satir_kdv
    FROM "siparis_satir" WHERE siparis_id = p_siparis_id AND NOT iptal_mi;
  IF v_ara <> v_satir_ara OR v_kdv <> v_satir_kdv THEN
    RAISE EXCEPTION 'Sipariş #% toplamları satırlarla tutarsız: ara % / satırlar %, KDV % / satırlar %.',
      p_siparis_id, v_ara, v_satir_ara, v_kdv, v_satir_kdv;
  END IF;
END;
$$;

CREATE FUNCTION siparis_toplam_tetik() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM siparis_toplam_tutarliligi_denetle(NEW.id);
  RETURN NULL;
END;
$$;

CREATE FUNCTION siparis_satir_toplam_tetik() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM siparis_toplam_tutarliligi_denetle(NEW.siparis_id);
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER siparis_toplam_tutarliligi
  AFTER INSERT OR UPDATE ON "siparis"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION siparis_toplam_tetik();

CREATE CONSTRAINT TRIGGER siparis_satir_toplam_tutarliligi
  AFTER INSERT OR UPDATE ON "siparis_satir"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION siparis_satir_toplam_tetik();

-------------------------------------------------------------------------------
-- 3. Onay bağlantısı yalnız "sevk edildi" durumundaki, iptal edilmemiş siparişe üretilir.
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION onay_yeni_baglanti_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_durum siparis_durum;
  v_iptal boolean;
BEGIN
  IF NEW.kullanildi_mi OR NEW.onay_zamani IS NOT NULL OR NEW.onaylanan_tutar IS NOT NULL
     OR NEW.onaylanan_kalemler IS NOT NULL OR NEW.iptal_zamani IS NOT NULL THEN
    RAISE EXCEPTION 'Onay bağlantısı kullanılmamış ve geçerli olarak oluşturulur.';
  END IF;
  SELECT durum, iptal_mi INTO v_durum, v_iptal FROM "siparis" WHERE id = NEW.siparis_id;
  IF v_iptal THEN
    RAISE EXCEPTION 'Sipariş #% iptal edilmiş; onay bağlantısı üretilemez.', NEW.siparis_id;
  END IF;
  IF EXISTS (SELECT 1 FROM "onay" WHERE siparis_id = NEW.siparis_id AND kullanildi_mi) THEN
    RAISE EXCEPTION 'Sipariş #% alıcı tarafından zaten onaylanmış; yeni bağlantı üretilemez.', NEW.siparis_id;
  END IF;
  IF v_durum IS DISTINCT FROM 'sevk_edildi' THEN
    RAISE EXCEPTION 'Sipariş #% "%" durumunda; onay bağlantısı yalnız "sevk edildi" durumunda üretilir.',
      NEW.siparis_id, v_durum;
  END IF;
  UPDATE "onay" SET iptal_zamani = now()
   WHERE siparis_id = NEW.siparis_id AND NOT kullanildi_mi AND iptal_zamani IS NULL;
  RETURN NEW;
END;
$$;

-------------------------------------------------------------------------------
-- 4. Ödeme: iptal edilmiş siparişe girilmez; "ödendi" siparişin ödemesi iptal edilmez/değişmez.
-------------------------------------------------------------------------------
CREATE FUNCTION odeme_siparis_durum_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_durum siparis_durum;
  v_iptal boolean;
BEGIN
  SELECT durum, iptal_mi INTO v_durum, v_iptal FROM "siparis" WHERE id = NEW.siparis_id;
  IF TG_OP = 'INSERT' THEN
    IF v_iptal THEN
      RAISE EXCEPTION 'Sipariş #% iptal edilmiş; ödeme bildirimi girilemez.', NEW.siparis_id;
    END IF;
    IF NEW.iptal_mi THEN
      RAISE EXCEPTION 'Ödeme iptal edilmiş olarak girilemez.';
    END IF;
  ELSE
    IF OLD.iptal_mi THEN
      RAISE EXCEPTION 'İptal edilmiş ödeme (#%) değiştirilemez.', OLD.id;
    END IF;
    IF v_durum = 'odendi' THEN
      RAISE EXCEPTION 'Sipariş #% kapandı ("ödendi"); ödeme kaydı değiştirilemez.', NEW.siparis_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER odeme_siparis_durum_kurali
  BEFORE INSERT OR UPDATE ON "odeme"
  FOR EACH ROW EXECUTE FUNCTION odeme_siparis_durum_kurali();

-- Elle yazılmış kısıtlar ve tetikleyiciler.
-- Prisma şeması CHECK kısıtı ve tetikleyiciyi ifade edemediği için bu dosyada durur.
-- Hatalar varsayılan RAISE kodunu (P0001) kullanır: Prisma bu kodda mesajı olduğu gibi iletir
-- (23xxx kodları Prisma tarafından genel kısıt hatası diye yeniden adlandırılıyor).
-- Uygulama katmanı (lib/db.ts, lib/scope.ts) aynı kuralları ayrıca uygular;
-- bu dosya son savunma hattıdır: uygulamayı atlayan bir sorgu da buraya takılır.

-------------------------------------------------------------------------------
-- 1. Silme yasağı: hiçbir tabloda DELETE çalışmaz.
--    (DROP / TRUNCATE satır tetikleyicisini çalıştırmaz; `prisma migrate reset`
--    ve testlerdeki TRUNCATE temizliği bu yüzden etkilenmez.)
-------------------------------------------------------------------------------
CREATE FUNCTION silme_yasak() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Kayıt silinemez (%). Silmek yerine iptal işaretleyin.', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER firma_silme_yasak         BEFORE DELETE ON "firma"         FOR EACH ROW EXECUTE FUNCTION silme_yasak();
CREATE TRIGGER kullanici_silme_yasak     BEFORE DELETE ON "kullanici"     FOR EACH ROW EXECUTE FUNCTION silme_yasak();
CREATE TRIGGER urun_silme_yasak          BEFORE DELETE ON "urun"          FOR EACH ROW EXECUTE FUNCTION silme_yasak();
CREATE TRIGGER siparis_silme_yasak       BEFORE DELETE ON "siparis"       FOR EACH ROW EXECUTE FUNCTION silme_yasak();
CREATE TRIGGER siparis_satir_silme_yasak BEFORE DELETE ON "siparis_satir" FOR EACH ROW EXECUTE FUNCTION silme_yasak();
CREATE TRIGGER odeme_silme_yasak         BEFORE DELETE ON "odeme"         FOR EACH ROW EXECUTE FUNCTION silme_yasak();
CREATE TRIGGER onay_silme_yasak          BEFORE DELETE ON "onay"          FOR EACH ROW EXECUTE FUNCTION silme_yasak();
CREATE TRIGGER denetim_kaydi_silme_yasak BEFORE DELETE ON "denetim_kaydi" FOR EACH ROW EXECUTE FUNCTION silme_yasak();

-------------------------------------------------------------------------------
-- 2. Denetim kaydı yalnız eklenir, değiştirilmez.
-------------------------------------------------------------------------------
CREATE FUNCTION denetim_kaydi_degistirilemez() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Denetim kaydı değiştirilemez.';
END;
$$;

CREATE TRIGGER denetim_kaydi_guncelleme_yasak
  BEFORE UPDATE ON "denetim_kaydi"
  FOR EACH ROW EXECUTE FUNCTION denetim_kaydi_degistirilemez();

-------------------------------------------------------------------------------
-- 3. Onay kaydı: kimlik alanları hiç değişmez; kullanıldıktan sonra hiçbir alan değişmez.
-------------------------------------------------------------------------------
CREATE FUNCTION onay_degistirilemez() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.kullanildi_mi THEN
    RAISE EXCEPTION 'Kullanılmış onay kaydı değiştirilemez (onay #%).', OLD.id;
  END IF;
  IF NEW.siparis_id <> OLD.siparis_id
     OR NEW.token_hash <> OLD.token_hash
     OR NEW.olusturma <> OLD.olusturma THEN
    RAISE EXCEPTION 'Onay kaydının kimlik alanları değiştirilemez (onay #%).', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER onay_guncelleme_kurali
  BEFORE UPDATE ON "onay"
  FOR EACH ROW EXECUTE FUNCTION onay_degistirilemez();

-------------------------------------------------------------------------------
-- 4. CHECK kısıtları
-------------------------------------------------------------------------------
ALTER TABLE "kullanici"
  ADD CONSTRAINT kullanici_email_kucuk_harf CHECK (email = lower(email)),
  ADD CONSTRAINT kullanici_tedarikci_firma_zorunlu CHECK (rol <> 'tedarikci' OR firma_id IS NOT NULL);

ALTER TABLE "urun"
  ADD CONSTRAINT urun_liste_fiyat_negatif_degil CHECK (liste_fiyat >= 0),
  ADD CONSTRAINT urun_kdv_orani_aralik CHECK (kdv_orani >= 0 AND kdv_orani <= 100),
  ADD CONSTRAINT urun_koli_adedi_pozitif CHECK (koli_adedi IS NULL OR koli_adedi > 0),
  ADD CONSTRAINT urun_min_siparis_pozitif CHECK (min_siparis IS NULL OR min_siparis > 0);

ALTER TABLE "siparis"
  ADD CONSTRAINT siparis_alici_satici_farkli CHECK (alici_firma_id <> satici_firma_id),
  ADD CONSTRAINT siparis_tutarlar_negatif_degil CHECK (
    ara_toplam >= 0 AND kdv_toplam >= 0 AND genel_toplam >= 0 AND komisyon_tutar >= 0
  ),
  ADD CONSTRAINT siparis_genel_toplam_tutarli CHECK (genel_toplam = ara_toplam + kdv_toplam),
  ADD CONSTRAINT siparis_komisyon_oran_aralik CHECK (komisyon_oran >= 0 AND komisyon_oran <= 100),
  ADD CONSTRAINT siparis_vade_gun_negatif_degil CHECK (vade_gun IS NULL OR vade_gun >= 0),
  ADD CONSTRAINT siparis_vadeli_vade_tarihi_zorunlu CHECK (odeme_tipi <> 'vadeli' OR vade_tarihi IS NOT NULL),
  ADD CONSTRAINT siparis_fatura_tutar_negatif_degil CHECK (fatura_tutar IS NULL OR fatura_tutar >= 0),
  ADD CONSTRAINT siparis_iptal_nedeni_zorunlu CHECK (
    NOT iptal_mi OR (iptal_nedeni IS NOT NULL AND btrim(iptal_nedeni) <> '' AND iptal_zamani IS NOT NULL)
  );

ALTER TABLE "siparis_satir"
  ADD CONSTRAINT siparis_satir_adet_pozitif CHECK (adet > 0),
  ADD CONSTRAINT siparis_satir_adet_birimi_tamsayi CHECK (lower(birim) <> 'adet' OR adet = trunc(adet)),
  ADD CONSTRAINT siparis_satir_birim_fiyat_negatif_degil CHECK (birim_fiyat >= 0),
  ADD CONSTRAINT siparis_satir_kdv_orani_aralik CHECK (kdv_orani >= 0 AND kdv_orani <= 100),
  ADD CONSTRAINT siparis_satir_tutarlar_negatif_degil CHECK (kdv_tutar >= 0 AND satir_toplam >= 0);

ALTER TABLE "odeme"
  ADD CONSTRAINT odeme_tutar_pozitif CHECK (tutar > 0),
  ADD CONSTRAINT odeme_odeyen_alan_farkli CHECK (odeyen_firma_id <> alan_firma_id),
  ADD CONSTRAINT odeme_iptal_nedeni_zorunlu CHECK (
    NOT iptal_mi OR (iptal_nedeni IS NOT NULL AND btrim(iptal_nedeni) <> '')
  );

ALTER TABLE "onay"
  ADD CONSTRAINT onay_gecerlilik_sonra CHECK (son_gecerlilik > olusturma),
  ADD CONSTRAINT onay_kullanildiysa_kayit_tam CHECK (
    NOT kullanildi_mi
    OR (onay_zamani IS NOT NULL AND onaylanan_tutar IS NOT NULL AND onaylanan_kalemler IS NOT NULL)
  );

-------------------------------------------------------------------------------
-- 5. Firmalar arası tutarlılık (CHECK başka tabloya bakamadığı için tetikleyici)
-------------------------------------------------------------------------------

-- Tedarikçi kullanıcısının ve ürünün firması satıcı olabilmeli.
CREATE FUNCTION firma_satici_olmali(p_firma_id integer, p_baglam text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_tip firma_tip;
BEGIN
  SELECT tip INTO v_tip FROM "firma" WHERE id = p_firma_id;
  IF v_tip IS NOT NULL AND v_tip = 'alici' THEN
    RAISE EXCEPTION '% için firma #% satıcı (tedarikçi) olmalı.', p_baglam, p_firma_id;
  END IF;
END;
$$;

CREATE FUNCTION kullanici_firma_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.rol = 'tedarikci' THEN
    PERFORM firma_satici_olmali(NEW.firma_id, 'Tedarikçi kullanıcısı');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER kullanici_firma_kurali
  BEFORE INSERT OR UPDATE OF rol, firma_id ON "kullanici"
  FOR EACH ROW EXECUTE FUNCTION kullanici_firma_kurali();

CREATE FUNCTION urun_firma_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM firma_satici_olmali(NEW.firma_id, 'Ürün');
  RETURN NEW;
END;
$$;

CREATE TRIGGER urun_firma_kurali
  BEFORE INSERT OR UPDATE OF firma_id ON "urun"
  FOR EACH ROW EXECUTE FUNCTION urun_firma_kurali();

-- Siparişin alıcısı alıcı, satıcısı tedarikçi tipinde olmalı.
CREATE FUNCTION siparis_firma_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_alici_tip firma_tip;
BEGIN
  PERFORM firma_satici_olmali(NEW.satici_firma_id, 'Sipariş satıcısı');
  SELECT tip INTO v_alici_tip FROM "firma" WHERE id = NEW.alici_firma_id;
  IF v_alici_tip = 'tedarikci' THEN
    RAISE EXCEPTION 'Sipariş alıcısı firma #% alıcı tipinde olmalı.', NEW.alici_firma_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER siparis_firma_kurali
  BEFORE INSERT OR UPDATE OF alici_firma_id, satici_firma_id ON "siparis"
  FOR EACH ROW EXECUTE FUNCTION siparis_firma_kurali();

-- Satırdaki ürün, siparişin satıcısına ait olmalı.
CREATE FUNCTION siparis_satir_urun_kurali() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_urun_firma integer;
  v_satici integer;
BEGIN
  SELECT firma_id INTO v_urun_firma FROM "urun" WHERE id = NEW.urun_id;
  SELECT satici_firma_id INTO v_satici FROM "siparis" WHERE id = NEW.siparis_id;
  IF v_urun_firma IS DISTINCT FROM v_satici THEN
    RAISE EXCEPTION 'Ürün #% siparişin satıcısına (firma #%) ait değil.', NEW.urun_id, v_satici;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER siparis_satir_urun_kurali
  BEFORE INSERT OR UPDATE OF urun_id, siparis_id ON "siparis_satir"
  FOR EACH ROW EXECUTE FUNCTION siparis_satir_urun_kurali();

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "firma_tip" AS ENUM ('tedarikci', 'alici', 'her_ikisi');

-- CreateEnum
CREATE TYPE "firma_durum" AS ENUM ('aktif', 'pasif');

-- CreateEnum
CREATE TYPE "rol" AS ENUM ('admin', 'tedarikci');

-- CreateEnum
CREATE TYPE "odeme_tipi" AS ENUM ('pesin', 'vadeli');

-- CreateEnum
CREATE TYPE "siparis_durum" AS ENUM ('girildi', 'tedarikci_onayladi', 'sevk_edildi', 'alici_onayladi', 'odendi');

-- CreateEnum
CREATE TYPE "odeme_yontemi" AS ENUM ('havale_eft', 'nakit', 'cek', 'diger');

-- CreateTable
CREATE TABLE "firma" (
    "id" SERIAL NOT NULL,
    "unvan" TEXT NOT NULL,
    "vergi_no" TEXT NOT NULL,
    "tip" "firma_tip" NOT NULL,
    "durum" "firma_durum" NOT NULL DEFAULT 'aktif',
    "adres" TEXT,
    "telefon" TEXT,
    "olusturma" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "firma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kullanici" (
    "id" SERIAL NOT NULL,
    "firma_id" INTEGER,
    "email" TEXT NOT NULL,
    "parola_hash" TEXT NOT NULL,
    "rol" "rol" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturma" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "kullanici_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "urun" (
    "id" SERIAL NOT NULL,
    "firma_id" INTEGER NOT NULL,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "birim" TEXT NOT NULL,
    "koli_adedi" INTEGER,
    "min_siparis" DECIMAL(18,3),
    "liste_fiyat" DECIMAL(18,2) NOT NULL,
    "kdv_orani" DECIMAL(5,2) NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturma" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "urun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siparis" (
    "id" SERIAL NOT NULL,
    "alici_firma_id" INTEGER NOT NULL,
    "satici_firma_id" INTEGER NOT NULL,
    "tarih" DATE NOT NULL DEFAULT CURRENT_DATE,
    "odeme_tipi" "odeme_tipi" NOT NULL,
    "vade_gun" INTEGER,
    "vade_tarihi" DATE,
    "durum" "siparis_durum" NOT NULL DEFAULT 'girildi',
    "ara_toplam" DECIMAL(18,2) NOT NULL,
    "kdv_toplam" DECIMAL(18,2) NOT NULL,
    "genel_toplam" DECIMAL(18,2) NOT NULL,
    "komisyon_oran" DECIMAL(5,2) NOT NULL,
    "komisyon_tutar" DECIMAL(18,2) NOT NULL,
    "fatura_no" TEXT,
    "fatura_tarihi" DATE,
    "fatura_tutar" DECIMAL(18,2),
    "odeme_tarihi" DATE,
    "iptal_mi" BOOLEAN NOT NULL DEFAULT false,
    "iptal_nedeni" TEXT,
    "iptal_zamani" TIMESTAMPTZ(3),
    "olusturma" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "siparis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siparis_satir" (
    "id" SERIAL NOT NULL,
    "siparis_id" INTEGER NOT NULL,
    "urun_id" INTEGER NOT NULL,
    "ad" TEXT NOT NULL,
    "birim" TEXT NOT NULL,
    "adet" DECIMAL(18,3) NOT NULL,
    "birim_fiyat" DECIMAL(18,2) NOT NULL,
    "kdv_orani" DECIMAL(5,2) NOT NULL,
    "kdv_tutar" DECIMAL(18,2) NOT NULL,
    "satir_toplam" DECIMAL(18,2) NOT NULL,
    "olusturma" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "siparis_satir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odeme" (
    "id" SERIAL NOT NULL,
    "siparis_id" INTEGER NOT NULL,
    "odeyen_firma_id" INTEGER NOT NULL,
    "alan_firma_id" INTEGER NOT NULL,
    "tutar" DECIMAL(18,2) NOT NULL,
    "tarih" DATE NOT NULL,
    "yontem" "odeme_yontemi" NOT NULL,
    "not" TEXT,
    "iptal_mi" BOOLEAN NOT NULL DEFAULT false,
    "iptal_nedeni" TEXT,
    "olusturma" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "odeme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onay" (
    "id" SERIAL NOT NULL,
    "siparis_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "olusturma" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "son_gecerlilik" TIMESTAMPTZ(3) NOT NULL,
    "kullanildi_mi" BOOLEAN NOT NULL DEFAULT false,
    "onay_zamani" TIMESTAMPTZ(3),
    "onaylanan_tutar" DECIMAL(18,2),
    "onaylanan_kalemler" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "onay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denetim_kaydi" (
    "id" SERIAL NOT NULL,
    "zaman" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kullanici_id" INTEGER,
    "islem" TEXT NOT NULL,
    "tablo" TEXT NOT NULL,
    "kayit_id" INTEGER NOT NULL,
    "eski" JSONB,
    "yeni" JSONB,
    "ip" TEXT,

    CONSTRAINT "denetim_kaydi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "firma_vergi_no_key" ON "firma"("vergi_no");

-- CreateIndex
CREATE UNIQUE INDEX "kullanici_email_key" ON "kullanici"("email");

-- CreateIndex
CREATE INDEX "kullanici_firma_id_idx" ON "kullanici"("firma_id");

-- CreateIndex
CREATE UNIQUE INDEX "urun_firma_id_kod_key" ON "urun"("firma_id", "kod");

-- CreateIndex
CREATE INDEX "siparis_alici_firma_id_idx" ON "siparis"("alici_firma_id");

-- CreateIndex
CREATE INDEX "siparis_durum_idx" ON "siparis"("durum");

-- CreateIndex
CREATE INDEX "siparis_tarih_idx" ON "siparis"("tarih");

-- CreateIndex
CREATE UNIQUE INDEX "siparis_satici_firma_id_fatura_no_key" ON "siparis"("satici_firma_id", "fatura_no");

-- CreateIndex
CREATE INDEX "siparis_satir_siparis_id_idx" ON "siparis_satir"("siparis_id");

-- CreateIndex
CREATE INDEX "siparis_satir_urun_id_idx" ON "siparis_satir"("urun_id");

-- CreateIndex
CREATE INDEX "odeme_siparis_id_idx" ON "odeme"("siparis_id");

-- CreateIndex
CREATE UNIQUE INDEX "onay_token_hash_key" ON "onay"("token_hash");

-- CreateIndex
CREATE INDEX "onay_siparis_id_idx" ON "onay"("siparis_id");

-- CreateIndex
CREATE INDEX "denetim_kaydi_tablo_kayit_id_idx" ON "denetim_kaydi"("tablo", "kayit_id");

-- CreateIndex
CREATE INDEX "denetim_kaydi_zaman_idx" ON "denetim_kaydi"("zaman");

-- AddForeignKey
ALTER TABLE "kullanici" ADD CONSTRAINT "kullanici_firma_id_fkey" FOREIGN KEY ("firma_id") REFERENCES "firma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "urun" ADD CONSTRAINT "urun_firma_id_fkey" FOREIGN KEY ("firma_id") REFERENCES "firma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siparis" ADD CONSTRAINT "siparis_alici_firma_id_fkey" FOREIGN KEY ("alici_firma_id") REFERENCES "firma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siparis" ADD CONSTRAINT "siparis_satici_firma_id_fkey" FOREIGN KEY ("satici_firma_id") REFERENCES "firma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siparis_satir" ADD CONSTRAINT "siparis_satir_siparis_id_fkey" FOREIGN KEY ("siparis_id") REFERENCES "siparis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siparis_satir" ADD CONSTRAINT "siparis_satir_urun_id_fkey" FOREIGN KEY ("urun_id") REFERENCES "urun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odeme" ADD CONSTRAINT "odeme_siparis_id_fkey" FOREIGN KEY ("siparis_id") REFERENCES "siparis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odeme" ADD CONSTRAINT "odeme_odeyen_firma_id_fkey" FOREIGN KEY ("odeyen_firma_id") REFERENCES "firma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odeme" ADD CONSTRAINT "odeme_alan_firma_id_fkey" FOREIGN KEY ("alan_firma_id") REFERENCES "firma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onay" ADD CONSTRAINT "onay_siparis_id_fkey" FOREIGN KEY ("siparis_id") REFERENCES "siparis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denetim_kaydi" ADD CONSTRAINT "denetim_kaydi_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;


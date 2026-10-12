-- CreateTable
CREATE TABLE "urun" (
    "id" SERIAL NOT NULL,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "kategori" TEXT,
    "fotograf_url" TEXT,
    "birim" TEXT NOT NULL DEFAULT 'adet',
    "koli_adedi" INTEGER,
    "min_siparis" DECIMAL(18,3),
    "liste_fiyat" DECIMAL(18,2) NOT NULL,
    "kdv_orani" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturma" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "urun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "urun_kod_key" ON "urun"("kod");

-- CreateIndex
CREATE INDEX "urun_kategori_idx" ON "urun"("kategori");

-- CreateIndex
CREATE INDEX "urun_aktif_idx" ON "urun"("aktif");

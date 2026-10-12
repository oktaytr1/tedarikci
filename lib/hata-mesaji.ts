// Sunucu hatalarını kullanıcıya gösterilecek Türkçe mesaja çevirir.
// Beklenmeyen hatalar ayrıntı sızdırmaz: genel mesaj döner, ayrıntı sunucu günlüğüne yazılır.

import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ParaHatasi } from "@/lib/money";
import { YetkiHatasi } from "@/lib/scope-cekirdek";
import { IslemHatasi } from "@/lib/siparis-islemleri";

const TEKIL_KISIT: Record<string, string> = {
  firma_vergi_no_key: "Bu vergi numarası başka bir firmada kayıtlı.",
  kullanici_email_key: "Bu e-posta adresi başka bir kullanıcıda kayıtlı.",
  urun_firma_id_kod_key: "Bu tedarikçide aynı ürün kodu zaten var.",
  siparis_satici_firma_id_fatura_no_key: "Bu fatura numarası bu tedarikçinin başka bir siparişinde kayıtlı.",
  onay_siparis_tek_gecerli: "Bu sipariş için aynı anda başka bir onay bağlantısı üretildi; sayfayı yenileyin.",
  onay_siparis_tek_kullanilmis: "Bu sipariş zaten alıcı tarafından onaylanmış.",
};

const CHECK_KISIT: Record<string, string> = {
  siparis_alici_satici_farkli: "Alıcı ve tedarikçi aynı firma olamaz.",
  siparis_vadeli_vade_tarihi_zorunlu: "Vadeli siparişte vade zorunlu.",
  siparis_satir_adet_birimi_tamsayi: '"Adet" biriminde miktar tamsayı olmalı.',
  kullanici_tedarikci_firma_zorunlu: "Tedarikçi kullanıcısı bir firmaya bağlı olmalı.",
  kullanici_email_kucuk_harf: "E-posta küçük harfle kaydedilir.",
  urun_kdv_orani_aralik: "KDV oranı 0 ile 100 arasında olmalı.",
  odeme_tutar_pozitif: "Ödeme tutarı sıfırdan büyük olmalı.",
};

export function hataMesaji(e: unknown): string {
  if (e instanceof IslemHatasi || e instanceof ParaHatasi || e instanceof YetkiHatasi) return e.message;
  if (e instanceof ZodError) return e.issues.map((i) => i.message).join(" ");
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = e.meta as
      | { driverAdapterError?: { cause?: { originalCode?: string; originalMessage?: string; constraint?: { index?: string } } } }
      | undefined;
    const neden = meta?.driverAdapterError?.cause;
    if (neden?.originalCode === "P0001" && neden.originalMessage) return neden.originalMessage;
    if (e.code === "P2002" || neden?.originalCode === "23505") {
      const kisit = neden?.constraint?.index ?? "";
      return TEKIL_KISIT[kisit] ?? "Bu kayıt zaten var (tekillik kuralı).";
    }
    if (neden?.originalCode === "23514") {
      const kisit = /check constraint "([^"]+)"/.exec(neden.originalMessage ?? "")?.[1] ?? "";
      return CHECK_KISIT[kisit] ?? `Veri kuralına aykırı (${kisit || "kısıt"}).`;
    }
    if (e.code === "P2025") return "Kayıt bulunamadı ya da erişim yetkiniz yok.";
  }
  console.error("[beklenmeyen hata]", e);
  return "Beklenmeyen bir hata oluştu. İşlem kaydedilmedi.";
}

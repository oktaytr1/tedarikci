// İletişim bilgileri: TEK kaynak. Numara değişirse yalnız burası güncellenir.

export const SITE_ADRESI = "https://tedarikcim.net.tr";

export const WHATSAPP_NUMARASI = "905012542020";
export const TELEFON_GORUNEN = "0501 254 20 20";
export const TELEFON_ADRESI = "tel:+905012542020";

export function whatsAppAdresi(mesaj: string): string {
  return `https://wa.me/${WHATSAPP_NUMARASI}?text=${encodeURIComponent(mesaj)}`;
}

export const MESAJLAR = {
  genel: "Merhaba, tedarikcim.net.tr hakkında bilgi almak istiyorum.",
} as const;

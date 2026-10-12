// Platform (admin) iletişim bilgisi: tedarikçi ürün düzeltmesi için buraya başvurur.
// Değerler ortam değişkeninden okunur; tanımlı değilse ekranda genel yönlendirme gösterilir.

import "server-only";

export function platformIletisim(): { eposta: string | null; telefon: string | null } {
  const eposta = process.env.PLATFORM_ILETISIM_EPOSTA?.trim() || null;
  const telefon = process.env.PLATFORM_ILETISIM_TELEFON?.trim() || null;
  return { eposta, telefon };
}

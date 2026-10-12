// Server action dönüşleri: alan bazında hatalar formun ilgili alanında gösterilir.

import "server-only";
import { hataMesaji } from "@/lib/hata-mesaji";
import { GirisHatasi } from "@/lib/hatalar";
import type { EylemSonucu } from "@/components/admin/tipler";

export function hataSonucu(e: unknown): EylemSonucu {
  if (e instanceof GirisHatasi) return { hata: e.message, alanlar: e.alanlar };
  return { hata: hataMesaji(e) };
}

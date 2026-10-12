// Admin eylem yardımcıları (server action'lar tarafından kullanılır).

import { hataMesaji } from "@/lib/hata-mesaji";
import type { EylemSonucu } from "@/components/admin/tipler";

export class GirisHatasi extends Error {
  alanlar: Record<string, string>;
  constructor(alanlar: Record<string, string>) {
    const ilk = Object.values(alanlar)[0] ?? "Giriş hatası.";
    super(ilk);
    this.name = "GirisHatasi";
    this.alanlar = alanlar;
  }
}

export function hataSonucu(e: unknown): EylemSonucu {
  if (e instanceof GirisHatasi) return { hata: e.message, alanlar: e.alanlar };
  return { hata: hataMesaji(e) };
}

export function alanHatasi(err: import("zod").ZodError): GirisHatasi {
  const alanlar: Record<string, string> = {};
  for (const i of err.issues) {
    const ad = i.path[0]?.toString();
    if (ad && !alanlar[ad]) alanlar[ad] = i.message;
  }
  return new GirisHatasi(alanlar);
}

export function metinVeyaNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

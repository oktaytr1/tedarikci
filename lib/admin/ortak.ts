// Admin servislerinin ortak yardımcıları.

import type { ZodError } from "zod";
import { GirisHatasi } from "@/lib/hatalar";
import { YetkiHatasi, type Aktor } from "@/lib/scope-cekirdek";

/** Servis düzeyinde ikinci kontrol: server action'daki rol şartına ek (savunma derinliği). */
export function adminGerekli(aktor: Aktor): asserts aktor is Extract<Aktor, { tip: "admin" }> {
  if (aktor.tip !== "admin") throw new YetkiHatasi("Bu işlemi yalnız admin yapabilir.");
}

/** zod hatalarını alan bazında GirisHatasi'na çevirir (her alan için ilk mesaj). */
export function alanHatasi(e: ZodError): GirisHatasi {
  const alanlar: Record<string, string> = {};
  for (const i of e.issues) alanlar[i.path.join(".") || "genel"] ??= i.message;
  return new GirisHatasi(alanlar);
}

/** Baş/son boşluk kırpılır; boş metin NULL olur. */
export function metinVeyaNull(s: string | null | undefined): string | null {
  const t = (s ?? "").trim();
  return t === "" ? null : t;
}

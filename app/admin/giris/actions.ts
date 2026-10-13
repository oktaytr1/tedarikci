"use server";

import { headers } from "next/headers";
import { adminGiris, adminCikis } from "@/lib/admin-auth";
import { basariliGiris, basarisizGiris, girisEngeli } from "@/lib/giris-siniri";

async function istemciAdresi(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "bilinmiyor";
}

export async function girisYap(sifre: string): Promise<{ hata?: string }> {
  const ip = await istemciAdresi();
  const bekle = girisEngeli(ip);
  if (bekle > 0) return { hata: `Çok fazla hatalı deneme. ${Math.ceil(bekle / 60)} dakika sonra tekrar deneyin.` };

  const basarili = await adminGiris(sifre);
  if (!basarili) {
    basarisizGiris(ip);
    return { hata: "Şifre yanlış." };
  }
  basariliGiris(ip);
  return {};
}

export async function cikisYap(): Promise<void> {
  await adminCikis();
}

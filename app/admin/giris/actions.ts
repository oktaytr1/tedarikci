"use server";

import { adminGiris, adminCikis } from "@/lib/admin-auth";

export async function girisYap(sifre: string): Promise<{ hata?: string }> {
  const basarili = await adminGiris(sifre);
  if (!basarili) return { hata: "Şifre yanlış." };
  return {};
}

export async function cikisYap(): Promise<void> {
  await adminCikis();
}

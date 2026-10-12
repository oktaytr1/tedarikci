"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type GirisDurumu = { hata?: string };

export async function girisYap(_onceki: GirisDurumu, form: FormData): Promise<GirisDurumu> {
  try {
    await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      parola: String(form.get("parola") ?? ""),
      redirectTo: "/",
    });
    return {};
  } catch (e) {
    // Başarılı girişte signIn yönlendirme hatası fırlatır; o yeniden fırlatılmalı.
    if (e instanceof AuthError) return { hata: "E-posta veya parola hatalı." };
    throw e;
  }
}

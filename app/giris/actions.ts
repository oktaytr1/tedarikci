"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { aktorCoz } from "@/lib/oturum-cozumu";

export type GirisDurumu = { hata?: string };

const ROL_ALANI = { admin: "/admin", tedarikci: "/tedarikci", alici: "/katalog" } as const;

export async function girisYap(_onceki: GirisDurumu, form: FormData): Promise<GirisDurumu> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  try {
    await signIn("credentials", { email, parola: String(form.get("parola") ?? ""), redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { hata: "E-posta veya parola hatalı." };
    throw e;
  }
  // Doğrudan rol alanına: "/" ara durağı, oradaki yönlendirme geç tamamlanınca kullanıcının ilk
  // filtre/arama gezinmesini eziyordu.
  const k = await db.kullanici.findUnique({ where: { email }, select: { id: true } });
  const aktor = k ? await aktorCoz(k.id) : null;
  redirect(aktor ? ROL_ALANI[aktor.tip] : "/");
}

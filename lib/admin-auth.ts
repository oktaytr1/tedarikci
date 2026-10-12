import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "admin_oturum";
const OTURUM_SURESI = 8 * 60 * 60;

function oturumAnahtari(): string {
  const anahtar = process.env.ADMIN_SESSION_SECRET;
  if (!anahtar || Buffer.byteLength(anahtar, "utf8") < 32) {
    throw new Error("ADMIN_SESSION_SECRET en az 32 bayt olmalı.");
  }
  return anahtar;
}

function guvenliEsit(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

function imzala(sure: string): string {
  return createHmac("sha256", oturumAnahtari()).update(sure).digest("hex");
}

export function adminSifresi(): string {
  const sifre = process.env.ADMIN_PASSWORD;
  if (!sifre || sifre.length < 16) throw new Error("ADMIN_PASSWORD en az 16 karakter olmalı.");
  return sifre;
}

export async function adminGiris(girdi: unknown): Promise<boolean> {
  if (typeof girdi !== "string" || girdi.length > 1024 || !guvenliEsit(girdi, adminSifresi())) return false;

  const son = String(Math.floor(Date.now() / 1000) + OTURUM_SURESI);
  const store = await cookies();
  store.set(ADMIN_COOKIE, `${son}.${imzala(son)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OTURUM_SURESI,
    path: "/",
  });
  return true;
}

export async function adminCikis(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function adminOturumVarMi(): Promise<boolean> {
  const cookie = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;

  const ayirac = cookie.indexOf(".");
  if (ayirac < 1) return false;
  const son = cookie.slice(0, ayirac);
  const imza = cookie.slice(ayirac + 1);
  if (!/^\d{10}$/.test(son) || !/^[a-f0-9]{64}$/.test(imza)) return false;
  if (Number(son) <= Math.floor(Date.now() / 1000)) return false;
  return guvenliEsit(imza, imzala(son));
}

export async function adminKontrol(): Promise<void> {
  if (!(await adminOturumVarMi())) redirect("/admin/giris");
}

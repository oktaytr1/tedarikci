// Auth.js: yalnız admin ve tedarikçi kullanıcıları için e-posta + parola girişi.
// Alıcı için oturum yoktur; alıcı yalnız tek kullanımlık onay bağlantısıyla işlem yapar.
//
// Oturum JWT'dir (ayrı oturum tablosu yok). JWT yalnız kullanıcı kimliğini taşır;
// rol, aktiflik ve firma her istekte veritabanından okunur (lib/oturum-cozumu.ts).

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db";
import { aktorCoz } from "@/lib/oturum-cozumu";
import { SAHTE_HASH, parolaDogrula } from "@/lib/password";

const girisSemasi = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  parola: z.string().min(1).max(200),
});

// Basit kaba kuvvet freni: aynı e-posta için 15 dakikada 5 hatalı deneme.
// Tek Node süreci için yeterli (mimari: tek uygulama sunucusu).
const PENCERE_MS = 15 * 60 * 1000;
const EN_FAZLA_HATA = 5;
const hatalar = new Map<string, { sayi: number; bitis: number }>();

function kilitliMi(anahtar: string): boolean {
  const k = hatalar.get(anahtar);
  if (!k) return false;
  if (Date.now() > k.bitis) {
    hatalar.delete(anahtar);
    return false;
  }
  return k.sayi >= EN_FAZLA_HATA;
}

function hataKaydet(anahtar: string): void {
  const simdi = Date.now();
  const k = hatalar.get(anahtar);
  if (!k || simdi > k.bitis) hatalar.set(anahtar, { sayi: 1, bitis: simdi + PENCERE_MS });
  else k.sayi += 1;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/giris" },
  providers: [
    Credentials({
      credentials: { email: {}, parola: {} },
      async authorize(girdi) {
        const sonuc = girisSemasi.safeParse(girdi);
        if (!sonuc.success) return null;
        const { email, parola } = sonuc.data;
        if (kilitliMi(email)) return null;

        const k = await db.kullanici.findUnique({
          where: { email },
          select: { id: true, email: true, parola_hash: true },
        });
        // Kullanıcı yoksa da hash karşılaştırması yapılır: yanıt süresi e-postanın varlığını ele vermesin.
        const dogru = await parolaDogrula(parola, k?.parola_hash ?? SAHTE_HASH);
        if (!k || !dogru) {
          hataKaydet(email);
          return null;
        }
        // Pasif kullanıcı, pasif firma veya rol/firma tutarsızlığı: giriş yok.
        if (!(await aktorCoz(k.id))) return null;

        hatalar.delete(email);
        return { id: String(k.id), email: k.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

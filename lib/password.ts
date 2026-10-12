import bcrypt from "bcryptjs";

export const PAROLA_EN_AZ = 12;
const MALIYET = 12;

export function parolaKuraliHatasi(parola: string): string | null {
  if (parola.length < PAROLA_EN_AZ) return `Parola en az ${PAROLA_EN_AZ} karakter olmalı.`;
  return null;
}

export function parolaHashle(parola: string): Promise<string> {
  const hata = parolaKuraliHatasi(parola);
  if (hata) throw new Error(hata);
  return bcrypt.hash(parola, MALIYET);
}

export function parolaDogrula(parola: string, hash: string): Promise<boolean> {
  return bcrypt.compare(parola, hash);
}

// Kullanıcı bulunamadığında da aynı sürede cevap vermek için karşılaştırılan sahte hash.
export const SAHTE_HASH = "$2b$12$rp56Wd8.ySRBBFCQL5mnT.UDzI3KYiNOUwDPWwtUEU8ZtYiCapMUa";

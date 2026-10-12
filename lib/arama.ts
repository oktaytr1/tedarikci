// Türkçe duyarlı, aksan duyarsız arama: "gida" → "Gıda", "SUT" → "Süt".

const HARF: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

export function aramaNormalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, (h) => HARF[h] ?? h)
    .replace(/\s+/g, " ")
    .trim();
}

/** Sorgudaki her kelime metinde geçiyorsa eşleşir. */
export function eslesir(sorgu: string, ...alanlar: (string | null | undefined)[]): boolean {
  const q = aramaNormalize(sorgu);
  if (!q) return true;
  const metin = aramaNormalize(alanlar.filter(Boolean).join(" "));
  return q.split(" ").every((kelime) => metin.includes(kelime));
}

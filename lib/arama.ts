// Türkçe karakter ve büyük/küçük harf duyarsız arama.
//   "pecete" → "Peçete", "yogurt" → "Yoğurt", "isik" / "IŞIK" / "ışık" → "Işık", "izmir" → "İzmir"
//
// Kural veritabanındaki arama_normalize() ile AYNI olmalı (migrations/*_turkce_arama):
//   1. Aksanlar atılır (İ→I, ı→i, ç→c, ğ→g, ş→s, ö→o, ü→u, â→a …)
//   2. Sonra küçük harfe çevrilir (artık yalnız ASCII harfler kaldığı için dil kuralı gerekmez).
// tests/arama.test.ts iki tarafın aynı sonucu verdiğini veritabanında doğrular.

export function aramaNormalize(s: string): string {
  return s
    .normalize("NFD") // İ → I + birleşik nokta, ç → c + çengel …
    .replace(/\p{M}/gu, "") // birleşik işaretler atılır
    .replace(/ı/g, "i") // noktasız ı ayrışmaz: elle
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Arama sorgusunun kelimeleri (normalize edilmiş, boşlar atılmış). */
export function aramaKelimeleri(sorgu: string): string[] {
  return aramaNormalize(sorgu).split(" ").filter(Boolean);
}

/** Sorgudaki her kelime metinde geçiyorsa eşleşir (istemci tarafı süzme için). */
export function eslesir(sorgu: string, ...alanlar: (string | null | undefined)[]): boolean {
  const metin = aramaNormalize(alanlar.filter(Boolean).join(" "));
  return aramaKelimeleri(sorgu).every((kelime) => metin.includes(kelime));
}

/** Ürün sorgusu: her kelime arama_metni (kod + ad, normalize) içinde geçmeli. */
export function urunAramaKosulu(sorgu: string): object | null {
  const kelimeler = aramaKelimeleri(sorgu);
  if (kelimeler.length === 0) return null;
  return { AND: kelimeler.map((k) => ({ arama_metni: { contains: k } })) };
}

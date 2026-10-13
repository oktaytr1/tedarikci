import "server-only";

// Admin girişi için deneme sınırı: IP başına PENCERE süresinde en fazla EN_FAZLA_HATA başarısız deneme.
// Sayaçlar süreç belleğinde tutulur: tek sunucu sürecinde tam koruma sağlar; birden çok örnek ya da
// serverless ortamda her örnek kendi sayacını tutar (yine de kaba kuvveti ciddi ölçüde yavaşlatır).

const EN_FAZLA_HATA = 5;
const PENCERE_MS = 15 * 60 * 1000;
const EN_FAZLA_KAYIT = 10_000;

type Kayit = { hata: number; baslangic: number };
const kayitlar = new Map<string, Kayit>();

function guncelKayit(anahtar: string, simdi: number): Kayit | undefined {
  const k = kayitlar.get(anahtar);
  if (k && simdi - k.baslangic >= PENCERE_MS) {
    kayitlar.delete(anahtar);
    return undefined;
  }
  return k;
}

/** Engelliyse kalan bekleme süresini (saniye) döner, değilse 0. */
export function girisEngeli(anahtar: string): number {
  const simdi = Date.now();
  const k = guncelKayit(anahtar, simdi);
  if (!k || k.hata < EN_FAZLA_HATA) return 0;
  return Math.ceil((k.baslangic + PENCERE_MS - simdi) / 1000);
}

export function basarisizGiris(anahtar: string): void {
  const simdi = Date.now();
  const k = guncelKayit(anahtar, simdi);
  if (k) {
    k.hata++;
    return;
  }
  if (kayitlar.size >= EN_FAZLA_KAYIT) {
    for (const [a, v] of kayitlar) if (simdi - v.baslangic >= PENCERE_MS) kayitlar.delete(a);
    if (kayitlar.size >= EN_FAZLA_KAYIT) kayitlar.delete(kayitlar.keys().next().value!);
  }
  kayitlar.set(anahtar, { hata: 1, baslangic: simdi });
}

export function basariliGiris(anahtar: string): void {
  kayitlar.delete(anahtar);
}

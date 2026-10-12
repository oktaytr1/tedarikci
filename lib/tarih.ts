// Takvim günü (@db.Date) yardımcıları. Günler "YYYY-AA-GG" metni olarak taşınır;
// Date nesnesine yalnız UTC gece yarısı olarak çevrilir (saat dilimi kayması olmasın).

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function gecerliGunMu(ymd: string): boolean {
  if (!YMD.test(ymd)) return false;
  const d = new Date(`${ymd}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === ymd;
}

/** Prisma'ya yazılacak Date (UTC gece yarısı). */
export function gunTarih(ymd: string): Date {
  if (!gecerliGunMu(ymd)) throw new Error(`Geçersiz tarih: ${ymd}`);
  return new Date(`${ymd}T00:00:00Z`);
}

/** Prisma'dan okunan @db.Date → "YYYY-AA-GG". */
export function tarihGun(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** İstanbul saatine göre bugün. */
export function bugun(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}

export function gunEkle(ymd: string, gun: number): string {
  const d = gunTarih(ymd);
  d.setUTCDate(d.getUTCDate() + gun);
  return tarihGun(d);
}

/** Gösterim: "12.10.2026". */
export function gunYaz(x: string | Date | null | undefined): string {
  if (!x) return "—";
  const ymd = typeof x === "string" ? x : tarihGun(x);
  const [y, m, g] = ymd.split("-");
  return `${g}.${m}.${y}`;
}

/** Zaman damgası gösterimi (İstanbul): "12.10.2026 14:05". */
export function zamanYaz(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

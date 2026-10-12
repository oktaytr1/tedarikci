// Uygulama kodunun veritabanına giriş kapısı.
//
//   const vt = await kapsamliDb();                     // okuma (rol/firma filtresi zorunlu)
//   await denetimli("siparis.iptal", async (vt) => {}); // yazma (tek transaction + denetim kaydı)
//
// Aktör her zaman oturumdan çözülür; çağıran taraf aktör veremez.

import "server-only";
import { headers } from "next/headers";
import { aktorGerekli } from "@/lib/authz";
import { denetimliAktorle, kapsamliDbAktorle, type Aktor, type KapsamliDb } from "@/lib/scope-cekirdek";

export type { Aktor, KapsamliDb } from "@/lib/scope-cekirdek";
export { YetkiHatasi } from "@/lib/scope-cekirdek";

export async function kapsamliDb(...roller: Aktor["tip"][]): Promise<KapsamliDb> {
  return kapsamliDbAktorle(await aktorGerekli(...roller));
}

/**
 * Yazma kapısı. `roller` verilirse aktör bu rollerden biri olmalı (ör. yalnız admin işlemleri).
 * `fn` aktörü de alır; durum kuralları aktörün rolüne göre karar verir.
 */
export async function denetimli<T, R extends Aktor["tip"] = Aktor["tip"]>(
  islem: string,
  fn: (vt: KapsamliDb, aktor: Extract<Aktor, { tip: R }>) => Promise<T>,
  roller: R[] = [],
): Promise<T> {
  const aktor = await aktorGerekli(...roller);
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return denetimliAktorle(aktor, islem, fn, { ip });
}

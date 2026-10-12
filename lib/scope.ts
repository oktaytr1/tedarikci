// Uygulama kodunun veritabanına giriş kapısı.
//
//   const vt = await kapsamliDb();                     // okuma (rol/firma filtresi zorunlu)
//   await denetimli("siparis.iptal", async (vt) => {}); // yazma (tek transaction + denetim kaydı)
//
// Aktör her zaman oturumdan çözülür; çağıran taraf aktör veremez.

import "server-only";
import { headers } from "next/headers";
import { aktorGerekli } from "@/lib/authz";
import { denetimliAktorle, kapsamliDbAktorle, type KapsamliDb } from "@/lib/scope-cekirdek";

export type { KapsamliDb } from "@/lib/scope-cekirdek";
export { YetkiHatasi } from "@/lib/scope-cekirdek";

export async function kapsamliDb(): Promise<KapsamliDb> {
  return kapsamliDbAktorle(await aktorGerekli());
}

export async function denetimli<T>(islem: string, fn: (vt: KapsamliDb) => Promise<T>): Promise<T> {
  const aktor = await aktorGerekli();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return denetimliAktorle(aktor, islem, fn, { ip });
}

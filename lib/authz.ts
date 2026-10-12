// Sunucu tarafı yetki kontrolü. Butonu gizlemek yetki değildir: her sayfa, server action ve
// route handler buradan geçer. proxy.ts yalnız yönlendirme yapar.

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { aktorCoz } from "@/lib/oturum-cozumu";
import { YetkiHatasi, type Aktor } from "@/lib/scope-cekirdek";

/** İstek başına bir kez çözülür (React cache). Oturum yoksa ya da geçersizse null. */
export const oturumAktoru = cache(async (): Promise<Aktor | null> => {
  const oturum = await auth();
  const id = Number(oturum?.user?.id);
  return aktorCoz(id);
});

/**
 * Sayfalar için: oturum yoksa ya da rol uymuyorsa girişe yönlendirir. Her sayfa kendisi çağırır
 * (düzendeki kontrol sayfanın önceden render edilen kısmını durdurmaz). Normal kullanımda yanlış
 * alana proxy izin vermez; buraya düşen rol uyuşmazlığı bayat oturum demektir (rol değişmiş).
 */
export async function rolGerekli<R extends Aktor["tip"]>(...roller: R[]): Promise<Extract<Aktor, { tip: R }>> {
  const aktor = await oturumAktoru();
  if (!aktor) redirect("/giris");
  if (!roller.includes(aktor.tip as R)) redirect("/giris?yenile=1");
  return aktor as Extract<Aktor, { tip: R }>;
}

/** Server action ve route handler için: yönlendirme yerine hata fırlatır. */
export async function aktorGerekli<R extends Aktor["tip"]>(...roller: R[]): Promise<Extract<Aktor, { tip: R }>> {
  const aktor = await oturumAktoru();
  if (!aktor) throw new YetkiHatasi("Oturum gerekli.");
  if (roller.length && !roller.includes(aktor.tip as R)) throw new YetkiHatasi("Bu işlem için yetkiniz yok.");
  return aktor as Extract<Aktor, { tip: R }>;
}

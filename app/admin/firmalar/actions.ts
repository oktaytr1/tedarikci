"use server";

// Firma işlemleri. Yetki: denetimli(…, ["admin"]) işlemin başında; servis ayrıca denetler.

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { hataSonucu } from "@/lib/admin/eylem";
import { FIRMA_ISLEM, firmaDurumDegistir, firmaGuncelle, firmaOlustur } from "@/lib/admin/firma";
import { denetimli } from "@/lib/scope";
import type { EylemSonucu } from "@/components/admin/tipler";

export async function firmaOlusturEylem(girdi: unknown): Promise<EylemSonucu> {
  let id: number;
  try {
    id = await denetimli(FIRMA_ISLEM.olustur, (vt, a) => firmaOlustur(vt, a, girdi), ["admin"]);
  } catch (e) {
    return hataSonucu(e);
  }
  redirect(`/admin/firmalar/${id}?kaydedildi=1`);
}

export async function firmaGuncelleEylem(id: number, girdi: unknown): Promise<EylemSonucu> {
  try {
    await denetimli(FIRMA_ISLEM.guncelle, (vt, a) => firmaGuncelle(vt, a, Number(id), girdi), ["admin"]);
  } catch (e) {
    return hataSonucu(e);
  }
  refresh();
  return { tamam: "Değişiklikler kaydedildi." };
}

export async function firmaDurumEylem(id: number, aktif: boolean): Promise<EylemSonucu> {
  try {
    await denetimli(FIRMA_ISLEM.durum, (vt, a) => firmaDurumDegistir(vt, a, Number(id), aktif === true), ["admin"]);
  } catch (e) {
    return hataSonucu(e);
  }
  refresh();
  return { tamam: aktif ? "Firma aktif edildi." : "Firma pasife alındı; kullanıcıları giriş yapamaz." };
}

"use server";

// Kullanıcı işlemleri. Yetki: denetimli(…, ["admin"]) işlemin başında; servis ayrıca denetler.
// Parola hiçbir dönüşte yer almaz: tek seferlik gösterim, adminin yazdığı değerle tarayıcıda yapılır.

import { refresh } from "next/cache";
import { hataSonucu } from "@/lib/admin/eylem";
import {
  KULLANICI_ISLEM,
  kullaniciDurumDegistir,
  kullaniciEpostaDuzelt,
  kullaniciOlustur,
  kullaniciParolaSifirla,
} from "@/lib/admin/kullanici";
import { denetimli } from "@/lib/scope";
import type { EylemSonucu } from "@/components/admin/tipler";

export async function kullaniciOlusturEylem(girdi: unknown): Promise<EylemSonucu> {
  try {
    const id = await denetimli(KULLANICI_ISLEM.olustur, (vt, a) => kullaniciOlustur(vt, a, girdi), ["admin"]);
    return { tamam: "Kullanıcı açıldı.", id };
  } catch (e) {
    return hataSonucu(e);
  }
}

export async function kullaniciEpostaEylem(id: number, email: unknown): Promise<EylemSonucu> {
  try {
    await denetimli(KULLANICI_ISLEM.eposta, (vt, a) => kullaniciEpostaDuzelt(vt, a, Number(id), email), ["admin"]);
  } catch (e) {
    return hataSonucu(e);
  }
  refresh();
  return { tamam: "E-posta düzeltildi." };
}

export async function kullaniciParolaEylem(id: number, parola: unknown): Promise<EylemSonucu> {
  try {
    await denetimli(KULLANICI_ISLEM.parola, (vt, a) => kullaniciParolaSifirla(vt, a, Number(id), parola), ["admin"]);
  } catch (e) {
    return hataSonucu(e);
  }
  refresh();
  return { tamam: "Parola yeniden belirlendi." };
}

export async function kullaniciDurumEylem(id: number, aktif: boolean): Promise<EylemSonucu> {
  try {
    await denetimli(KULLANICI_ISLEM.durum, (vt, a) => kullaniciDurumDegistir(vt, a, Number(id), aktif === true), ["admin"]);
  } catch (e) {
    return hataSonucu(e);
  }
  refresh();
  return { tamam: aktif ? "Kullanıcı aktif edildi." : "Kullanıcı pasife alındı; giriş yapamaz." };
}

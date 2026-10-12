"use server";

// Ürün işlemleri. Yetki: denetimli(…, ["admin"]) işlemin başında oturumdaki aktörü veritabanından
// çözer ve admin değilse reddeder; servis de admin şartını ayrıca denetler. İstemciden gelen hiçbir
// değere güvenilmez: tüm doğrulama lib/admin/urun.ts'te sunucuda.

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { hataSonucu } from "@/lib/admin/eylem";
import { URUN_ISLEM, urunDurumDegistir, urunGuncelle, urunOlustur } from "@/lib/admin/urun";
import { denetimli } from "@/lib/scope";
import type { EylemSonucu } from "@/components/admin/tipler";

export async function urunOlusturEylem(firmaId: number, girdi: unknown, sonra: "detay" | "yeni"): Promise<EylemSonucu> {
  let id: number;
  try {
    id = await denetimli(URUN_ISLEM.olustur, (vt, a) => urunOlustur(vt, a, Number(firmaId), girdi), ["admin"]);
  } catch (e) {
    return hataSonucu(e);
  }
  redirect(sonra === "yeni" ? `/admin/urunler/yeni?tedarikci=${Number(firmaId)}&eklendi=${id}` : `/admin/urunler/${id}?kaydedildi=1`);
}

export async function urunGuncelleEylem(id: number, girdi: unknown): Promise<EylemSonucu> {
  try {
    await denetimli(URUN_ISLEM.guncelle, (vt, a) => urunGuncelle(vt, a, Number(id), girdi), ["admin"]);
  } catch (e) {
    return hataSonucu(e);
  }
  refresh();
  return { tamam: "Değişiklikler kaydedildi." };
}

export async function urunDurumEylem(id: number, aktif: boolean): Promise<EylemSonucu> {
  try {
    await denetimli(URUN_ISLEM.durum, (vt, a) => urunDurumDegistir(vt, a, Number(id), aktif === true), ["admin"]);
  } catch (e) {
    return hataSonucu(e);
  }
  refresh();
  return { tamam: aktif ? "Ürün aktif edildi; katalogda görünür." : "Ürün pasife alındı; katalogda görünmez." };
}

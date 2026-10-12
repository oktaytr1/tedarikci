"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { hataSonucu } from "@/lib/admin/eylem";
import { urunGuncelle, urunOlustur, urunDurumDegistir, urunSil } from "@/lib/admin/urun";
import { db } from "@/lib/db";
import { adminKontrol } from "@/lib/admin-auth";
import type { EylemSonucu } from "@/components/admin/tipler";

export async function urunOlusturEylem(girdi: unknown, sonra: "detay" | "yeni"): Promise<EylemSonucu> {
  await adminKontrol();
  let id: number;
  try {
    id = await urunOlustur(db, girdi);
  } catch (e) {
    return hataSonucu(e);
  }
  redirect(sonra === "yeni" ? `/admin/urunler/yeni?eklendi=${id}` : `/admin/urunler/${id}?kaydedildi=1`);
}

export async function urunGuncelleEylem(id: number, girdi: unknown): Promise<EylemSonucu> {
  await adminKontrol();
  try {
    await urunGuncelle(db, Number(id), girdi);
  } catch (e) {
    return hataSonucu(e);
  }
  refresh();
  return { tamam: "Değişiklikler kaydedildi." };
}

export async function urunDurumEylem(id: number, aktif: boolean): Promise<EylemSonucu> {
  await adminKontrol();
  try {
    await urunDurumDegistir(db, Number(id), aktif === true);
  } catch (e) {
    return hataSonucu(e);
  }
  refresh();
  return { tamam: aktif ? "Ürün aktif edildi; katalogda görünür." : "Ürün pasife alındı; katalogda görünmez." };
}

export async function urunSilEylem(id: number): Promise<EylemSonucu> {
  await adminKontrol();
  try {
    await urunSil(db, Number(id));
  } catch (e) {
    return hataSonucu(e);
  }
  redirect("/admin/urunler");
}

// Oturumdaki kullanıcı kimliğinden aktörü çözer. Her istekte veritabanından okunur:
// kullanıcı pasife alınırsa, rolü ya da firması değişirse JWT süresini beklemeden erişim kesilir.

import { db } from "@/lib/db";
import type { Aktor } from "@/lib/scope-cekirdek";

export async function aktorCoz(kullaniciId: number): Promise<Aktor | null> {
  if (!Number.isSafeInteger(kullaniciId) || kullaniciId <= 0) return null;
  const k = await db.kullanici.findUnique({
    where: { id: kullaniciId },
    select: { id: true, rol: true, aktif: true, firma_id: true, firma: { select: { durum: true } } },
  });
  if (!k || !k.aktif) return null;
  if (k.rol === "admin") return { tip: "admin", kullaniciId: k.id };
  // Tedarikçi ve alıcı: firması aktif olmalı (firma pasife alınınca tüm kullanıcılarının erişimi kesilir).
  if (k.firma_id === null || k.firma?.durum !== "aktif") return null;
  if (k.rol === "tedarikci") return { tip: "tedarikci", kullaniciId: k.id, firmaId: k.firma_id };
  if (k.rol === "alici") return { tip: "alici", kullaniciId: k.id, firmaId: k.firma_id };
  return null;
}

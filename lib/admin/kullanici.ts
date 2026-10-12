// Kullanıcı yönetimi (admin). Kayıt formu yoktur; kullanıcıyı admin açar ve parolayı belirler.
//
//   - Rol ve firma açılıştan sonra DEĞİŞMEZ (yanlış açılan kullanıcı pasife alınır, yenisi açılır).
//   - E-posta düzeltilebilir (yanlış yazılan e-posta en sık hata); denetim kaydına eski/yeni düşer.
//   - Admin firmasız; tedarikçi ve alıcı rolüyle uyumlu tipte bir firmaya bağlı.
//   - Parola hiçbir dönüşte yer almaz; denetim kaydında özeti "[gizli]" olarak görünür.
//   - Admin kendini pasife alamaz; son aktif admin pasife alınamaz.

import { z } from "zod";
import type { Rol } from "@/generated/prisma/enums";
import { GirisHatasi, IslemHatasi } from "@/lib/hatalar";
import { PAROLA_EN_AZ, parolaHashle, parolaKuraliHatasi } from "@/lib/password";
import type { Aktor, KapsamliDb } from "@/lib/scope-cekirdek";
import { adminGerekli, alanHatasi } from "./ortak";

export const KULLANICI_ISLEM = {
  olustur: "kullanici.olustur",
  eposta: "kullanici.eposta_duzelt",
  parola: "kullanici.parola_sifirla",
  durum: "kullanici.durum",
} as const;

export const ROL_ETIKETI: Record<Rol, string> = { admin: "Admin", tedarikci: "Tedarikçi", alici: "Alıcı" };

const eposta = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-posta en fazla 254 karakter.")
  .email("Geçerli bir e-posta adresi girin.");

const parola = z
  .string()
  .min(PAROLA_EN_AZ, `Parola en az ${PAROLA_EN_AZ} karakter olmalı.`)
  .max(200, "Parola en fazla 200 karakter.");

export const kullaniciSemasi = z
  .object({
    email: eposta,
    rol: z.enum(["admin", "tedarikci", "alici"], { message: "Rol seçin." }),
    firmaId: z.number().int().positive().nullable(),
    parola,
  })
  .superRefine((g, ctx) => {
    if (g.rol === "admin" && g.firmaId !== null) {
      ctx.addIssue({ code: "custom", path: ["firmaId"], message: "Admin bir firmaya bağlı olmaz." });
    }
    if (g.rol !== "admin" && g.firmaId === null) {
      ctx.addIssue({ code: "custom", path: ["firmaId"], message: "Tedarikçi ve alıcı için firma zorunlu." });
    }
  });
export type KullaniciGirdisi = z.input<typeof kullaniciSemasi>;

async function epostaTekrariniDenetle(vt: KapsamliDb, email: string, haricId?: number) {
  const varolan = await vt.kullanici.findFirst({
    where: { email, ...(haricId ? { NOT: { id: haricId } } : {}) },
    select: { id: true },
  });
  if (varolan) throw new GirisHatasi({ email: "Bu e-posta adresi başka bir kullanıcıda kayıtlı." });
}

/** Yeni kullanıcı. Dönüş yalnız kimliktir; parola geri dönmez. */
export async function kullaniciOlustur(vt: KapsamliDb, aktor: Aktor, girdi: unknown): Promise<number> {
  adminGerekli(aktor);
  const p = kullaniciSemasi.safeParse(girdi);
  if (!p.success) throw alanHatasi(p.error);
  const g = p.data;

  if (g.firmaId !== null) {
    const firma = await vt.firma.findUnique({ where: { id: g.firmaId }, select: { tip: true, durum: true } });
    if (!firma) throw new GirisHatasi({ firmaId: "Firma bulunamadı." });
    if (g.rol === "tedarikci" && firma.tip === "alici") {
      throw new GirisHatasi({ firmaId: "Tedarikçi kullanıcısı için tedarikçi tipinde bir firma seçin." });
    }
    if (g.rol === "alici" && firma.tip === "tedarikci") {
      throw new GirisHatasi({ firmaId: "Alıcı kullanıcısı için alıcı tipinde bir firma seçin." });
    }
    if (firma.durum !== "aktif") throw new GirisHatasi({ firmaId: "Pasif firmaya kullanıcı açılamaz." });
  }
  await epostaTekrariniDenetle(vt, g.email);
  const k = await vt.kullanici.create({
    data: { email: g.email, rol: g.rol, firma_id: g.firmaId, parola_hash: await parolaHashle(g.parola) },
    select: { id: true },
  });
  return k.id;
}

/** E-posta düzeltme (rol ve firma değişmez). */
export async function kullaniciEpostaDuzelt(vt: KapsamliDb, aktor: Aktor, id: number, yeniEposta: unknown): Promise<void> {
  adminGerekli(aktor);
  const p = eposta.safeParse(yeniEposta);
  if (!p.success) throw new GirisHatasi({ email: p.error.issues[0].message });
  const mevcut = await vt.kullanici.findUnique({ where: { id }, select: { email: true } });
  if (!mevcut) throw new IslemHatasi("Kullanıcı bulunamadı.");
  if (mevcut.email === p.data) throw new GirisHatasi({ email: "E-posta zaten bu." });
  await epostaTekrariniDenetle(vt, p.data, id);
  await vt.kullanici.update({ where: { id }, data: { email: p.data } });
}

/** Parolayı yeniden belirler. Denetim kaydına "parola sıfırlandı" düşer, parolanın kendisi değil. */
export async function kullaniciParolaSifirla(vt: KapsamliDb, aktor: Aktor, id: number, yeniParola: unknown): Promise<void> {
  adminGerekli(aktor);
  if (typeof yeniParola !== "string") throw new GirisHatasi({ parola: "Parola zorunlu." });
  const hata = parolaKuraliHatasi(yeniParola);
  if (hata) throw new GirisHatasi({ parola: hata });
  const varMi = await vt.kullanici.count({ where: { id } });
  if (!varMi) throw new IslemHatasi("Kullanıcı bulunamadı.");
  await vt.kullanici.update({ where: { id }, data: { parola_hash: await parolaHashle(yeniParola) } });
}

export async function kullaniciDurumDegistir(vt: KapsamliDb, aktor: Aktor, id: number, aktif: boolean): Promise<void> {
  adminGerekli(aktor);
  const k = await vt.kullanici.findUnique({ where: { id }, select: { rol: true, aktif: true } });
  if (!k) throw new IslemHatasi("Kullanıcı bulunamadı.");
  if (k.aktif === aktif) throw new IslemHatasi(`Kullanıcı zaten ${aktif ? "aktif" : "pasif"}.`);
  if (!aktif) {
    if (id === aktor.kullaniciId) throw new IslemHatasi("Kendinizi pasife alamazsınız.");
    if (k.rol === "admin") {
      const digerAktifAdmin = await vt.kullanici.count({ where: { rol: "admin", aktif: true, NOT: { id } } });
      if (digerAktifAdmin === 0) throw new IslemHatasi("Son aktif admin pasife alınamaz.");
    }
  }
  await vt.kullanici.update({ where: { id }, data: { aktif } });
}

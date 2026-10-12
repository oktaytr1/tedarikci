// Firma yönetimi (admin). Vergi no metin olarak saklanır (baştaki sıfırlar korunur).
// Tip değişikliği kullanıcı/ürün/siparişlerle çelişemez (burada açık mesajla, veritabanında
// firma_tip_kurali tetikleyicisiyle). Pasife alınan firmanın kullanıcıları giriş yapamaz,
// tedarikçiyse ürünleri katalogdan düşer.

import { z } from "zod";
import type { FirmaTip } from "@/generated/prisma/enums";
import { GirisHatasi, IslemHatasi } from "@/lib/hatalar";
import type { Aktor, KapsamliDb } from "@/lib/scope-cekirdek";
import { adminGerekli, alanHatasi, metinVeyaNull } from "./ortak";

export const FIRMA_ISLEM = {
  olustur: "firma.olustur",
  guncelle: "firma.guncelle",
  durum: "firma.durum",
} as const;

export const FIRMA_TIP_ETIKETI: Record<FirmaTip, string> = {
  tedarikci: "Tedarikçi",
  alici: "Alıcı",
  her_ikisi: "Her ikisi",
};

export const firmaSemasi = z.object({
  unvan: z.string().trim().min(2, "Ünvan zorunlu.").max(200, "Ünvan en fazla 200 karakter."),
  vergiNo: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, "Vergi no yalnız rakamlardan oluşmalı: 10 hane (VKN) ya da 11 hane (TCKN)."),
  tip: z.enum(["tedarikci", "alici", "her_ikisi"], { message: "Firma tipini seçin." }),
  adres: z.string().max(500, "Adres en fazla 500 karakter.").optional(),
  telefon: z.string().trim().max(50, "Telefon en fazla 50 karakter.").optional(),
});
export type FirmaGirdisi = z.input<typeof firmaSemasi>;

function firmaVerisi(girdi: unknown) {
  const p = firmaSemasi.safeParse(girdi);
  if (!p.success) throw alanHatasi(p.error);
  const g = p.data;
  return { unvan: g.unvan, vergi_no: g.vergiNo, tip: g.tip, adres: metinVeyaNull(g.adres), telefon: metinVeyaNull(g.telefon) };
}

async function vergiNoTekrariniDenetle(vt: KapsamliDb, vergiNo: string, haricId?: number) {
  const v = await vt.firma.findFirst({
    where: { vergi_no: vergiNo, ...(haricId ? { NOT: { id: haricId } } : {}) },
    select: { unvan: true },
  });
  if (v) throw new GirisHatasi({ vergiNo: `Bu vergi numarası "${v.unvan}" firmasında kayıtlı.` });
}

/** Tip değişikliğinin mevcut kayıtlarla çelişip çelişmediği (veritabanı tetikleyicisinin açıklamalı karşılığı). */
async function tipDegisikliginiDenetle(vt: KapsamliDb, id: number, yeniTip: FirmaTip) {
  if (yeniTip === "her_ikisi") return;
  if (yeniTip === "alici") {
    const [urun, tedarikciKullanici, satisSiparisi] = await Promise.all([
      vt.urun.count({ where: { firma_id: id } }),
      vt.kullanici.count({ where: { firma_id: id, rol: "tedarikci" } }),
      vt.siparis.count({ where: { satici_firma_id: id } }),
    ]);
    if (urun || tedarikciKullanici || satisSiparisi) {
      throw new GirisHatasi({
        tip: `Bu firma "Alıcı" yapılamaz: ${urun} ürünü, ${tedarikciKullanici} tedarikçi kullanıcısı${satisSiparisi ? `, ${satisSiparisi} satış siparişi` : ""} var.`,
      });
    }
  } else {
    const [aliciKullanici, alisSiparisi] = await Promise.all([
      vt.kullanici.count({ where: { firma_id: id, rol: "alici" } }),
      vt.siparis.count({ where: { alici_firma_id: id } }),
    ]);
    if (aliciKullanici || alisSiparisi) {
      throw new GirisHatasi({
        tip: `Bu firma "Tedarikçi" yapılamaz: ${aliciKullanici} alıcı kullanıcısı${alisSiparisi ? `, ${alisSiparisi} alış siparişi` : ""} var.`,
      });
    }
  }
}

export async function firmaOlustur(vt: KapsamliDb, aktor: Aktor, girdi: unknown): Promise<number> {
  adminGerekli(aktor);
  const veri = firmaVerisi(girdi);
  await vergiNoTekrariniDenetle(vt, veri.vergi_no);
  const f = await vt.firma.create({ data: veri, select: { id: true } });
  return f.id;
}

export async function firmaGuncelle(vt: KapsamliDb, aktor: Aktor, id: number, girdi: unknown): Promise<void> {
  adminGerekli(aktor);
  const veri = firmaVerisi(girdi);
  const mevcut = await vt.firma.findUnique({ where: { id }, select: { tip: true } });
  if (!mevcut) throw new IslemHatasi("Firma bulunamadı.");
  await vergiNoTekrariniDenetle(vt, veri.vergi_no, id);
  if (veri.tip !== mevcut.tip) await tipDegisikliginiDenetle(vt, id, veri.tip);
  await vt.firma.update({ where: { id }, data: veri });
}

export async function firmaDurumDegistir(vt: KapsamliDb, aktor: Aktor, id: number, aktif: boolean): Promise<void> {
  adminGerekli(aktor);
  const durum = aktif ? "aktif" : "pasif";
  const r = await vt.firma.updateMany({ where: { id, durum: aktif ? "pasif" : "aktif" }, data: { durum } });
  if (r.count !== 1) {
    const varMi = await vt.firma.count({ where: { id } });
    throw new IslemHatasi(varMi ? `Firma zaten ${durum}.` : "Firma bulunamadı.");
  }
}

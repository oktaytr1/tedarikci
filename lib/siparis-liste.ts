// Sipariş listesi sorgusu: arama, filtre, sıralama, sayfalama.
// Kapsamlı istemciyle çalışır; tedarikçi ekranı (bölüm 4) aynı fonksiyonu kullanır ve
// kapsam katmanı sayesinde yalnız kendi siparişlerini görür.

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { dbPara, faturaTutarUyusuyorMu, odemeDurumu } from "@/lib/money";
import type { KapsamliDb } from "@/lib/scope-cekirdek";
import { DURUM_SIRASI } from "@/lib/siparis-durum";
import { gecerliGunMu, gunTarih, tarihGun } from "@/lib/tarih";

export const SAYFA_BOYU = 50;

export const SIRALANABILIR = ["id", "tarih", "genel_toplam", "vade_tarihi", "durum"] as const;

const sayi = z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().int().positive().optional());
const gun = z.preprocess((v) => (typeof v === "string" && gecerliGunMu(v) ? v : undefined), z.string().optional());

export const listeFiltreSemasi = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  durum: z.enum(DURUM_SIRASI as [string, ...string[]]).optional().catch(undefined),
  alici: sayi.catch(undefined),
  satici: sayi.catch(undefined),
  bas: gun.catch(undefined),
  bit: gun.catch(undefined),
  /** haric (varsayılan) | dahil | sadece */
  iptal: z.enum(["haric", "dahil", "sadece"]).optional().catch(undefined),
  /** "1": yalnız fatura tutarı genel toplamla uyuşmayanlar */
  uyusmazlik: z.enum(["1"]).optional().catch(undefined),
  sirala: z.enum(SIRALANABILIR).optional().catch(undefined),
  yon: z.enum(["artan", "azalan"]).optional().catch(undefined),
  sayfa: sayi.catch(undefined),
});
export type ListeFiltresi = z.infer<typeof listeFiltreSemasi>;

/** URL arama parametrelerinden filtre (geçersiz değerler yok sayılır). */
export function filtreOku(sp: Record<string, string | string[] | undefined>): ListeFiltresi {
  const tek = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  return listeFiltreSemasi.parse(tek);
}

export function listeWhere(vt: KapsamliDb, f: ListeFiltresi): Prisma.SiparisWhereInput {
  const ve: Prisma.SiparisWhereInput[] = [];
  if (f.q) {
    const no = /^#?(\d{1,9})$/.exec(f.q)?.[1];
    ve.push({
      OR: [
        ...(no ? [{ id: Number(no) }] : []),
        { fatura_no: { contains: f.q, mode: "insensitive" } },
        { alici: { unvan: { contains: f.q, mode: "insensitive" } } },
        { satici: { unvan: { contains: f.q, mode: "insensitive" } } },
      ],
    });
  }
  if (f.durum) ve.push({ durum: f.durum as Prisma.SiparisWhereInput["durum"] });
  if (f.alici) ve.push({ alici_firma_id: f.alici });
  if (f.satici) ve.push({ satici_firma_id: f.satici });
  if (f.bas) ve.push({ tarih: { gte: gunTarih(f.bas) } });
  if (f.bit) ve.push({ tarih: { lte: gunTarih(f.bit) } });
  if ((f.iptal ?? "haric") === "haric") ve.push({ iptal_mi: false });
  if (f.iptal === "sadece") ve.push({ iptal_mi: true });
  if (f.uyusmazlik) {
    // Fatura tutarı girilmiş ve genel toplamdan farklı (kolon karşılaştırması veritabanında).
    ve.push({ fatura_tutar: { not: null } }, { NOT: { fatura_tutar: { equals: vt.siparis.fields.genel_toplam } } });
  }
  return ve.length ? { AND: ve } : {};
}

export type ListeSatiri = {
  id: number;
  tarih: string;
  alici: string;
  satici: string;
  genelToplam: string;
  komisyonTutar: string;
  odemeTipi: "pesin" | "vadeli";
  vadeTarihi: string | null;
  durum: (typeof DURUM_SIRASI)[number];
  iptal: boolean;
  faturaNo: string | null;
  faturaTutar: string | null;
  tutarUyusmuyor: boolean;
  odenen: string;
  kalan: string;
};

export async function siparisListesi(vt: KapsamliDb, f: ListeFiltresi) {
  const where = listeWhere(vt, f);
  const yon = f.yon === "artan" ? "asc" : "desc";
  const sirala = f.sirala ?? "id";
  const sayfa = f.sayfa ?? 1;
  const [toplam, kayitlar] = await Promise.all([
    vt.siparis.count({ where }),
    vt.siparis.findMany({
      where,
      orderBy: sirala === "id" ? [{ id: yon }] : [{ [sirala]: yon }, { id: "desc" }],
      skip: (sayfa - 1) * SAYFA_BOYU,
      take: SAYFA_BOYU,
      select: {
        id: true,
        tarih: true,
        genel_toplam: true,
        komisyon_tutar: true,
        odeme_tipi: true,
        vade_tarihi: true,
        durum: true,
        iptal_mi: true,
        fatura_no: true,
        fatura_tutar: true,
        alici: { select: { unvan: true } },
        satici: { select: { unvan: true } },
        odemeler: { select: { tutar: true, iptal_mi: true } },
      },
    }),
  ]);
  const satirlar = kayitlar.map((s): ListeSatiri => {
    const o = odemeDurumu(s.odemeler, s.fatura_tutar, s.genel_toplam);
    return {
      id: s.id,
      tarih: tarihGun(s.tarih),
      alici: s.alici.unvan,
      satici: s.satici.unvan,
      genelToplam: dbPara(s.genel_toplam),
      komisyonTutar: dbPara(s.komisyon_tutar),
      odemeTipi: s.odeme_tipi,
      vadeTarihi: s.vade_tarihi ? tarihGun(s.vade_tarihi) : null,
      durum: s.durum,
      iptal: s.iptal_mi,
      faturaNo: s.fatura_no,
      faturaTutar: s.fatura_tutar ? dbPara(s.fatura_tutar) : null,
      tutarUyusmuyor: !faturaTutarUyusuyorMu(s.fatura_tutar, s.genel_toplam),
      odenen: dbPara(o.odenen),
      kalan: dbPara(o.kalan),
    };
  });
  // eslint-disable-next-line no-restricted-syntax -- sayfa sayısı, para değil
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / SAYFA_BOYU));
  return { satirlar, toplam, sayfa, sayfaSayisi };
}

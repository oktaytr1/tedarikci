import Link from "next/link";
import { Suspense } from "react";
import { SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { buttonVariants } from "@/components/ui/button";
import { urunOnerileri } from "@/lib/admin/urun";
import { db } from "@/lib/db";
import { adminKontrol } from "@/lib/admin-auth";
import { UrunTablosu } from "./urun-tablosu";

type Arama = Promise<Record<string, string | string[] | undefined>>;

export default function UrunlerSayfasi({ searchParams }: { searchParams: Arama }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Yükleniyor…</p>}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: Arama }) {
  await adminKontrol();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const durum = typeof sp.durum === "string" ? sp.durum : undefined;

  const where: object[] = [];
  if (q) where.push({ OR: [{ ad: { contains: q, mode: "insensitive" as const } }, { kod: { contains: q, mode: "insensitive" as const } }] });
  if (durum === "aktif") where.push({ aktif: true });
  if (durum === "pasif") where.push({ aktif: false });

  const urunler = await db.urun.findMany({
    where: where.length ? { AND: where } : {},
    orderBy: [{ ad: "asc" }, { id: "asc" }],
    select: {
      id: true, kod: true, ad: true, kategori: true, birim: true,
      liste_fiyat: true, kdv_orani: true, aktif: true, fotograf_url: true,
    },
  });

  const oneriler = await urunOnerileri(db);

  return (
    <div className="flex flex-col gap-4">
      <SayfaBasligi baslik="Ürünler" sag={<Link href="/admin/urunler/yeni" className={buttonVariants()}>Yeni ürün</Link>} />
      <UrunTablosu
        satirlar={urunler.map((u) => ({ ...u, liste_fiyat: u.liste_fiyat.toString(), kdv_orani: u.kdv_orani.toString() }))}
        oneriler={oneriler} />
    </div>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { AracCubugu } from "@/components/admin/arac-cubugu";
import { Sayfalama } from "@/components/admin/sayfalama";
import { SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { buttonVariants } from "@/components/ui/button";
import { firmaSecenekleri, urunFiltresiOku, urunListesi } from "@/lib/admin/listeler";
import { urunOnerileri } from "@/lib/admin/urun";
import { rolGerekli } from "@/lib/authz";
import { kapsamliDb } from "@/lib/scope";
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
  const aktor = await rolGerekli("admin");
  const vt = await kapsamliDb("admin");
  const sp = await searchParams;
  const [liste, firmalar, oneriler] = await Promise.all([
    urunListesi(vt, aktor, urunFiltresiOku(sp)),
    firmaSecenekleri(vt, aktor),
    urunOnerileri(vt, aktor),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <SayfaBasligi baslik="Ürünler" sag={<Link href="/admin/urunler/yeni" className={buttonVariants()}>Yeni ürün</Link>} />
      <AracCubugu
        aramaIpucu="Ara: ürün kodu veya adı"
        filtreler={[
          { ad: "tedarikci", etiket: "Tedarikçi", secenekler: firmalar.filter((f) => f.tip !== "alici").map((f) => ({ deger: String(f.id), etiket: f.unvan })) },
          { ad: "kategori", etiket: "Kategori", secenekler: oneriler.kategoriler.map((k) => ({ deger: k, etiket: k })) },
          { ad: "durum", etiket: "Durum", secenekler: [{ deger: "aktif", etiket: "Aktif" }, { deger: "pasif", etiket: "Pasif" }] },
        ]}
      />
      <UrunTablosu satirlar={liste.satirlar} />
      <Sayfalama sp={sp} toplam={liste.toplam} sayfa={liste.sayfa} sayfaSayisi={liste.sayfaSayisi} birim="ürün" />
    </div>
  );
}

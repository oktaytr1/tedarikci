import Link from "next/link";
import { Suspense } from "react";
import { AracCubugu } from "@/components/admin/arac-cubugu";
import { Sayfalama } from "@/components/admin/sayfalama";
import { SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { buttonVariants } from "@/components/ui/button";
import { firmaFiltresiOku, firmaListesi } from "@/lib/admin/listeler";
import { rolGerekli } from "@/lib/authz";
import { kapsamliDb } from "@/lib/scope";
import { FirmaTablosu } from "./firma-tablosu";

type Arama = Promise<Record<string, string | string[] | undefined>>;

export default function FirmalarSayfasi({ searchParams }: { searchParams: Arama }) {
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
  const liste = await firmaListesi(vt, aktor, firmaFiltresiOku(sp));
  return (
    <div className="flex flex-col gap-4">
      <SayfaBasligi baslik="Firmalar" sag={<Link href="/admin/firmalar/yeni" className={buttonVariants()}>Yeni firma</Link>} />
      <AracCubugu
        aramaIpucu="Ara: ünvan veya vergi no"
        filtreler={[
          { ad: "tip", etiket: "Tip", secenekler: [{ deger: "tedarikci", etiket: "Tedarikçi" }, { deger: "alici", etiket: "Alıcı" }, { deger: "her_ikisi", etiket: "Her ikisi" }] },
          { ad: "durum", etiket: "Durum", secenekler: [{ deger: "aktif", etiket: "Aktif" }, { deger: "pasif", etiket: "Pasif" }] },
        ]}
      />
      <FirmaTablosu satirlar={liste.satirlar} />
      <Sayfalama sp={sp} toplam={liste.toplam} sayfa={liste.sayfa} sayfaSayisi={liste.sayfaSayisi} birim="firma" />
    </div>
  );
}

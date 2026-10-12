import Link from "next/link";
import { Suspense } from "react";
import { AracCubugu } from "@/components/admin/arac-cubugu";
import { Sayfalama } from "@/components/admin/sayfalama";
import { SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { buttonVariants } from "@/components/ui/button";
import { firmaSecenekleri, kullaniciFiltresiOku, kullaniciListesi } from "@/lib/admin/listeler";
import { rolGerekli } from "@/lib/authz";
import { kapsamliDb } from "@/lib/scope";
import { KullaniciTablosu } from "./kullanici-tablosu";

type Arama = Promise<Record<string, string | string[] | undefined>>;

export default function KullanicilarSayfasi({ searchParams }: { searchParams: Arama }) {
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
  const [liste, firmalar] = await Promise.all([kullaniciListesi(vt, aktor, kullaniciFiltresiOku(sp)), firmaSecenekleri(vt, aktor)]);
  return (
    <div className="flex flex-col gap-4">
      <SayfaBasligi baslik="Kullanıcılar" sag={<Link href="/admin/kullanicilar/yeni" className={buttonVariants()}>Kullanıcı aç</Link>} />
      <AracCubugu
        aramaIpucu="Ara: e-posta"
        filtreler={[
          { ad: "rol", etiket: "Rol", secenekler: [{ deger: "admin", etiket: "Admin" }, { deger: "tedarikci", etiket: "Tedarikçi" }, { deger: "alici", etiket: "Alıcı" }] },
          { ad: "firma", etiket: "Firma", secenekler: firmalar.map((f) => ({ deger: String(f.id), etiket: f.unvan })) },
          { ad: "durum", etiket: "Durum", secenekler: [{ deger: "aktif", etiket: "Aktif" }, { deger: "pasif", etiket: "Pasif" }] },
        ]}
      />
      <KullaniciTablosu satirlar={liste.satirlar} />
      <Sayfalama sp={sp} toplam={liste.toplam} sayfa={liste.sayfa} sayfaSayisi={liste.sayfaSayisi} birim="kullanıcı" />
    </div>
  );
}

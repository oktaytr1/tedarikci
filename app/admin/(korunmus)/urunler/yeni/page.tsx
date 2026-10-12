import Link from "next/link";
import { Suspense } from "react";
import { Bildirim, SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { urunOnerileri } from "@/lib/admin/urun";
import { db } from "@/lib/db";
import { UrunFormu } from "../urun-formu";

type Arama = Promise<Record<string, string | undefined>>;

export default function YeniUrunSayfasi({ searchParams }: { searchParams: Arama }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Yükleniyor…</p>}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: Arama }) {
  const sp = await searchParams;
  const oneriler = await urunOnerileri(db);
  const eklenen = sp.eklendi
    ? await db.urun.findUnique({ where: { id: Number(sp.eklendi) || 0 }, select: { id: true, kod: true, ad: true } })
    : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <SayfaBasligi baslik="Yeni ürün" geri={{ href: "/admin/urunler", etiket: "Ürünler" }} />
      {eklenen && (
        <Bildirim>
          <Link href={`/admin/urunler/${eklenen.id}`} className="underline">
            {eklenen.kod} · {eklenen.ad}
          </Link>{" "}
          kaydedildi. Sıradaki ürünü girebilirsiniz.
        </Bildirim>
      )}
      <UrunFormu
        key={sp.eklendi ?? "ilk"}
        oneriler={oneriler}
        baslangic={{
          kod: "",
          ad: "",
          aciklama: "",
          kategori: "",
          birim: "adet",
          koliAdedi: "",
          minSiparis: "",
          listeFiyat: "",
          kdvOrani: "20.00",
          fotografUrl: "",
        }}
      />
    </div>
  );
}

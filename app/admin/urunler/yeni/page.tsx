import Link from "next/link";
import { Suspense } from "react";
import { Bildirim, SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { firmaSecenekleri } from "@/lib/admin/listeler";
import { urunOnerileri } from "@/lib/admin/urun";
import { rolGerekli } from "@/lib/authz";
import { kapsamliDb } from "@/lib/scope";
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
  const aktor = await rolGerekli("admin");
  const vt = await kapsamliDb("admin");
  const sp = await searchParams;
  const [firmalar, oneriler] = await Promise.all([firmaSecenekleri(vt, aktor), urunOnerileri(vt, aktor)]);
  const tedarikciler = firmalar.filter((f) => f.tip !== "alici");
  const secili = tedarikciler.find((t) => t.id === Number(sp.tedarikci))?.id ?? null;
  const eklenen = sp.eklendi ? await vt.urun.findUnique({ where: { id: Number(sp.eklendi) || 0 }, select: { id: true, kod: true, ad: true } }) : null;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <SayfaBasligi baslik="Yeni ürün" geri={{ href: "/admin/urunler", etiket: "Ürünler" }} />
      {eklenen && (
        <Bildirim>
          <Link href={`/admin/urunler/${eklenen.id}`} className="underline">
            {eklenen.kod} · {eklenen.ad}
          </Link>{" "}
          kaydedildi. Aynı tedarikçi için sıradaki ürünü girebilirsiniz.
        </Bildirim>
      )}
      <UrunFormu
        // Her kayıttan sonra form boş başlasın.
        key={sp.eklendi ?? "ilk"}
        tedarikciler={tedarikciler}
        oneriler={oneriler}
        baslangic={{
          firmaId: secili,
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

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UrunDetayi } from "@/components/katalog/urun-detayi";
import { rolGerekli } from "@/lib/authz";
import { katalogDetayi } from "@/lib/katalog";
import { kapsamliDb } from "@/lib/scope";

type Props = { params: Promise<{ id: string }> };

export default function KatalogUrunSayfasi(p: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Yükleniyor…</p>}>
      <Icerik {...p} />
    </Suspense>
  );
}

async function Icerik({ params }: Props) {
  const aktor = await rolGerekli("alici");
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  // Pasif ürün ya da pasif tedarikçinin ürünü kapsam dışı → bulunamadı.
  const u = await katalogDetayi(await kapsamliDb("alici"), aktor, id);
  if (!u) notFound();
  const tel = u.tedarikciBilgisi.telefon;
  return (
    <UrunDetayi
      u={u}
      geri={{ href: "/katalog", etiket: "Katalog" }}
      altEylem={
        tel ? (
          <a
            href={`tel:${tel.replace(/[^\d+]/g, "")}`}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-medium text-primary-foreground md:w-auto md:px-6"
          >
            Tedarikçiyi ara · {tel}
          </a>
        ) : null
      }
    />
  );
}

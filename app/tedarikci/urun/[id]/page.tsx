import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminIletisim } from "@/components/katalog/admin-iletisim";
import { UrunDetayi } from "@/components/katalog/urun-detayi";
import { rolGerekli } from "@/lib/authz";
import { katalogDetayi } from "@/lib/katalog";
import { kapsamliDb } from "@/lib/scope";

type Props = { params: Promise<{ id: string }> };

export default function TedarikciUrunSayfasi(p: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Yükleniyor…</p>}>
      <Icerik {...p} />
    </Suspense>
  );
}

async function Icerik({ params }: Props) {
  const aktor = await rolGerekli("tedarikci");
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  // Başka tedarikçinin ürünü kapsam dışı → bulunamadı.
  const u = await katalogDetayi(await kapsamliDb("tedarikci"), aktor, id);
  if (!u) notFound();
  return (
    <UrunDetayi
      u={u}
      geri={{ href: "/tedarikci", etiket: "Ürünlerim" }}
      ek={
        !u.aktif ? (
          <p className="rounded-lg bg-zinc-100 p-2 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Bu ürün pasif: alıcıların kataloğunda görünmüyor.
          </p>
        ) : null
      }
      altEylem={<AdminIletisim kisa />}
    />
  );
}

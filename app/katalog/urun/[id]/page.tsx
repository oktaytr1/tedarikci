import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { UrunDetayi } from "@/components/katalog/urun-detayi";
import { katalogDetayi } from "@/lib/katalog";
import { db } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default function KatalogUrunSayfasi(p: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Ürün yükleniyor…</p>}>
      <Icerik {...p} />
    </Suspense>
  );
}

async function Icerik({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const u = await katalogDetayi(db, id);
  if (!u) notFound();

  return (
    <UrunDetayi
      u={u}
      geri={{ href: "/katalog", etiket: "Kataloğa Dön" }}
      altEylem={
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <a
            href={`https://wa.me/905012542020?text=${encodeURIComponent(`Merhaba, tedarikcim.net.tr üzerinden "${u.ad}" (${u.kod}) hakkında bilgi almak istiyorum.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-[0.99]"
          >
            <MessageCircle className="size-4" />
            <span>WhatsApp ile Bilgi Al</span>
          </a>
        </div>
      }
    />
  );
}

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { UrunDetayi } from "@/components/katalog/urun-detayi";
import { oturumAktoru } from "@/lib/authz";
import { katalogDetayi } from "@/lib/katalog";
import { kapsamliDb } from "@/lib/scope";
import { statikKatalogDetayi } from "@/lib/statik-katalog";

type Props = { params: Promise<{ id: string }> };

export default function KatalogUrunSayfasi(p: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Ürün yükleniyor…</p>}>
      <Icerik {...p} />
    </Suspense>
  );
}

function whatsAppUrl(tel: string, ad: string, kod: string): string {
  let temiz = tel.replace(/[^\d]/g, "");
  if (temiz.startsWith("0")) {
    temiz = "90" + temiz.slice(1);
  } else if (!temiz.startsWith("90") && temiz.length === 10) {
    temiz = "90" + temiz;
  }
  const mesaj = `Merhaba, tedarikcim.net.tr üzerinden "${ad}" (${kod}) ürününüz hakkında toptan bilgi ve sipariş almak istiyorum.`;
  return `https://wa.me/${temiz}?text=${encodeURIComponent(mesaj)}`;
}

async function Icerik({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const aktor = await oturumAktoru();
  let u = null;

  if (aktor && process.env.DATABASE_URL) {
    try {
      const vt = await kapsamliDb();
      u = await katalogDetayi(vt, aktor, id);
    } catch {
      u = statikKatalogDetayi(id);
    }
  } else {
    u = statikKatalogDetayi(id);
  }

  if (!u) notFound();

  const tel = u.tedarikciBilgisi.telefon;

  return (
    <UrunDetayi
      u={u}
      geri={{ href: "/katalog", etiket: "Kataloğa Dön" }}
      altEylem={
        tel ? (
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* WhatsApp Sipariş & Bilgi Butonu */}
            <a
              href={whatsAppUrl(tel, u.ad, u.kod)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-[0.99]"
            >
              <MessageCircle className="size-4" />
              <span>WhatsApp ile Sipariş & Bilgi İste</span>
            </a>

            {/* Telefonla Ara Butonu */}
            <a
              href={`tel:${tel.replace(/[^\d+]/g, "")}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-5 text-sm font-semibold text-foreground shadow-2xs transition-all hover:bg-muted active:scale-[0.99]"
            >
              <Phone className="size-4" />
              <span>Ara · {tel}</span>
            </a>
          </div>
        ) : null
      }
    />
  );
}

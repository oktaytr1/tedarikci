import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AktifRozeti } from "@/components/admin/durum-rozeti";
import { Bildirim, SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { urunOnerileri } from "@/lib/admin/urun";
import { db } from "@/lib/db";
import { adminKontrol } from "@/lib/admin-auth";
import { dbOran, miktarYaz, paraGirdiYaz } from "@/lib/money";
import { UrunFormu } from "../urun-formu";
import { UrunDurumDugmesi } from "./urun-durum-dugmesi";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default function UrunDetaySayfasi(p: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Yükleniyor…</p>}>
      <Icerik {...p} />
    </Suspense>
  );
}

async function Icerik({ params, searchParams }: Props) {
  await adminKontrol();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const u = await db.urun.findUnique({ where: { id } });
  if (!u) notFound();
  const [oneriler, sp] = await Promise.all([
    urunOnerileri(db),
    searchParams,
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <SayfaBasligi
        baslik={
          <span className="flex items-center gap-3">
            {u.kod} · {u.ad} <AktifRozeti aktif={u.aktif} />
          </span>
        }
        geri={{ href: "/admin/urunler", etiket: "Ürünler" }}
      />
      {sp.kaydedildi && <Bildirim>Ürün kaydedildi.</Bildirim>}
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="rounded-xl border p-4">
          <UrunFormu
            urunId={u.id}
            oneriler={oneriler}
            baslangic={{
              kod: u.kod,
              ad: u.ad,
              aciklama: u.aciklama ?? "",
              kategori: u.kategori ?? "",
              birim: u.birim,
              koliAdedi: u.koli_adedi?.toString() ?? "",
              minSiparis: u.min_siparis ? miktarYaz(u.min_siparis) : "",
              listeFiyat: paraGirdiYaz(u.liste_fiyat),
              kdvOrani: dbOran(u.kdv_orani),
              fotografUrl: u.fotograf_url ?? "",
            }}
          />
        </section>
        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border p-4">
            <h2 className="mb-2 text-sm font-semibold">Durum</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              {u.aktif ? "Aktif: katalogda görünür." : "Pasif: katalogda görünmez."}
            </p>
            <UrunDurumDugmesi id={u.id} aktif={u.aktif} />
          </section>
        </aside>
      </div>
    </div>
  );
}

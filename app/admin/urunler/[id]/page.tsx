import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AktifRozeti } from "@/components/admin/durum-rozeti";
import { GecmisListesi } from "@/components/admin/gecmis-listesi";
import { Bildirim, SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { kayitGecmisi } from "@/lib/admin/gecmis";
import { firmaSecenekleri } from "@/lib/admin/listeler";
import { urunOnerileri } from "@/lib/admin/urun";
import { rolGerekli } from "@/lib/authz";
import { dbOran, miktarYaz, paraGirdiYaz } from "@/lib/money";
import { kapsamliDb } from "@/lib/scope";
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
  const aktor = await rolGerekli("admin");
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const vt = await kapsamliDb("admin");
  const u = await vt.urun.findUnique({ where: { id }, include: { firma: { select: { id: true, unvan: true, durum: true } } } });
  if (!u) notFound();
  const [firmalar, oneriler, gecmis, sp] = await Promise.all([
    firmaSecenekleri(vt, aktor),
    urunOnerileri(vt, aktor),
    kayitGecmisi(vt, aktor, "Urun", id),
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
      {u.firma.durum !== "aktif" && (
        <Bildirim tur="uyari">
          Tedarikçi firma pasif: bu ürün aktif olsa da katalogda görünmez.{" "}
          <Link href={`/admin/firmalar/${u.firma.id}`} className="underline">
            Firmaya git
          </Link>
        </Bildirim>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="rounded-xl border p-4">
          <UrunFormu
            urunId={u.id}
            tedarikciler={firmalar.filter((f) => f.tip !== "alici" || f.id === u.firma_id)}
            oneriler={oneriler}
            baslangic={{
              firmaId: u.firma_id,
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
              {u.aktif ? "Aktif: katalogda görünür." : "Pasif: katalogda görünmez, bu listede kalır."} Ürün silinmez.
            </p>
            <UrunDurumDugmesi id={u.id} aktif={u.aktif} />
          </section>
          <section className="rounded-xl border p-4">
            <h2 className="mb-3 text-sm font-semibold">Değişiklik geçmişi</h2>
            <GecmisListesi kayitlar={gecmis} />
          </section>
        </aside>
      </div>
    </div>
  );
}

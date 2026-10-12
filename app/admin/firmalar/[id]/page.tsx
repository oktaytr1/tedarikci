import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AktifRozeti } from "@/components/admin/durum-rozeti";
import { GecmisListesi } from "@/components/admin/gecmis-listesi";
import { Bildirim, SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { buttonVariants } from "@/components/ui/button";
import { ROL_ETIKETI } from "@/lib/admin/firma-etiket";
import { kayitGecmisi } from "@/lib/admin/gecmis";
import { rolGerekli } from "@/lib/authz";
import { kapsamliDb } from "@/lib/scope";
import { FirmaFormu } from "../firma-formu";
import { FirmaDurumDugmesi } from "./firma-durum-dugmesi";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default function FirmaDetaySayfasi(p: Props) {
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
  const f = await vt.firma.findUnique({
    where: { id },
    select: {
      id: true,
      unvan: true,
      vergi_no: true,
      tip: true,
      durum: true,
      adres: true,
      telefon: true,
      kullanicilar: { select: { id: true, email: true, rol: true, aktif: true }, orderBy: { email: "asc" } },
      _count: { select: { urunler: true } },
    },
  });
  if (!f) notFound();
  const [aktifUrun, gecmis, sp] = await Promise.all([
    vt.urun.count({ where: { firma_id: id, aktif: true } }),
    kayitGecmisi(vt, aktor, "Firma", id),
    searchParams,
  ]);
  const aktif = f.durum === "aktif";
  const saticiMi = f.tip !== "alici";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <SayfaBasligi
        baslik={
          <span className="flex items-center gap-3">
            {f.unvan} <AktifRozeti aktif={aktif} />
          </span>
        }
        geri={{ href: "/admin/firmalar", etiket: "Firmalar" }}
      />
      {sp.kaydedildi && <Bildirim>Firma kaydedildi. Şimdi kullanıcı açabilirsiniz.</Bildirim>}
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="rounded-xl border p-4">
          <FirmaFormu
            firmaId={f.id}
            baslangic={{ unvan: f.unvan, vergiNo: f.vergi_no, tip: f.tip, adres: f.adres ?? "", telefon: f.telefon ?? "" }}
          />
        </section>
        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border p-4">
            <h2 className="mb-2 text-sm font-semibold">Durum</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              {aktif
                ? "Aktif. Pasife alınırsa kullanıcıları giriş yapamaz" + (saticiMi ? ", ürünleri katalogdan kalkar." : ".")
                : "Pasif: kullanıcıları giriş yapamaz" + (saticiMi ? ", ürünleri katalogda görünmez." : ".")}{" "}
              Firma silinmez.
            </p>
            <FirmaDurumDugmesi
              id={f.id}
              aktif={aktif}
              uyari={`${f.unvan} pasife alınsın mı? ${f.kullanicilar.filter((k) => k.aktif).length} aktif kullanıcısı giriş yapamayacak${saticiMi ? `, ${aktifUrun} aktif ürünü katalogdan kalkacak` : ""}.`}
            />
          </section>
          <section className="rounded-xl border p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Kullanıcılar</h2>
              <Link href={`/admin/kullanicilar/yeni?firma=${f.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                Kullanıcı aç
              </Link>
            </div>
            {f.kullanicilar.length === 0 ? (
              <p className="text-xs text-muted-foreground">Kullanıcı yok.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {f.kullanicilar.map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-2">
                    <Link href={`/admin/kullanicilar/${k.id}`} className={k.aktif ? "hover:underline" : "text-muted-foreground line-through"}>
                      {k.email}
                    </Link>
                    <span className="text-xs text-muted-foreground">{ROL_ETIKETI[k.rol]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {saticiMi && (
            <section className="rounded-xl border p-4 text-sm">
              <h2 className="mb-1 text-sm font-semibold">Ürünler</h2>
              <p className="text-muted-foreground">
                {f._count.urunler} ürün ({aktifUrun} aktif).{" "}
                <Link href={`/admin/urunler?tedarikci=${f.id}`} className="underline">
                  Listele
                </Link>{" "}
                ·{" "}
                <Link href={`/admin/urunler/yeni?tedarikci=${f.id}`} className="underline">
                  Ürün ekle
                </Link>
              </p>
            </section>
          )}
          <section className="rounded-xl border p-4">
            <h2 className="mb-3 text-sm font-semibold">Değişiklik geçmişi</h2>
            <GecmisListesi kayitlar={gecmis} />
          </section>
        </aside>
      </div>
    </div>
  );
}

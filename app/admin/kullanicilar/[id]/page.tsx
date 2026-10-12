import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AktifRozeti } from "@/components/admin/durum-rozeti";
import { GecmisListesi } from "@/components/admin/gecmis-listesi";
import { SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { ROL_ETIKETI } from "@/lib/admin/firma-etiket";
import { kayitGecmisi } from "@/lib/admin/gecmis";
import { rolGerekli } from "@/lib/authz";
import { kapsamliDb } from "@/lib/scope";
import { zamanYaz } from "@/lib/tarih";
import { EpostaFormu, KullaniciDurumDugmesi, ParolaFormu } from "./kullanici-islemleri";

type Props = { params: Promise<{ id: string }> };

export default function KullaniciDetaySayfasi(p: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Yükleniyor…</p>}>
      <Icerik {...p} />
    </Suspense>
  );
}

async function Icerik({ params }: Props) {
  const aktor = await rolGerekli("admin");
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const vt = await kapsamliDb("admin");
  // Parola özeti seçilmez.
  const k = await vt.kullanici.findUnique({
    where: { id },
    select: { id: true, email: true, rol: true, aktif: true, olusturma: true, firma: { select: { id: true, unvan: true, durum: true } } },
  });
  if (!k) notFound();
  const gecmis = await kayitGecmisi(vt, aktor, "Kullanici", id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <SayfaBasligi
        baslik={
          <span className="flex items-center gap-3">
            {k.email} <AktifRozeti aktif={k.aktif} />
          </span>
        }
        geri={{ href: "/admin/kullanicilar", etiket: "Kullanıcılar" }}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border p-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Rol</dt>
                <dd>{ROL_ETIKETI[k.rol]}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Firma</dt>
                <dd>
                  {k.firma ? (
                    <Link href={`/admin/firmalar/${k.firma.id}`} className="hover:underline">
                      {k.firma.unvan}
                    </Link>
                  ) : (
                    "— (admin)"
                  )}
                  {k.firma && k.firma.durum !== "aktif" && <span className="block text-xs text-amber-700">Firma pasif: giriş yapamaz.</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Açılış</dt>
                <dd>{zamanYaz(k.olusturma)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">Rol ve firma değiştirilemez; gerekirse kullanıcı pasife alınıp yenisi açılır.</p>
          </section>
          <section className="rounded-xl border p-4">
            <EpostaFormu key={k.email} id={k.id} email={k.email} />
          </section>
          <section className="rounded-xl border p-4">
            <ParolaFormu id={k.id} email={k.email} />
          </section>
        </div>
        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border p-4">
            <h2 className="mb-2 text-sm font-semibold">Durum</h2>
            <KullaniciDurumDugmesi id={k.id} aktif={k.aktif} kendisi={k.id === aktor.kullaniciId} />
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

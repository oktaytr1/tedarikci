import { Suspense } from "react";
import { SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { firmaSecenekleri } from "@/lib/admin/listeler";
import { rolGerekli } from "@/lib/authz";
import { kapsamliDb } from "@/lib/scope";
import { KullaniciFormu } from "../kullanici-formu";

type Arama = Promise<Record<string, string | undefined>>;

export default function YeniKullaniciSayfasi({ searchParams }: { searchParams: Arama }) {
  return (
    <Suspense fallback={null}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: Arama }) {
  const aktor = await rolGerekli("admin");
  const vt = await kapsamliDb("admin");
  const [firmalar, sp] = await Promise.all([firmaSecenekleri(vt, aktor), searchParams]);
  const varsayilan = firmalar.find((f) => f.id === Number(sp.firma) && f.aktif)?.id ?? null;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <SayfaBasligi baslik="Kullanıcı aç" geri={{ href: "/admin/kullanicilar", etiket: "Kullanıcılar" }} />
      <p className="text-sm text-muted-foreground">Kayıt formu yoktur; parolayı siz belirlersiniz ve kullanıcıya siz iletirsiniz.</p>
      <KullaniciFormu firmalar={firmalar} varsayilanFirma={varsayilan} />
    </div>
  );
}

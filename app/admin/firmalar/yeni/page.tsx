import { Suspense } from "react";
import { SayfaBasligi } from "@/components/admin/sayfa-basligi";
import { rolGerekli } from "@/lib/authz";
import { FirmaFormu } from "../firma-formu";

export default function YeniFirmaSayfasi() {
  return (
    <Suspense fallback={null}>
      <Icerik />
    </Suspense>
  );
}

async function Icerik() {
  await rolGerekli("admin");
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <SayfaBasligi baslik="Yeni firma" geri={{ href: "/admin/firmalar", etiket: "Firmalar" }} />
      <FirmaFormu baslangic={{ unvan: "", vergiNo: "", tip: "", adres: "", telefon: "" }} />
    </div>
  );
}

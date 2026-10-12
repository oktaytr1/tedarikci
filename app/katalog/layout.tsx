import { Suspense } from "react";
import { PanelKabugu } from "@/components/oturum/panel-kabugu";
import { rolGerekli } from "@/lib/authz";

// Bu düzen yalnız yönlendirme ve görünüm içindir; asıl yetki her sorguda kapsam katmanındadır.
export default function KatalogDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Yükleniyor…</div>}>
      <Korumali>{children}</Korumali>
    </Suspense>
  );
}

async function Korumali({ children }: { children: React.ReactNode }) {
  const aktor = await rolGerekli("alici");
  return (
    <PanelKabugu aktor={aktor} baslik="Katalog">
      {children}
    </PanelKabugu>
  );
}

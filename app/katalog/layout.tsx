import { Suspense } from "react";
import { PanelKabugu } from "@/components/oturum/panel-kabugu";
import { oturumAktoru } from "@/lib/authz";

export default function KatalogDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Yükleniyor…</div>}>
      <KatalogKabugu>{children}</KatalogKabugu>
    </Suspense>
  );
}

async function KatalogKabugu({ children }: { children: React.ReactNode }) {
  const aktor = await oturumAktoru();
  return (
    <PanelKabugu aktor={aktor} baslik="Katalog">
      {children}
    </PanelKabugu>
  );
}

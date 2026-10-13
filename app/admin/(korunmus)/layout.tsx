import { Suspense } from "react";
import { adminKontrol } from "@/lib/admin-auth";

// Auth guard: oturumu olmayanı girişe yönlendirir. Layout ve sayfa paralel render edilir;
// layout'taki yönlendirme sayfanın verisinin akışa girmesini ENGELLEMEZ. Bu yüzden veri okuyan
// her sayfa da sorgudan önce kendi adminKontrol() çağrısını yapmalıdır.
export default function KorunmusAdminDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Yükleniyor…</div>}>
      <OturumKontrolu>{children}</OturumKontrolu>
    </Suspense>
  );
}

async function OturumKontrolu({ children }: { children: React.ReactNode }) {
  await adminKontrol();
  return <>{children}</>;
}

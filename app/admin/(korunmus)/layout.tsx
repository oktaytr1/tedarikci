import { Suspense } from "react";
import { adminKontrol } from "@/lib/admin-auth";

// Merkezi auth guard: (korunmus) route group altındaki TÜM sayfalar
// otomatik olarak korunur. Yeni sayfa eklendiğinde tekrar adminKontrol()
// çağırmaya gerek yoktur — bu layout bunu garanti eder.
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

import { Suspense } from "react";
import { rolGerekli } from "@/lib/authz";

// Yer tutucu: Tedarikçi ekranları (task1.md bölüm 5) ayrıca yapılacak.
// Kural: rol kontrolü düzende DEĞİL her sayfada yapılır. Düzen (layout) ve sayfa ayrı render
// edilir; düzendeki kontrol sayfanın önceden render edilen (prerender) kısmını durdurmaz.
export default function Sayfa() {
  return (
    <Suspense fallback={null}>
      <Icerik />
    </Suspense>
  );
}

async function Icerik() {
  await rolGerekli("tedarikci");
  return <p className="text-sm text-muted-foreground">Tedarikçi ekranı henüz yapılmadı.</p>;
}

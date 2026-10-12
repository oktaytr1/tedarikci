import { Suspense } from "react";
import { rolGerekli } from "@/lib/authz";

// Yer tutucu: Admin ekranları (task1.md bölüm 3) ayrıca yapılacak.
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
  await rolGerekli("admin");
  return <p className="text-sm text-muted-foreground">Admin ekranı henüz yapılmadı.</p>;
}

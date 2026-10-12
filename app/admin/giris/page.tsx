import { Suspense } from "react";
import { redirect } from "next/navigation";
import { adminOturumVarMi } from "@/lib/admin-auth";
import { AdminGirisFormu } from "./giris-formu";
import { Logo } from "@/components/marka/logo";

export default function AdminGirisSayfasi() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-sm text-muted-foreground">Yükleniyor…</p></div>}>
      <Icerik />
    </Suspense>
  );
}

async function Icerik() {
  if (await adminOturumVarMi()) redirect("/admin/urunler");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo className="h-8" />
          <h1 className="text-lg font-semibold">Yönetim Paneli</h1>
          <p className="text-xs text-muted-foreground">Devam etmek için giriş yapın.</p>
        </div>
        <AdminGirisFormu />
      </div>
    </div>
  );
}

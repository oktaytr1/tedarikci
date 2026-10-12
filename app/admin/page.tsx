import { redirect } from "next/navigation";
import { Suspense } from "react";
import { rolGerekli } from "@/lib/authz";

export default function AdminAnaSayfa() {
  return (
    <Suspense fallback={null}>
      <Yonlendir />
    </Suspense>
  );
}

async function Yonlendir(): Promise<null> {
  await rolGerekli("admin");
  redirect("/admin/urunler");
}

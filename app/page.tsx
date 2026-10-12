import { Suspense } from "react";
import { redirect } from "next/navigation";
import { oturumAktoru } from "@/lib/authz";

// Kök adres: role göre ilgili ekran setine yönlendirir.
export default function AnaSayfa() {
  return (
    <Suspense fallback={null}>
      <Yonlendir />
    </Suspense>
  );
}

async function Yonlendir(): Promise<null> {
  const aktor = await oturumAktoru();
  if (!aktor) redirect("/giris");
  redirect(aktor.tip === "admin" ? "/admin" : aktor.tip === "tedarikci" ? "/tedarikci" : "/katalog");
}

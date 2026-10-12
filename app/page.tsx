import { Suspense } from "react";
import { redirect } from "next/navigation";
import { oturumAktoru } from "@/lib/authz";

// Kök adres: doğrudan kataloğa (veya oturum varsa ilgili panele) yönlendirir.
export default function AnaSayfa() {
  return (
    <Suspense fallback={null}>
      <Yonlendir />
    </Suspense>
  );
}

async function Yonlendir(): Promise<null> {
  const aktor = await oturumAktoru();
  if (aktor?.tip === "admin") redirect("/admin");
  if (aktor?.tip === "tedarikci") redirect("/tedarikci");
  redirect("/katalog");
}

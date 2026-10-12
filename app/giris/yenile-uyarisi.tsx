"use client";

import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Oturum bayatladığında (rolü ya da yetkisi değişen kullanıcı) gösterilir.
export function YenileUyarisi() {
  if (useSearchParams().get("yenile") !== "1") return null;
  return (
    <Alert className="mb-4">
      <AlertDescription>Yetkiniz değişmiş olabilir. Lütfen yeniden giriş yapın.</AlertDescription>
    </Alert>
  );
}

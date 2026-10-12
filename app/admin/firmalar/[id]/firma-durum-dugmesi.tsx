"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { firmaDurumEylem } from "../actions";

export function FirmaDurumDugmesi({ id, aktif, uyari }: { id: number; aktif: boolean; uyari: string }) {
  const [bekliyor, baslat] = useTransition();
  return (
    <Button
      variant={aktif ? "outline" : "default"}
      disabled={bekliyor}
      onClick={() => {
        if (aktif && !window.confirm(uyari)) return;
        baslat(async () => {
          const r = await firmaDurumEylem(id, !aktif);
          if (r.hata) toast.error(r.hata);
          else if (r.tamam) toast.success(r.tamam);
        });
      }}
    >
      {aktif ? "Pasife al" : "Aktif et"}
    </Button>
  );
}

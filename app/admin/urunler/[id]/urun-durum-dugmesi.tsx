"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { urunDurumEylem } from "../actions";

export function UrunDurumDugmesi({ id, aktif }: { id: number; aktif: boolean }) {
  const [bekliyor, baslat] = useTransition();
  return (
    <Button
      variant={aktif ? "outline" : "default"}
      disabled={bekliyor}
      onClick={() => {
        if (aktif && !window.confirm("Ürün pasife alınsın mı? Katalogdan kalkar; kayıt silinmez.")) return;
        baslat(async () => {
          const r = await urunDurumEylem(id, !aktif);
          if (r.hata) toast.error(r.hata);
          else if (r.tamam) toast.success(r.tamam);
        });
      }}
    >
      {aktif ? "Pasife al" : "Aktif et"}
    </Button>
  );
}

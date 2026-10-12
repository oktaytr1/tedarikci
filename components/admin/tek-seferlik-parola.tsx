"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Parolayı bir kez gösterir. Sayfadan ayrılınca kaybolur; sunucu parolayı hiçbir zaman geri göndermez. */
export function TekSeferlikParola({ email, parola, children }: { email: string; parola: string; children?: React.ReactNode }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100" role="status">
      <p className="font-semibold">Bu parola bir daha gösterilmeyecek.</p>
      <p>Kopyalayıp kullanıcıya güvenli bir kanaldan iletin. Sayfadan ayrılınca ya da yenileyince kaybolur.</p>
      <div className="grid gap-1">
        <span className="text-xs">E-posta</span>
        <Input readOnly value={email} className="bg-background" onFocus={(e) => e.currentTarget.select()} aria-label="E-posta" />
      </div>
      <div className="grid gap-1">
        <span className="text-xs">Parola</span>
        <div className="flex gap-2">
          <Input readOnly value={parola} className="bg-background font-mono" onFocus={(e) => e.currentTarget.select()} aria-label="Parola" />
          <Button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(parola);
                setKopyalandi(true);
                toast.success("Parola kopyalandı.");
              } catch {
                toast.error("Kopyalanamadı; parolayı seçip elle kopyalayın.");
              }
            }}
          >
            {kopyalandi ? "Kopyalandı ✓" : "Kopyala"}
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

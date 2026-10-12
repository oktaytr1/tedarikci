"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { girisYap, type GirisDurumu } from "./actions";

export function GirisFormu() {
  const [durum, eylem, bekliyor] = useActionState<GirisDurumu, FormData>(girisYap, {});
  return (
    <form action={eylem} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="parola">Parola</Label>
        <Input id="parola" name="parola" type="password" autoComplete="current-password" required />
      </div>
      {durum.hata && (
        <Alert variant="destructive">
          <AlertDescription>{durum.hata}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={bekliyor}>
        {bekliyor ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>
    </form>
  );
}

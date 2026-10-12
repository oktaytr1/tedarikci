"use client";

import { useActionState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
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
        <Label htmlFor="email" className="text-xs font-semibold text-foreground/80">
          Kurumsal E-posta
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="yetkili@firma.com"
            autoComplete="username"
            className="pl-10 h-11 bg-background"
            required
            autoFocus
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="parola" className="text-xs font-semibold text-foreground/80">
          Parola
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="parola"
            name="parola"
            type="password"
            placeholder="••••••••••••"
            autoComplete="current-password"
            className="pl-10 h-11 bg-background"
            required
          />
        </div>
      </div>

      {durum.hata && (
        <Alert variant="destructive" className="py-2.5 text-xs">
          <AlertDescription>{durum.hata}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={bekliyor}
        className="mt-2 h-11 w-full font-semibold transition-all shadow-sm active:scale-[0.99]"
      >
        {bekliyor ? (
          "Doğrulanıyor…"
        ) : (
          <span className="inline-flex items-center gap-2">
            Portala Giriş Yap
            <ArrowRight className="size-4" />
          </span>
        )}
      </Button>
    </form>
  );
}

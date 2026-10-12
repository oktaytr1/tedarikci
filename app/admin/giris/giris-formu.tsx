"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { girisYap } from "./actions";

export function AdminGirisFormu() {
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [bekliyor, baslat] = useTransition();
  const router = useRouter();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (bekliyor) return;
        baslat(async () => {
          const r = await girisYap(sifre);
          if (r.hata) setHata(r.hata);
          else router.push("/admin/urunler");
        });
      }}
    >
      <div>
        <label htmlFor="sifre" className="mb-1 block text-sm font-medium">
          Admin şifresi
        </label>
        <Input
          id="sifre"
          type="password"
          autoFocus
          value={sifre}
          onChange={(e) => { setSifre(e.target.value); setHata(""); }}
          aria-invalid={!!hata || undefined}
        />
        {hata && <p className="mt-1 text-xs text-destructive">{hata}</p>}
      </div>
      <Button type="submit" disabled={bekliyor || !sifre.trim()}>
        {bekliyor ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>
    </form>
  );
}

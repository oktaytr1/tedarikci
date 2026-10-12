"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Alan } from "@/components/admin/alan";
import { TekSeferlikParola } from "@/components/admin/tek-seferlik-parola";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { kullaniciDurumEylem, kullaniciEpostaEylem, kullaniciParolaEylem } from "../actions";

const PAROLA_EN_AZ = 12;

export function EpostaFormu({ id, email }: { id: number; email: string }) {
  const [deger, setDeger] = useState(email);
  const [hata, setHata] = useState<string>();
  const [bekliyor, baslat] = useTransition();
  return (
    <form
      className="flex flex-col gap-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        baslat(async () => {
          const r = await kullaniciEpostaEylem(id, deger);
          if (r.hata) {
            setHata(r.alanlar?.email ?? r.hata);
            toast.error(r.hata);
          } else {
            setHata(undefined);
            toast.success(r.tamam!);
          }
        });
      }}
    >
      <Alan etiket="E-posta" htmlFor="eposta" hata={hata} not="Yanlış yazılmışsa düzeltin; eski ve yeni değer denetim kaydına düşer.">
        <Input id="eposta" type="email" value={deger} aria-invalid={!!hata || undefined} onChange={(e) => (setDeger(e.target.value), setHata(undefined))} />
      </Alan>
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={bekliyor || deger.trim().toLowerCase() === email}>
          E-postayı düzelt
        </Button>
      </div>
    </form>
  );
}

export function ParolaFormu({ id, email }: { id: number; email: string }) {
  const [parola, setParola] = useState("");
  const [goster, setGoster] = useState(false);
  const [hata, setHata] = useState<string>();
  const [belirlenen, setBelirlenen] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();
  // Sayfa <Activity> ile gizlenirken (başka sayfaya geçiş) parola bellekten ve DOM'dan silinir;
  // geri tuşu tek seferlik parolayı yeniden göstermez.
  useLayoutEffect(
    () => () => {
      setBelirlenen(null);
      setParola("");
    },
    [],
  );
  if (belirlenen) {
    return (
      <TekSeferlikParola email={email} parola={belirlenen}>
        <div>
          <Button size="sm" variant="outline" onClick={() => setBelirlenen(null)}>
            Kapat
          </Button>
        </div>
      </TekSeferlikParola>
    );
  }
  return (
    <form
      className="flex flex-col gap-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!window.confirm("Parola yeniden belirlensin mi? Kullanıcının mevcut parolası geçersiz olur.")) return;
        baslat(async () => {
          const r = await kullaniciParolaEylem(id, parola);
          if (r.hata) {
            setHata(r.alanlar?.parola ?? r.hata);
            toast.error(r.hata);
          } else {
            setBelirlenen(parola);
            setParola("");
            toast.success(r.tamam!);
          }
        });
      }}
    >
      <Alan etiket="Yeni parola" htmlFor="yeni-parola" hata={hata} not={`En az ${PAROLA_EN_AZ} karakter. Kaydedince bir kez gösterilir.`}>
        <div className="flex gap-2">
          <Input
            id="yeni-parola"
            type={goster ? "text" : "password"}
            autoComplete="new-password"
            value={parola}
            aria-invalid={!!hata || undefined}
            onChange={(e) => (setParola(e.target.value), setHata(undefined))}
          />
          <Button type="button" variant="outline" onClick={() => setGoster((g) => !g)}>
            {goster ? "Gizle" : "Göster"}
          </Button>
        </div>
      </Alan>
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={bekliyor || parola.length === 0}>
          Parolayı yeniden belirle
        </Button>
      </div>
    </form>
  );
}

export function KullaniciDurumDugmesi({ id, aktif, kendisi }: { id: number; aktif: boolean; kendisi: boolean }) {
  const [bekliyor, baslat] = useTransition();
  if (kendisi && aktif) return <p className="text-xs text-muted-foreground">Kendinizi pasife alamazsınız.</p>;
  return (
    <Button
      variant={aktif ? "outline" : "default"}
      size="sm"
      disabled={bekliyor}
      onClick={() => {
        if (aktif && !window.confirm("Kullanıcı pasife alınsın mı? Hemen giriş yapamaz hâle gelir.")) return;
        baslat(async () => {
          const r = await kullaniciDurumEylem(id, !aktif);
          if (r.hata) toast.error(r.hata);
          else toast.success(r.tamam!);
        });
      }}
    >
      {aktif ? "Pasife al" : "Aktif et"}
    </Button>
  );
}

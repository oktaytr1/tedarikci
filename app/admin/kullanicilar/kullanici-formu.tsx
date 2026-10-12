"use client";

// Kullanıcı açma. Rol seçimine göre firma: admin firmasız; tedarikçi ve alıcı için rolle uyumlu
// tipte aktif firma zorunlu. Tüm doğrulama sunucuda (lib/admin/kullanici.ts) yinelenir.

import Link from "next/link";
import { useLayoutEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Alan, secimSinifi } from "@/components/admin/alan";
import { TekSeferlikParola } from "@/components/admin/tek-seferlik-parola";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { kullaniciOlusturEylem } from "./actions";

type Firma = { id: number; unvan: string; tip: "tedarikci" | "alici" | "her_ikisi"; aktif: boolean };
type Rol = "admin" | "tedarikci" | "alici";
const PAROLA_EN_AZ = 12;

export function KullaniciFormu({ firmalar, varsayilanFirma }: { firmalar: Firma[]; varsayilanFirma: number | null }) {
  const baslangicRol: Rol | "" = varsayilanFirma
    ? firmalar.find((f) => f.id === varsayilanFirma)?.tip === "alici"
      ? "alici"
      : "tedarikci"
    : "";
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<Rol | "">(baslangicRol);
  const [firmaId, setFirmaId] = useState<number | null>(varsayilanFirma);
  const [parola, setParola] = useState("");
  const [goster, setGoster] = useState(false);
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [bekliyor, baslat] = useTransition();
  const [acilan, setAcilan] = useState<{ id: number; email: string; parola: string } | null>(null);

  // Next (cacheComponents) önceki sayfayı <Activity> ile gizli tutar ve geri tuşunda olduğu gibi
  // geri getirir. Parola "bir kez" gösterilmeli: sayfa gizlenirken panel ve yazılan parola silinir.
  useLayoutEffect(
    () => () => {
      setAcilan(null);
      setParola("");
    },
    [],
  );

  const uygunFirmalar = firmalar.filter(
    (f) => f.aktif && (rol === "tedarikci" ? f.tip !== "alici" : rol === "alici" ? f.tip !== "tedarikci" : false),
  );
  const temizle = (alan: string) =>
    setHatalar((h) => {
      const k = { ...h };
      delete k[alan];
      return k;
    });

  if (acilan) {
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <TekSeferlikParola email={acilan.email} parola={acilan.parola}>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/kullanicilar/${acilan.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Kullanıcıya git
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAcilan(null);
                setEmail("");
                setParola("");
              }}
            >
              Yeni kullanıcı aç
            </Button>
          </div>
        </TekSeferlikParola>
      </div>
    );
  }

  return (
    <form
      className="grid max-w-xl gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        baslat(async () => {
          const r = await kullaniciOlusturEylem({ email, rol, firmaId: rol === "admin" ? null : firmaId, parola });
          if (r.hata) {
            setHatalar(r.alanlar ?? {});
            toast.error(r.hata);
          } else if (r.id) {
            setAcilan({ id: r.id, email: email.trim().toLowerCase(), parola });
            setParola("");
          }
        });
      }}
    >
      <Alan etiket="E-posta" htmlFor="email" hata={hatalar.email} zorunlu not="Giriş adı. Küçük harfe çevrilir.">
        <Input id="email" type="email" autoComplete="off" value={email} aria-invalid={!!hatalar.email || undefined} onChange={(e) => (setEmail(e.target.value), temizle("email"))} />
      </Alan>
      <Alan etiket="Rol" htmlFor="rol" hata={hatalar.rol} zorunlu not="Rol ve firma sonradan değiştirilemez.">
        <select
          id="rol"
          className={secimSinifi}
          value={rol}
          aria-invalid={!!hatalar.rol || undefined}
          onChange={(e) => {
            const r = e.target.value as Rol | "";
            setRol(r);
            temizle("rol");
            temizle("firmaId");
            // Seçili firma yeni rolle uyumsuzsa bırakılır.
            const f = firmalar.find((x) => x.id === firmaId);
            if (r === "admin" || !f || (r === "tedarikci" && f.tip === "alici") || (r === "alici" && f.tip === "tedarikci")) setFirmaId(null);
          }}
        >
          <option value="">Seçin</option>
          <option value="alici">Alıcı — kataloğu görür</option>
          <option value="tedarikci">Tedarikçi — kendi ürünlerini görür</option>
          <option value="admin">Admin — platform yönetimi</option>
        </select>
      </Alan>
      <Alan
        etiket="Firma"
        htmlFor="firma"
        hata={hatalar.firmaId}
        zorunlu={rol !== "admin"}
        not={rol === "admin" ? "Admin bir firmaya bağlı olmaz." : rol ? "Yalnız role uygun tipte aktif firmalar listelenir." : "Önce rol seçin."}
      >
        <select
          id="firma"
          className={secimSinifi}
          disabled={!rol || rol === "admin"}
          value={firmaId ?? ""}
          aria-invalid={!!hatalar.firmaId || undefined}
          onChange={(e) => (setFirmaId(e.target.value ? Number(e.target.value) : null), temizle("firmaId"))}
        >
          <option value="">{rol === "admin" ? "—" : "Firma seçin"}</option>
          {uygunFirmalar.map((f) => (
            <option key={f.id} value={f.id}>
              {f.unvan}
            </option>
          ))}
        </select>
      </Alan>
      <Alan etiket="Parola" htmlFor="parola" hata={hatalar.parola} zorunlu not={`En az ${PAROLA_EN_AZ} karakter. Kayıttan sonra bir kez gösterilir.`}>
        <div className="flex gap-2">
          <Input
            id="parola"
            type={goster ? "text" : "password"}
            autoComplete="new-password"
            value={parola}
            aria-invalid={!!hatalar.parola || undefined}
            onChange={(e) => (setParola(e.target.value), temizle("parola"))}
          />
          <Button type="button" variant="outline" onClick={() => setGoster((g) => !g)}>
            {goster ? "Gizle" : "Göster"}
          </Button>
        </div>
        {parola && parola.length < PAROLA_EN_AZ && (
          <span className="text-xs text-muted-foreground">
            {parola.length}/{PAROLA_EN_AZ}
          </span>
        )}
      </Alan>
      <div>
        <Button type="submit" disabled={bekliyor}>
          {bekliyor ? "Açılıyor…" : "Kullanıcıyı aç"}
        </Button>
      </div>
    </form>
  );
}

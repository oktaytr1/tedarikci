"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Alan, secimSinifi } from "@/components/admin/alan";
import type { EylemSonucu } from "@/components/admin/tipler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { firmaGuncelleEylem, firmaOlusturEylem } from "./actions";

export type FirmaFormDegerleri = { unvan: string; vergiNo: string; tip: string; adres: string; telefon: string };

export function FirmaFormu({ firmaId, baslangic }: { firmaId?: number; baslangic: FirmaFormDegerleri }) {
  const [d, setD] = useState(baslangic);
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [bekliyor, baslat] = useTransition();
  const degistir = (alan: keyof FirmaFormDegerleri, v: string) => {
    setD((o) => ({ ...o, [alan]: v }));
    setHatalar((h) => {
      const k = { ...h };
      delete k[alan];
      return k;
    });
  };

  return (
    <form
      className="grid max-w-2xl gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        baslat(async () => {
          const r: EylemSonucu | undefined = firmaId !== undefined ? await firmaGuncelleEylem(firmaId, d) : await firmaOlusturEylem(d);
          if (r?.hata) {
            setHatalar(r.alanlar ?? {});
            toast.error(r.hata);
          } else if (r?.tamam) toast.success(r.tamam);
        });
      }}
    >
      <Alan etiket="Ünvan" htmlFor="unvan" hata={hatalar.unvan} zorunlu className="sm:col-span-2">
        <Input id="unvan" value={d.unvan} maxLength={200} aria-invalid={!!hatalar.unvan || undefined} onChange={(e) => degistir("unvan", e.target.value)} />
      </Alan>
      <Alan etiket="Vergi no" htmlFor="vergi" hata={hatalar.vergiNo} zorunlu not="10 hane (VKN) ya da 11 hane (TCKN); yalnız rakam.">
        <Input
          id="vergi"
          inputMode="numeric"
          // maxLength yok: yapıştırılan "0012 345 678" gibi boşluklu değer kırpılmadan önce kesilirdi.
          value={d.vergiNo}
          aria-invalid={!!hatalar.vergiNo || undefined}
          onChange={(e) => degistir("vergiNo", e.target.value.replace(/\D/g, ""))}
        />
      </Alan>
      <Alan etiket="Tip" htmlFor="tip" hata={hatalar.tip} zorunlu>
        <select id="tip" className={secimSinifi} value={d.tip} aria-invalid={!!hatalar.tip || undefined} onChange={(e) => degistir("tip", e.target.value)}>
          <option value="">Seçin</option>
          <option value="tedarikci">Tedarikçi</option>
          <option value="alici">Alıcı</option>
          <option value="her_ikisi">Her ikisi</option>
        </select>
      </Alan>
      <Alan etiket="Telefon" htmlFor="telefon" hata={hatalar.telefon} not="Alıcılar tedarikçinin telefonunu katalogda görür.">
        <Input id="telefon" type="tel" value={d.telefon} maxLength={50} onChange={(e) => degistir("telefon", e.target.value)} />
      </Alan>
      <Alan etiket="Adres" htmlFor="adres" hata={hatalar.adres} className="sm:col-span-2" not="Tedarikçinin adresi katalogda görünür; vergi no görünmez.">
        <Textarea id="adres" rows={3} maxLength={500} value={d.adres} onChange={(e) => degistir("adres", e.target.value)} />
      </Alan>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={bekliyor}>
          {bekliyor ? "Kaydediliyor…" : firmaId !== undefined ? "Değişiklikleri kaydet" : "Firmayı kaydet"}
        </Button>
      </div>
    </form>
  );
}

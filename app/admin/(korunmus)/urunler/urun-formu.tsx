"use client";

import { useRef, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { Alan, secimSinifi } from "@/components/admin/alan";
import type { EylemSonucu } from "@/components/admin/tipler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { KDV_ORANLARI } from "@/lib/kdv";
import { oranYaz, paraOku, paraYaz, satirHesapla } from "@/lib/money";
import { urunGuncelleEylem, urunOlusturEylem } from "./actions";

export type UrunFormDegerleri = {
  kod: string;
  ad: string;
  aciklama: string;
  kategori: string;
  birim: string;
  koliAdedi: string;
  minSiparis: string;
  listeFiyat: string;
  kdvOrani: string;
  fotografUrl: string;
};

type Props = {
  urunId?: number;
  baslangic: UrunFormDegerleri;
  oneriler: { kategoriler: string[]; birimler: string[] };
};

type FotoDurumu = "yok" | "gecersiz" | "yukleniyor" | "tamam" | "kirik";
const HTTPS_LINK = /^https:\/\/[^\s]+$/;
const FOTO_ZAMAN_ASIMI_MS = 8000;
const abonelikYok = () => () => {};

export function UrunFormu({ urunId, baslangic, oneriler }: Props) {
  const duzenleme = urunId !== undefined;
  const [d, setD] = useState(baslangic);
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [bekliyor, baslat] = useTransition();

  const [onizlemeUrl, setOnizlemeUrl] = useState(HTTPS_LINK.test(baslangic.fotografUrl) ? baslangic.fotografUrl : "");
  const [fotoSonuclari, setFotoSonuclari] = useState<Record<string, "tamam" | "kirik">>({});
  const [kirikOnay, setKirikOnay] = useState(false);
  const fotoZamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  const istemcide = useSyncExternalStore(abonelikYok, () => true, () => false);

  const url = d.fotografUrl.trim();
  const fotoDurumu: FotoDurumu = !url
    ? "yok"
    : !HTTPS_LINK.test(url) || url.length > 2000
      ? "gecersiz"
      : url !== onizlemeUrl
        ? "yukleniyor"
        : (fotoSonuclari[url] ?? "yukleniyor");

  function degistir<K extends keyof UrunFormDegerleri>(alan: K, deger: UrunFormDegerleri[K]) {
    setD((o) => ({ ...o, [alan]: deger }));
    if (hatalar[alan]) {
      setHatalar((h) => { const kalan = { ...h }; delete kalan[alan]; return kalan; });
    }
  }

  function fotoSonucu(u: string, sonuc: "tamam" | "kirik") {
    setFotoSonuclari((s) => (s[u] === sonuc ? s : { ...s, [u]: sonuc }));
  }

  function fotoDegistir(deger: string) {
    degistir("fotografUrl", deger);
    setKirikOnay(false);
    if (fotoZamanlayici.current) clearTimeout(fotoZamanlayici.current);
    const u = deger.trim();
    fotoZamanlayici.current = setTimeout(() => {
      setOnizlemeUrl(HTTPS_LINK.test(u) ? u : "");
      setTimeout(() => setFotoSonuclari((s) => (s[u] ? s : { ...s, [u]: "kirik" })), FOTO_ZAMAN_ASIMI_MS);
    }, 400);
  }

  let fiyatNotu: { hata?: string; metin?: string } = {};
  if (d.listeFiyat.trim()) {
    try {
      const f = paraOku(d.listeFiyat);
      const s = satirHesapla({ adet: "1", birim: "adet", birimFiyat: f, kdvOrani: d.kdvOrani });
      fiyatNotu = { metin: `KDV dahil ${paraYaz(s.kdvDahil)} TL (%${oranYaz(d.kdvOrani)} KDV ${paraYaz(s.kdvTutar)})` };
    } catch (e) {
      fiyatNotu = { hata: (e as Error).message };
    }
  }

  const kdvSecenekleri = (KDV_ORANLARI as readonly string[]).includes(baslangic.kdvOrani)
    ? [...KDV_ORANLARI]
    : [...KDV_ORANLARI, baslangic.kdvOrani];

  const kayitEngeli =
    fotoDurumu === "yukleniyor" ? "Fotoğraf kontrol ediliyor…"
    : fotoDurumu === "kirik" && !kirikOnay ? "Fotoğraf linki kırık görünüyor."
    : fotoDurumu === "gecersiz" ? "Fotoğraf linkini düzeltin."
    : null;

  function gonder(sonra: "detay" | "yeni") {
    if (bekliyor || kayitEngeli) return;
    baslat(async () => {
      let r: EylemSonucu | undefined;
      if (duzenleme) r = await urunGuncelleEylem(urunId, d);
      else r = await urunOlusturEylem(d, sonra);
      if (r?.hata) {
        setHatalar(r.alanlar ?? {});
        toast.error(r.hata);
      } else if (r?.tamam) {
        setHatalar({});
        toast.success(r.tamam);
      }
    });
  }

  return (
    <form
      className="grid gap-6 lg:grid-cols-[1fr_18rem]"
      noValidate
      onSubmit={(e) => { e.preventDefault(); gonder("detay"); }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Alan etiket="Ürün kodu" htmlFor="kod" hata={hatalar.kod} zorunlu>
          <Input id="kod" value={d.kod} maxLength={50} aria-invalid={!!hatalar.kod || undefined} onChange={(e) => degistir("kod", e.target.value)} />
        </Alan>
        <Alan etiket="Ürün adı" htmlFor="ad" hata={hatalar.ad} zorunlu>
          <Input id="ad" value={d.ad} maxLength={200} aria-invalid={!!hatalar.ad || undefined} onChange={(e) => degistir("ad", e.target.value)} />
        </Alan>

        <Alan etiket="Kategori" htmlFor="kategori" hata={hatalar.kategori}>
          <Input id="kategori" list="kategori-onerileri" autoComplete="off" value={d.kategori} maxLength={100} onChange={(e) => degistir("kategori", e.target.value)} />
          <datalist id="kategori-onerileri">
            {oneriler.kategoriler.map((k) => <option key={k} value={k} />)}
          </datalist>
        </Alan>
        <Alan etiket="Birim" htmlFor="birim" hata={hatalar.birim} zorunlu>
          <Input id="birim" list="birim-onerileri" autoComplete="off" value={d.birim} maxLength={30} aria-invalid={!!hatalar.birim || undefined} onChange={(e) => degistir("birim", e.target.value)} />
          <datalist id="birim-onerileri">
            {oneriler.birimler.map((b) => <option key={b} value={b} />)}
          </datalist>
        </Alan>

        <Alan etiket="Liste fiyatı (KDV hariç, TL)" htmlFor="fiyat" hata={hatalar.listeFiyat ?? fiyatNotu.hata} zorunlu not={fiyatNotu.metin ?? "ör. 1.234,56"}>
          <Input id="fiyat" inputMode="decimal" className="text-right tabular-nums" value={d.listeFiyat} aria-invalid={!!(hatalar.listeFiyat || fiyatNotu.hata) || undefined} onChange={(e) => degistir("listeFiyat", e.target.value)} />
        </Alan>
        <Alan etiket="KDV oranı" htmlFor="kdv" hata={hatalar.kdvOrani} zorunlu>
          <select id="kdv" className={secimSinifi} value={d.kdvOrani} onChange={(e) => degistir("kdvOrani", e.target.value)}>
            {kdvSecenekleri.map((o) => <option key={o} value={o}>%{oranYaz(o)}</option>)}
          </select>
        </Alan>

        <Alan etiket="Koli adedi" htmlFor="koli" hata={hatalar.koliAdedi} not="Bir kolideki adet (isteğe bağlı).">
          <Input id="koli" inputMode="numeric" value={d.koliAdedi} onChange={(e) => degistir("koliAdedi", e.target.value.replace(/\D/g, ""))} />
        </Alan>
        <Alan etiket="Min. sipariş" htmlFor="min" hata={hatalar.minSiparis} not={`Birim cinsinden (${d.birim || "birim"}).`}>
          <Input id="min" inputMode="decimal" value={d.minSiparis} onChange={(e) => degistir("minSiparis", e.target.value)} />
        </Alan>

        <Alan etiket="Açıklama" htmlFor="aciklama" hata={hatalar.aciklama} className="sm:col-span-2">
          <Textarea id="aciklama" rows={5} maxLength={5000} value={d.aciklama} onChange={(e) => degistir("aciklama", e.target.value)} />
        </Alan>

        <Alan etiket="Fotoğraf linki" htmlFor="foto" hata={hatalar.fotografUrl} className="sm:col-span-2" not="https:// ile başlayan tek görsel linki.">
          <Input id="foto" type="url" inputMode="url" placeholder="https://…" value={d.fotografUrl} aria-invalid={fotoDurumu === "gecersiz" || fotoDurumu === "kirik" || !!hatalar.fotografUrl || undefined} onChange={(e) => fotoDegistir(e.target.value)} />
        </Alan>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={bekliyor || !!kayitEngeli}>
            {bekliyor ? "Kaydediliyor…" : duzenleme ? "Değişiklikleri kaydet" : "Kaydet"}
          </Button>
          {!duzenleme && (
            <Button type="button" variant="secondary" disabled={bekliyor || !!kayitEngeli} onClick={() => gonder("yeni")}>
              Kaydet ve yeni ürün gir
            </Button>
          )}
          {kayitEngeli && <span className="text-xs text-muted-foreground">{kayitEngeli}</span>}
        </div>
      </div>

      <aside className="flex flex-col gap-2">
        <span className="text-sm font-medium">Fotoğraf önizlemesi</span>
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-muted/30">
          {istemcide && onizlemeUrl && fotoDurumu !== "gecersiz" && fotoDurumu !== "yok" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={onizlemeUrl} src={onizlemeUrl} alt="Ürün fotoğrafı önizlemesi" referrerPolicy="no-referrer" className={fotoDurumu === "tamam" ? "h-full w-full object-contain" : "hidden"} onLoad={() => fotoSonucu(onizlemeUrl, "tamam")} onError={() => fotoSonucu(onizlemeUrl, "kirik")} />
          )}
          {fotoDurumu === "yok" && <span className="p-4 text-center text-xs text-muted-foreground">Fotoğraf yok.</span>}
          {fotoDurumu === "yukleniyor" && <span className="text-xs text-muted-foreground">Yükleniyor…</span>}
          {fotoDurumu === "gecersiz" && <span className="p-4 text-center text-xs text-destructive">Link https:// ile başlamalı.</span>}
          {fotoDurumu === "kirik" && <span className="p-4 text-center text-xs text-destructive">Görsel yüklenemedi.</span>}
        </div>
        {fotoDurumu === "kirik" && (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 p-2 text-xs text-destructive" role="alert">
            <label className="flex items-center gap-2 text-foreground">
              <input type="checkbox" checked={kirikOnay} onChange={(e) => setKirikOnay(e.target.checked)} />
              Yine de kaydet
            </label>
          </div>
        )}
        {fotoDurumu === "tamam" && <span className="text-xs text-emerald-700 dark:text-emerald-400">Görsel yüklendi.</span>}
      </aside>
    </form>
  );
}

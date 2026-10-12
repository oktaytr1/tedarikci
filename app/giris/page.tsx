import { Suspense } from "react";
import { EyeOff, Lock, Mail, Phone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/marka/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { platformIletisim } from "@/lib/iletisim";
import { GirisFormu } from "./giris-formu";
import { YenileUyarisi } from "./yenile-uyarisi";

export default function GirisSayfasi() {
  const { eposta, telefon } = platformIletisim();

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-gradient-to-b from-zinc-50 via-background to-zinc-100/60 p-4 dark:from-background dark:via-background dark:to-zinc-950/40 sm:p-8">
      {/* Üst Marka Çubuğu */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between py-2">
        <Logo boyut="orta" baglanti={false} />
        <div className="hidden items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur sm:flex">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Kapalı Devre B2B Ağı</span>
        </div>
      </header>

      {/* Merkez: Giriş Kartı */}
      <main className="mx-auto my-auto flex w-full max-w-md flex-col items-center py-8">
        <Card className="w-full border-border/80 shadow-lg shadow-zinc-900/5 backdrop-blur-xs">
          <CardHeader className="space-y-1.5 pb-4 text-center">
            <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
              <Lock className="size-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Kurumsal Giriş</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Yalnızca platform yöneticisi tarafından yetkilendirilen firma kullanıcıları giriş yapabilir.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            <Suspense fallback={null}>
              <YenileUyarisi />
            </Suspense>

            <GirisFormu />

            {/* Bilgilendirme Notu */}
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-3 text-center text-xs text-muted-foreground leading-relaxed">
              Dışarıdan kullanıcı veya firma kaydı kabul edilmez. Hesap tanımlamaları merkezi olarak yapılır.
            </div>

            {/* İletişim / Destek */}
            {(eposta || telefon) && (
              <div className="border-t border-border/60 pt-3 text-center text-xs text-muted-foreground">
                <span>Erişim veya şifre desteği: </span>
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-3 font-medium text-foreground">
                  {eposta && (
                    <a href={`mailto:${eposta}`} className="inline-flex items-center gap-1 hover:underline">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {eposta}
                    </a>
                  )}
                  {telefon && (
                    <a href={`tel:${telefon.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 hover:underline">
                      <Phone className="size-3.5 text-muted-foreground" />
                      {telefon}
                    </a>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Güvenlik Rozetleri */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>256-Bit SSL Koruma</span>
          </div>
          <div className="flex items-center gap-1.5">
            <EyeOff className="size-4 text-zinc-500" />
            <span>Arama Motorlarına Kapalı</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="size-4 text-zinc-500" />
            <span>Firma İzolasyonu</span>
          </div>
        </div>
      </main>

      {/* Alt Bilgi */}
      <footer className="mx-auto w-full max-w-6xl py-3 text-center text-xs text-muted-foreground">
        © 2026 <span className="font-semibold text-foreground">tedarikcim.net.tr</span> · B2B Tedarikçi Pazarlama Platformu · Tüm hakları saklıdır.
      </footer>
    </div>
  );
}

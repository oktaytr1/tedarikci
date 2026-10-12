import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GirisFormu } from "./giris-formu";
import { YenileUyarisi } from "./yenile-uyarisi";

export default function GirisSayfasi() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Giriş</CardTitle>
          <CardDescription>Yetkili firma kullanıcıları içindir. Hesapları platform yöneticisi açar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <YenileUyarisi />
          </Suspense>
          <GirisFormu />
        </CardContent>
      </Card>
    </main>
  );
}

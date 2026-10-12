import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GirisFormu } from "./giris-formu";

export default function GirisSayfasi() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Giriş</CardTitle>
          <CardDescription>Admin ve tedarikçi kullanıcıları içindir. Hesapları admin açar.</CardDescription>
        </CardHeader>
        <CardContent>
          <GirisFormu />
        </CardContent>
      </Card>
    </main>
  );
}

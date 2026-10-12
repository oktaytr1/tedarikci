import { Suspense } from "react";
import { Building2, Package, Users } from "lucide-react";
import { PanelKabugu } from "@/components/oturum/panel-kabugu";
import { rolGerekli } from "@/lib/authz";

// Bu düzen yalnız yönlendirme ve görünüm içindir; asıl yetki her sorguda kapsam katmanındadır.
export default function AdminDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Yükleniyor…</div>}>
      <Korumali>{children}</Korumali>
    </Suspense>
  );
}

async function Korumali({ children }: { children: React.ReactNode }) {
  const aktor = await rolGerekli("admin");
  return (
    <PanelKabugu
      aktor={aktor}
      baslik="Admin paneli"
      menu={[
        { href: "/admin/urunler", etiket: "Ürünler", ikon: <Package className="size-4" /> },
        { href: "/admin/firmalar", etiket: "Firmalar", ikon: <Building2 className="size-4" /> },
        { href: "/admin/kullanicilar", etiket: "Kullanıcılar", ikon: <Users className="size-4" /> },
      ]}
    >
      {children}
    </PanelKabugu>
  );
}

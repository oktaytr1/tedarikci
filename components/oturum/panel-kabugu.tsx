import Link from "next/link";
import { Building2, Lock, Shield, ShoppingBag, Store, User } from "lucide-react";
import { Logo } from "@/components/marka/logo";
import { CikisDugmesi } from "@/components/oturum/cikis-dugmesi";
import { PanelNav, type MenuOgesi } from "@/components/oturum/panel-nav";
import { kapsamliDb } from "@/lib/scope";
import type { Aktor } from "@/lib/scope-cekirdek";

export type { MenuOgesi };

// Admin, alıcı ve tedarikçi ekran setlerinin (ve açık katalog ziyaretçisinin) modern kurumsal üst ve alt çubuğu.
export async function PanelKabugu({
  aktor = null,
  baslik,
  menu = [],
  children,
}: {
  aktor?: Aktor | null;
  baslik: string;
  menu?: MenuOgesi[];
  children: React.ReactNode;
}) {
  let ben: { email: string; firma: { unvan: string } | null } | null = null;

  if (aktor) {
    try {
      const vt = await kapsamliDb();
      ben = await vt.kullanici.findUnique({
        where: { id: aktor.kullaniciId },
        select: { email: true, firma: { select: { unvan: true } } },
      });
    } catch {
      ben = null;
    }
  }

  const rolBilgisi = aktor
    ? {
        admin: {
          etiket: "Admin",
          renk: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60",
          ikon: Shield,
        },
        alici: {
          etiket: "Yetkili Alıcı",
          renk: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60",
          ikon: ShoppingBag,
        },
        tedarikci: {
          etiket: "Tedarikçi",
          renk: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60",
          ikon: Store,
        },
      }[aktor.tip]
    : {
        etiket: "B2B Katalog",
        renk: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60",
        ikon: ShoppingBag,
      };

  const RolIkon = rolBilgisi.ikon;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-50/50 dark:bg-background">
      {/* Üst Kurumsal Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          {/* Sol: Logo + Rol Rozeti */}
          <div className="flex items-center gap-3">
            <Logo
              href={
                aktor?.tip === "admin"
                  ? "/admin/urunler"
                  : aktor?.tip === "tedarikci"
                    ? "/tedarikci"
                    : "/katalog"
              }
              altMetin={false}
              boyut="orta"
            />

            <span className="hidden h-5 w-px bg-border sm:block" />

            <div
              title={baslik}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rolBilgisi.renk}`}
            >
              <RolIkon className="size-3" />
              <span>{rolBilgisi.etiket}</span>
            </div>
          </div>

          {/* Orta: Gezinme Sekmeleri (Geniş Ekranda) */}
          {menu.length > 0 && (
            <div className="hidden md:flex md:items-center">
              <PanelNav menu={menu} />
            </div>
          )}

          {/* Sağ: Kullanıcı Kartı & Çıkış veya Giriş Bağlantısı */}
          <div className="flex items-center gap-2.5">
            {aktor ? (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-1.5 text-xs">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-2xs">
                    {ben?.firma ? (
                      <Building2 className="size-3.5 text-primary" />
                    ) : (
                      <User className="size-3.5 text-primary" />
                    )}
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="max-w-[130px] truncate font-semibold text-foreground sm:max-w-[180px]">
                      {ben?.firma?.unvan ?? "Platform Yönetimi"}
                    </span>
                    <span className="hidden max-w-[180px] truncate text-[11px] text-muted-foreground sm:inline">
                      {ben?.email}
                    </span>
                  </div>
                </div>

                <CikisDugmesi />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/giris"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-muted active:scale-95"
                >
                  <Lock className="size-3.5 text-muted-foreground" />
                  <span>Yönetici Girişi</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobil Alt Gezinme Sekmeleri */}
        {menu.length > 0 && (
          <div className="overflow-x-auto border-t border-border/50 px-4 py-2 md:hidden">
            <PanelNav menu={menu} />
          </div>
        )}
      </header>

      {/* Ana İçerik */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>

      {/* Kurumsal B2B Altbilgi (Footer) */}
      <footer className="border-t border-border/60 bg-background/80 py-5 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">tedarikcim.net.tr</span>
            <span>·</span>
            <span>Kapalı Devre B2B Tedarikçi & Ürün Kataloğu</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aktif B2B Kataloğu
            </span>
            <span>·</span>
            <span>© 2026 Tüm hakları saklıdır.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

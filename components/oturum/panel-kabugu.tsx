import Link from "next/link";
import {
  Building2,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  User,
} from "lucide-react";
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
      {/* En Üst Duyuru Çubuğu */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-1.5 text-[11px] text-zinc-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
              <Truck className="size-3" />
              Türkiye Geneli Toptan Sevkiyat
            </span>
            <span className="hidden text-zinc-600 sm:inline">·</span>
            <span className="hidden sm:inline">Doğrudan Üretici & Fabrika Toptan Satış Portalı</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/908503000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              <MessageCircle className="size-3" />
              <span>WhatsApp Toptan Sipariş Hattı</span>
            </a>
          </div>
        </div>
      </div>

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
                <a
                  href="https://wa.me/908503000000?text=Merhaba,%20tedarikcim.net.tr%20üzerinden%20toptan%20ürünler%20hakkında%20bilgi%20almak%20istiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-emerald-700 active:scale-95 sm:inline-flex"
                >
                  <MessageCircle className="size-3.5" />
                  <span>WhatsApp Hızlı Sipariş</span>
                </a>

                <Link
                  href="/giris"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-muted active:scale-95"
                >
                  <Lock className="size-3 text-muted-foreground" />
                  <span>Yetkili Girişi</span>
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

      {/* Zengin Kurumsal B2B Altbilgi (Footer) */}
      <footer className="border-t border-border/60 bg-card py-10 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
            {/* Sütun 1: Logo & Hakkında */}
            <div className="flex flex-col gap-3">
              <Logo boyut="orta" baglanti={false} />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Türkiye&apos;nin üretici ve toptancı firmalarını kurumsal alıcılarla buluşturan kapalı devre B2B toptan ticaret platformu.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-4" />
                <span>256-Bit SSL Doğrulanmış Portal</span>
              </div>
            </div>

            {/* Sütun 2: Popüler Kategoriler */}
            <div className="flex flex-col gap-2.5">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Toptan Kategoriler
              </h4>
              <ul className="flex flex-col gap-1.5 text-xs">
                <li><Link href="/katalog?kategori=Yağ+%26+Gıda" className="hover:text-foreground">Yağ & Temel Gıda</Link></li>
                <li><Link href="/katalog?kategori=Bakliyat" className="hover:text-foreground">Bakliyat & Tahıl</Link></li>
                <li><Link href="/katalog?kategori=Temizlik" className="hover:text-foreground">Endüstriyel Temizlik</Link></li>
                <li><Link href="/katalog?kategori=Ambalaj+%26+Kâğıt" className="hover:text-foreground">Kâğıt & Ambalaj Ürünleri</Link></li>
                <li><Link href="/katalog?kategori=İçecek+%26+Çay" className="hover:text-foreground">Çay & İçecek Grubu</Link></li>
              </ul>
            </div>

            {/* Sütun 3: B2B Avantajları */}
            <div className="flex flex-col gap-2.5">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Platform Avantajları
              </h4>
              <ul className="flex flex-col gap-1.5 text-xs">
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  <span>Aracı komisyonsuz doğrudan ticaret</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  <span>Koli & palet bazında toptan fiyatlar</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  <span>WhatsApp ile 1 dakikada sipariş</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  <span>Şeffaf KDV ve fatura detayları</span>
                </li>
              </ul>
            </div>

            {/* Sütun 4: İletişim & WhatsApp */}
            <div className="flex flex-col gap-2.5">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Toptan Sipariş & Destek
              </h4>
              <div className="flex flex-col gap-2 text-xs">
                <a
                  href="https://wa.me/908503000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/10 p-2 font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20"
                >
                  <MessageCircle className="size-4 shrink-0" />
                  <span>0850 300 00 00 (WhatsApp)</span>
                </a>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5 shrink-0" />
                  <span>Pazartesi - Cumartesi: 08:30 - 18:30</span>
                </p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  <span>destek@tedarikcim.net.tr</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-[11px] sm:flex-row">
            <div>
              © 2026 <strong className="font-semibold text-foreground">tedarikcim.net.tr</strong> · B2B Toptan Tedarikçi Pazarlama Platformu · Tüm hakları saklıdır.
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>Gizlilik & Güvenlik</span>
              <span>·</span>
              <span>Kullanım Koşulları</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Aktif Canlı Katalog</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Kapalı katalog — iyimser yönlendirme (JWT çerezine bakar, veritabanına gitmez):
//   1. Oturumsuz her istek giriş sayfasına yönlenir.
//   2. Rol alanları: /admin yalnız admin'e, /tedarikci yalnız tedarikçiye, /katalog yalnız alıcıya.
//      Kök adres ve başka rolün alanı, kullanıcının kendi alanına yönlenir.
//   JWT'deki rol bayatsa (rol sonradan değiştiyse) sayfa düzeyindeki kontrol girişe gönderir;
//   giriş sayfası proxy dışında olduğu için yönlendirme döngüsü oluşmaz.
// Bu ilk savunma hattıdır, yetki kontrolü DEĞİLDİR: JWT'deki rol giriş anındakidir. Rol, aktiflik ve
// firma kapsamı her sayfada (rolGerekli) ve her sorguda (lib/scope.ts) veritabanından denetlenir.
//
// Kapsam dışı: giriş sayfası, Auth.js uç noktaları, derleme çıktıları, favicon ve robots.txt.

import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ROL_ALANI: Record<string, string> = { admin: "/admin", tedarikci: "/tedarikci", alici: "/katalog" };

export default auth((istek) => {
  const kok = istek.nextUrl.origin;
  const rol = (istek.auth?.user as { rol?: unknown } | undefined)?.rol;
  // Oturum yok ya da rol taşımayan eski bir oturum: giriş.
  if (!istek.auth || typeof rol !== "string" || !ROL_ALANI[rol]) {
    return NextResponse.redirect(new URL("/giris", kok));
  }
  const yol = istek.nextUrl.pathname;
  const kendiAlani = ROL_ALANI[rol];
  const baskaAlan = Object.values(ROL_ALANI).some((a) => a !== kendiAlani && (yol === a || yol.startsWith(`${a}/`)));
  if (yol === "/" || baskaAlan) {
    return NextResponse.redirect(new URL(kendiAlani, kok));
  }
});

export const config = {
  matcher: ["/((?!giris$|api/auth/|_next/static/|_next/image|favicon\\.ico$|robots\\.txt$).*)"],
};

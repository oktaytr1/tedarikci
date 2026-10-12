// İyimser yönlendirme:
//   - Kök adres ve katalog herkese açık (açık katalog modu).
//   - Yönetim alanları (/admin, /tedarikci): Oturum yoksa /giris sayfasına yönlenir.

import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ROL_ALANI: Record<string, string> = { admin: "/admin", tedarikci: "/tedarikci", alici: "/katalog" };

export default auth((istek) => {
  const yol = istek.nextUrl.pathname;
  const kok = istek.nextUrl.origin;

  // Açık alanlar: Kök adres ve katalog girişi şartsız açıktır.
  if (yol === "/" || yol === "/katalog" || yol.startsWith("/katalog/")) {
    return NextResponse.next();
  }

  const rol = (istek.auth?.user as { rol?: unknown } | undefined)?.rol;

  // Korumalı alanlar (/admin, /tedarikci): Oturum yoksa giriş.
  if (!istek.auth || typeof rol !== "string" || !ROL_ALANI[rol]) {
    return NextResponse.redirect(new URL("/giris", kok));
  }

  const kendiAlani = ROL_ALANI[rol];
  const baskaAlan = Object.values(ROL_ALANI).some((a) => a !== kendiAlani && (yol === a || yol.startsWith(`${a}/`)));
  if (baskaAlan) {
    return NextResponse.redirect(new URL(kendiAlani, kok));
  }
});

export const config = {
  matcher: ["/((?!giris$|api/auth/|_next/static/|_next/image|favicon\\.ico$|robots\\.txt$).*)"],
};

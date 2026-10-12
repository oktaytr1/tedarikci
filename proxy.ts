// İyimser yönlendirme: oturum çerezi olmayanı giriş sayfasına gönderir.
// Bu bir yetki kontrolü DEĞİLDİR; rol ve firma kontrolü sunucuda (lib/authz.ts, lib/scope.ts) yapılır.
// /onay/* (alıcı onay sayfası) bilerek kapsam dışıdır: alıcı için oturum yoktur.

import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((istek) => {
  if (!istek.auth) {
    const giris = new URL("/giris", istek.nextUrl.origin);
    return NextResponse.redirect(giris);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/tedarikci/:path*"],
};

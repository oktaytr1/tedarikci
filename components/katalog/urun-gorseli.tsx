"use client";

// Ürün fotoğrafı: dış link. Eksik ya da kırık linkte kırık ikon yerine boş kutu gösterilir.
// Görsel yalnız tarayıcıda oluşturulur (sunucu HTML'inde olsaydı React bağlanmadan yüklenip
// onError/onLoad kaçabilirdi). Referer gönderilmez; görüntü sunucumuzdan geçmez.

import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const abonelikYok = () => () => {};

export function UrunGorseli({ url, alt, className }: { url: string | null; alt: string; className?: string }) {
  const istemcide = useSyncExternalStore(abonelikYok, () => true, () => false);
  const [durum, setDurum] = useState<"yukleniyor" | "tamam" | "kirik">("yukleniyor");
  const goster = istemcide && url && durum !== "kirik";
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)} aria-hidden={!goster || undefined}>
      {goster && (
        // next/image kullanılmıyor: dış ve keyfi hostlar; görüntü iyileştirici sunucumuzdan linke istek atardı.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setDurum("tamam")}
          onError={() => setDurum("kirik")}
          className={cn("h-full w-full object-contain transition-opacity", durum === "tamam" ? "opacity-100" : "opacity-0")}
        />
      )}
    </div>
  );
}

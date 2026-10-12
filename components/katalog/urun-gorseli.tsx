"use client";

// Ürün fotoğrafı: dış link. Eksik ya da kırık linkte kırık ikon yerine şık paket görseli gösterilir.
// Görsel yalnız tarayıcıda oluşturulur. Referer gönderilmez; görüntü sunucumuzdan geçmez.

import { useState, useSyncExternalStore } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

const abonelikYok = () => () => {};

export function UrunGorseli({
  url,
  alt,
  className,
}: {
  url: string | null;
  alt: string;
  className?: string;
}) {
  const istemcide = useSyncExternalStore(abonelikYok, () => true, () => false);
  const [durum, setDurum] = useState<"yukleniyor" | "tamam" | "kirik">("yukleniyor");
  const goster = istemcide && url && durum !== "kirik";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-muted/60 transition-colors",
        className,
      )}
    >
      {goster ? (
        // next/image kullanılmıyor: dış ve keyfi hostlar; SSRF riskini önlemek için tarayıcıda doğrudan yüklenir.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setDurum("tamam")}
          onError={() => setDurum("kirik")}
          className={cn(
            "h-full w-full object-contain p-2 transition-opacity duration-200",
            durum === "tamam" ? "opacity-100" : "opacity-0",
          )}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-muted-foreground/60 select-none">
          <Package className="size-8 stroke-[1.5]" />
          <span className="text-[10px] font-medium tracking-wider uppercase">Görsel Yok</span>
        </div>
      )}
    </div>
  );
}

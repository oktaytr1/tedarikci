import { Info, Mail, Phone } from "lucide-react";
import { platformIletisim } from "@/lib/iletisim";

/** Tedarikçi ekranı: ürün bilgisi düzeltmesi platform yöneticisi üzerinden yapılır. */
export function AdminIletisim({ kisa }: { kisa?: boolean }) {
  const { eposta, telefon } = platformIletisim();

  return (
    <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/30 p-4 shadow-2xs">
      <div className="flex items-start gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          <Info className="size-4" />
        </div>
        <div className="flex flex-col gap-1 text-xs">
          {!kisa && (
            <p className="font-semibold text-foreground">
              Ürün Girişi ve Bilgi Değişiklikleri Platform Yöneticisi Tarafından Yapılır
            </p>
          )}
          <p className="text-muted-foreground leading-relaxed">
            Fiyat güncellemesi, yeni ürün tanımı, teknik açıklama veya fotoğraf değişikliği talepleriniz için lütfen platform yöneticisi ile irtibata geçiniz.
          </p>

          {(eposta || telefon) && (
            <div className="mt-1 flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-foreground">
              {eposta && (
                <a
                  href={`mailto:${eposta}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1 transition-colors hover:bg-muted"
                >
                  <Mail className="size-3.5 text-muted-foreground" />
                  <span>{eposta}</span>
                </a>
              )}
              {telefon && (
                <a
                  href={`tel:${telefon.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1 transition-colors hover:bg-muted"
                >
                  <Phone className="size-3.5 text-muted-foreground" />
                  <span>{telefon}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

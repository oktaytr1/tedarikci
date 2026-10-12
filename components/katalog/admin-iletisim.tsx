import { platformIletisim } from "@/lib/iletisim";

/** Tedarikçi ekranı: ürün bilgisi düzeltmesi platform yöneticisi üzerinden yapılır. */
export function AdminIletisim({ kisa }: { kisa?: boolean }) {
  const { eposta, telefon } = platformIletisim();
  const baglanti = "font-medium text-foreground underline underline-offset-2";
  return (
    <div className="rounded-xl border bg-muted/30 p-3 text-sm">
      {!kisa && <p className="mb-1 font-medium">Ürün bilgilerini bu sürümde siz değiştiremezsiniz.</p>}
      <p className="text-muted-foreground">
        Fiyat, açıklama ya da fotoğraf düzeltmesi için platform yöneticisine yazın
        {eposta || telefon ? ": " : "."}
        {eposta && (
          <a className={baglanti} href={`mailto:${eposta}`}>
            {eposta}
          </a>
        )}
        {eposta && telefon && " · "}
        {telefon && (
          <a className={baglanti} href={`tel:${telefon.replace(/[^\d+]/g, "")}`}>
            {telefon}
          </a>
        )}
      </p>
    </div>
  );
}

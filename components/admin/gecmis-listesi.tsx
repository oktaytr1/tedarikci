import type { GecmisKaydi } from "@/lib/admin/gecmis";
import { zamanYaz } from "@/lib/tarih";

export function GecmisListesi({ kayitlar }: { kayitlar: GecmisKaydi[] }) {
  if (kayitlar.length === 0) return <p className="text-sm text-muted-foreground">Kayıt yok.</p>;
  return (
    <ol className="flex flex-col gap-3 text-sm">
      {kayitlar.map((k, i) => (
        <li key={i} className="border-b pb-2 last:border-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-medium">{k.islem}</span>
            <span className="text-xs text-muted-foreground">
              {k.kim} · {zamanYaz(new Date(k.zaman))}
            </span>
          </div>
          {k.degisiklikler.length > 0 && (
            <ul className="mt-1 flex flex-col gap-0.5 text-xs">
              {k.degisiklikler.map((d) => (
                <li key={d.alan}>
                  <span className="text-muted-foreground">{d.alan}:</span>{" "}
                  {d.eski && <span className="line-through decoration-muted-foreground/60">{d.eski}</span>}
                  {d.eski && " → "}
                  <span>{d.yeni}</span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}

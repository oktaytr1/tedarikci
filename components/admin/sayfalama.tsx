import Link from "next/link";

type Arama = Record<string, string | string[] | undefined>;

export function Sayfalama({ sp, toplam, sayfa, sayfaSayisi, birim }: { sp: Arama; toplam: number; sayfa: number; sayfaSayisi: number; birim: string }) {
  const adres = (n: number) => {
    const q = new URLSearchParams(
      Object.entries(sp).flatMap(([k, v]) => (v === undefined || k === "sayfa" ? [] : [[k, Array.isArray(v) ? v[0] : v]])),
    );
    q.set("sayfa", String(n));
    return `?${q}`;
  };
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {toplam} {birim}
      </span>
      {sayfaSayisi > 1 && (
        <div className="flex items-center gap-3">
          {sayfa > 1 && <Link href={adres(sayfa - 1)}>← Önceki</Link>}
          <span>
            Sayfa {sayfa} / {sayfaSayisi}
          </span>
          {sayfa < sayfaSayisi && <Link href={adres(sayfa + 1)}>Sonraki →</Link>}
        </div>
      )}
    </div>
  );
}

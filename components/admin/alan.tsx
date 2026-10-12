import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Etiket + alan + hata/not. Hata varsa notun yerine geçer. */
export function Alan(p: {
  etiket: string;
  htmlFor: string;
  hata?: string;
  not?: React.ReactNode;
  zorunlu?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", p.className)}>
      <Label htmlFor={p.htmlFor}>
        {p.etiket}
        {p.zorunlu && <span className="text-destructive">*</span>}
      </Label>
      {p.children}
      {p.hata ? (
        <p className="text-xs text-destructive" role="alert">
          {p.hata}
        </p>
      ) : p.not ? (
        <p className="text-xs text-muted-foreground">{p.not}</p>
      ) : null}
    </div>
  );
}

export const secimSinifi =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 aria-invalid:border-destructive";

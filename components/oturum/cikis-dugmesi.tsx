import { signOut } from "@/auth";
import { LogOut } from "lucide-react";

export function CikisDugmesi() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/giris" });
      }}
    >
      <button
        type="submit"
        title="Güvenli Çıkış Yap"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive active:scale-95"
      >
        <LogOut className="size-3.5" />
        <span className="hidden sm:inline">Çıkış</span>
      </button>
    </form>
  );
}

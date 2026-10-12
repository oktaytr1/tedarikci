import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function CikisDugmesi() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/giris" });
      }}
    >
      <Button type="submit" variant="outline" size="sm">
        Çıkış
      </Button>
    </form>
  );
}

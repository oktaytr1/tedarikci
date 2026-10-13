import { SiteAlt } from "@/components/site/site-alt";
import { SiteUst } from "@/components/site/site-ust";

export default function SiteDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteUst />
      <main className="flex-1">{children}</main>
      <SiteAlt />
    </div>
  );
}

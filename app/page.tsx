import { redirect } from "next/navigation";

// Ana sayfa direkt kataloğa yönlendirir.
export default function AnaSayfa() {
  redirect("/katalog");
}

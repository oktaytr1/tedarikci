import { redirect } from "next/navigation";

// Auth kontrolü artık (korunmus)/layout.tsx tarafından merkezi olarak yapılır.
export default function AdminAnaSayfa(): never {
  redirect("/admin/urunler");
}

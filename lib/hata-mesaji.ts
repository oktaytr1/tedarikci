import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ParaHatasi } from "@/lib/money";

export function hataMesaji(e: unknown): string {
  if (e instanceof ParaHatasi) return e.message;
  if (e instanceof ZodError) return e.issues.map((i) => i.message).join(" ");
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return "Bu kayıt zaten var (tekillik kuralı).";
    if (e.code === "P2025") return "Kayıt bulunamadı.";
  }
  console.error("[beklenmeyen hata]", e);
  return "Beklenmeyen bir hata oluştu.";
}

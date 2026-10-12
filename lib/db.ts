import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function olustur() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL tanımlı değil.");

  // Bulut PostgreSQL sağlayıcıları (Supabase, Neon vb.) self-signed
  // sertifika kullanabilir; pg.Pool'a ssl ayarı geçmek gerekir.
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export type Db = ReturnType<typeof olustur>;

const g = globalThis as unknown as { __tpDb?: Db };
export const db: Db = g.__tpDb ?? olustur();
if (process.env.NODE_ENV !== "production") g.__tpDb = db;

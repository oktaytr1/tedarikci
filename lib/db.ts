// Ham veritabanı istemcisi. KAPSAMSIZDIR: firma/rol filtresi uygulamaz.
//
// Uygulama kodu bunu doğrudan import etmez; okuma için lib/scope.ts → kapsamliDb(),
// yazma için lib/scope.ts → denetimli() kullanılır. İzinli istisnalar ESLint'te
// tanımlıdır (auth, oturum çözümü, onay servisi, betikler, testler).

import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";

/** Silme yasağının uygulama katmanı. Son savunma hattı DB tetikleyicisidir (silme_yasak). */
const silmeYasak = Prisma.defineExtension({
  name: "silme-yasak",
  query: {
    $allModels: {
      delete({ model }) {
        throw new Error(`Kayıt silinemez (${model}). Silmek yerine iptal işaretleyin.`);
      },
      deleteMany({ model }) {
        throw new Error(`Kayıt silinemez (${model}). Silmek yerine iptal işaretleyin.`);
      },
    },
  },
});

function olustur() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL tanımlı değil.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) }).$extends(silmeYasak);
}

export type Db = ReturnType<typeof olustur>;
/** Etkileşimli transaction içindeki istemci. */
export type DbTx = Parameters<Parameters<Db["$transaction"]>[0]>[0];

// Geliştirmede sıcak yeniden yüklemede bağlantı havuzu çoğalmasın.
const g = globalThis as unknown as { __tpDb?: Db };
export const db: Db = g.__tpDb ?? olustur();
if (process.env.NODE_ENV !== "production") g.__tpDb = db;

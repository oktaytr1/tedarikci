import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma CLI (migrate deploy/dev) bağlantısı. Uygulama bir bağlantı havuzu (PgBouncer, Neon pooler)
// arkasındaysa migration'lar doğrudan bağlantı ister: DIRECT_DATABASE_URL tanımlıysa o kullanılır.
// Uygulamanın kendisi her zaman DATABASE_URL kullanır (lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_DATABASE_URL || env("DATABASE_URL"),
  },
});

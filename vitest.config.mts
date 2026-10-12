import { fileURLToPath } from "node:url";
import "dotenv/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // server-only, Node test ortamında hata fırlatır; testler sunucu modüllerini doğrudan çalıştırır.
      "server-only": fileURLToPath(new URL("./tests/bos-modul.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/kurulum-global.ts"],
    // lib/db.ts DATABASE_URL okur; testlerde her zaman test veritabanına yönlendirilir.
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "" },
    // Veritabanı testleri aynı tabloları kullanır: dosyalar sırayla çalışır.
    fileParallelism: false,
  },
});

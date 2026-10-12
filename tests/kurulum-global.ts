// Veritabanı testlerinden önce test veritabanına migration'ları uygular.
import { execSync } from "node:child_process";
import "dotenv/config";

export function testVeritabaniAdresi(): string | null {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return null;
  const ad = new URL(url).pathname.replace(/^\//, "");
  if (!ad.endsWith("_test")) {
    throw new Error(`TEST_DATABASE_URL veritabanı adı _test ile bitmeli (şu an: "${ad}"). Testler tabloları siler.`);
  }
  return url;
}

export default function kurulumGlobal() {
  const url = testVeritabaniAdresi();
  if (!url) {
    console.warn("TEST_DATABASE_URL tanımlı değil: veritabanı testleri atlanacak.");
    return;
  }
  try {
    execSync("npx prisma migrate deploy", { stdio: "pipe", env: { ...process.env, DATABASE_URL: url } });
  } catch (e) {
    const cikti = (e as { stderr?: Buffer; stdout?: Buffer }).stderr?.toString() || "";
    throw new Error(
      `Test veritabanına migration uygulanamadı (${new URL(url).host}). ` +
        `Veritabanı ayakta mı? → docker compose up -d db\n` +
        `Yalnız veritabanı gerektirmeyen testler için: npm run test:para\n\n${cikti.slice(-800)}`,
    );
  }
}

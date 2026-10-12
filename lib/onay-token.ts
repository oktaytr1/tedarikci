// Onay bağlantısı anahtarı: 32 bayt kriptografik rastgele; veritabanında yalnız SHA-256 özeti durur.
// Ham anahtar yalnız üretildiği anda bir kez gösterilir (bağlantı metninde).

import { createHash, randomBytes } from "node:crypto";

export const ONAY_GECERLILIK_GUN = 7;

export function onayTokenUret(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: onayTokenHash(token) };
}

export function onayTokenHash(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// --- Proje kuralları (mimari doküman "Veri temeli") -------------------------

// Hiçbir kayıt silinmez: Prisma delete/deleteMany çağrısı ve ham SQL'de DELETE yasak.
// (`map.delete(k)` gibi Map/Set çağrıları etkilenmez: yalnız `x.y.delete()` biçimi yakalanır.)
const silmeYasagi = [
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.object.type='MemberExpression'][callee.property.name=/^(delete|deleteMany)$/]",
    message: "Kayıt silinmez: iptal_mi işaretleyin (mimari doküman, 'Veri temeli').",
  },
  {
    selector: "TemplateElement[value.raw=/\\bDELETE\\s+FROM\\b/i]",
    message: "Ham SQL'de DELETE yasak: kayıt silinmez.",
  },
  {
    selector: "Literal[value=/\\bDELETE\\s+FROM\\b/i]",
    message: "Ham SQL'de DELETE yasak: kayıt silinmez.",
  },
];

// Para ve KDV hesabı yalnız lib/money.ts içinde.
const paraAritmetigiYasagi = [
  {
    selector:
      "CallExpression[callee.property.name=/^(mul|times|div|dividedBy|plus|minus|sub|toDecimalPlaces|toDP|toFixed)$/]",
    message: "Para/KDV hesabı ve yuvarlama yalnız lib/money.ts içinde yapılır.",
  },
  {
    selector: "CallExpression[callee.object.name='Math'][callee.property.name=/^(round|floor|ceil|trunc)$/]",
    message: "Yuvarlama yalnız lib/money.ts içinde yapılır.",
  },
  {
    selector: "CallExpression[callee.name='parseFloat']",
    message: "Para float olarak okunmaz; lib/money.ts → paraOku / para kullanın.",
  },
];

// Ham (kapsamsız) veritabanı istemcisi ve aktör alan çekirdek: yalnız izinli dosyalar.
const hamDbYasagi = {
  paths: [
    {
      name: "@/lib/db",
      message: "Ham db kapsamsızdır. Okuma: kapsamliDb(), yazma: denetimli() (lib/scope.ts).",
    },
    {
      name: "@/lib/scope-cekirdek",
      importNames: ["kapsamla", "kapsamliDbAktorle", "denetimliAktorle"],
      message: "Aktörü oturumdan çözen lib/scope.ts kullanılır.",
    },
    {
      name: "@/generated/prisma/client",
      importNames: ["PrismaClient"],
      message: "Yeni PrismaClient açılmaz; lib/db.ts tek istemcidir.",
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "generated/**"]),

  {
    files: ["**/*.{ts,tsx,mts,js,mjs}"],
    rules: {
      "no-restricted-syntax": ["error", ...silmeYasagi, ...paraAritmetigiYasagi],
      "no-restricted-imports": ["error", hamDbYasagi],
    },
  },
  // lib/money.ts: para aritmetiğinin tek yeri.
  {
    files: ["lib/money.ts"],
    rules: { "no-restricted-syntax": ["error", ...silmeYasagi] },
  },
  // Ham db'ye erişmesi gereken altyapı dosyaları.
  {
    files: ["lib/db.ts", "lib/scope-cekirdek.ts", "lib/scope.ts", "lib/oturum-cozumu.ts", "auth.ts", "scripts/**"],
    rules: { "no-restricted-imports": "off" },
  },
  // Testler: aritmetik serbest değil (beklenen değerler sabit yazılır) ama çekirdeğe erişebilir.
  {
    files: ["tests/**"],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;

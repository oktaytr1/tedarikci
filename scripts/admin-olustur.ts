// İlk (ve sonraki) admin kullanıcısını komut satırından açar. Kayıt formu yoktur.
//
//   npm run admin:olustur -- eposta@ornek.com
//
// Parola terminalden gizli olarak sorulur; komut satırına ya da kabuk geçmişine yazılmaz.

import "dotenv/config";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { db } from "@/lib/db";
import { parolaHashle, parolaKuraliHatasi } from "@/lib/password";

function gizliSor(soru: string): Promise<string> {
  let sessiz = false;
  const cikis = new Writable({
    write(parca, kodlama, bitti) {
      if (!sessiz) process.stdout.write(parca, kodlama);
      bitti();
    },
  });
  const rl = createInterface({ input: process.stdin, output: cikis, terminal: true });
  return new Promise((coz) => {
    rl.question(soru, (cevap) => {
      rl.close();
      process.stdout.write("\n");
      coz(cevap);
    });
    sessiz = true;
  });
}

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Kullanım: npm run admin:olustur -- eposta@ornek.com");
    process.exit(1);
  }
  if (await db.kullanici.findUnique({ where: { email } })) {
    console.error(`${email} zaten kayıtlı.`);
    process.exit(1);
  }

  const parola = await gizliSor("Parola: ");
  const hata = parolaKuraliHatasi(parola);
  if (hata) {
    console.error(hata);
    process.exit(1);
  }
  if ((await gizliSor("Parola (tekrar): ")) !== parola) {
    console.error("Parolalar aynı değil.");
    process.exit(1);
  }

  const k = await db.$transaction(async (tx) => {
    const yeni = await tx.kullanici.create({
      data: { email, parola_hash: await parolaHashle(parola), rol: "admin" },
    });
    await tx.denetimKaydi.create({
      data: {
        kullanici_id: null,
        islem: "kullanici.admin_olustur_cli",
        tablo: "Kullanici",
        kayit_id: yeni.id,
        yeni: { email, rol: "admin" },
      },
    });
    return yeni;
  });
  console.log(`Admin oluşturuldu: #${k.id} ${k.email}`);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e);
  await db.$disconnect();
  process.exit(1);
});

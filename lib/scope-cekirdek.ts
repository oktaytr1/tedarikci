// Merkezi kapsam (scope) katmanının çekirdeği.
//
// Uygulama kodu bu dosyayı DOĞRUDAN kullanmaz: aktörü oturumdan çözen lib/scope.ts kullanılır.
// Buradaki fonksiyonlar aktörü parametre alır; yalnız lib/scope.ts ve testler import eder (ESLint).
//
// Kapsamlı istemci, Prisma istemcisinin yerine geçen bir sarmalayıcıdır:
//   - Yalnız sekiz model temsilcisini açar; $queryRaw / $executeRaw / $transaction yoktur.
//   - Tedarikçi ve alıcı: her sorguya rol filtresi zorla eklenir; ilişki gezintisi ve (bazı modellerde)
//     alanlar beyaz listeyle sınırlıdır. include/select/where/orderBy/cursor içinde izinsiz ilişkiye
//     ya da gizli alana uzanan sorgu reddedilir.
//       Tedarikçi: yalnız kendi firmasının ürünleri (ve kendi siparişleri).
//       Alıcı   : aktif tedarikçilerin aktif ürünleri + tedarikçilerin vitrin bilgisi (ünvan, adres,
//                 telefon; vergi no gizli). Operasyon tabloları ve denetim kaydı kapalı. Salt okunur.
//   - Yazma yalnız denetimli() içinde yapılır; her yazma aynı transaction'da denetim_kaydi'na düşer.
//   - delete / deleteMany / upsert / createMany yoktur.

import { Prisma } from "@/generated/prisma/client";
import { db, type DbTx } from "@/lib/db";

export type Aktor =
  | { tip: "admin"; kullaniciId: number }
  | { tip: "tedarikci"; kullaniciId: number; firmaId: number }
  | { tip: "alici"; kullaniciId: number; firmaId: number };

export class YetkiHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "YetkiHatasi";
  }
}

// ---------------------------------------------------------------------------
// Model ve ilişki haritası. tests/scope.test.ts bu haritanın schema.prisma ile
// birebir aynı olduğunu doğrular: şemaya ilişki eklenip buraya eklenmezse test kırılır.
// ---------------------------------------------------------------------------

export const MODELLER = {
  firma: "Firma",
  kullanici: "Kullanici",
  urun: "Urun",
  siparis: "Siparis",
  siparisSatir: "SiparisSatir",
  odeme: "Odeme",
  onay: "Onay",
  denetimKaydi: "DenetimKaydi",
} as const;

type ModelAnahtari = keyof typeof MODELLER;
type Model = (typeof MODELLER)[ModelAnahtari];

export const ILISKILER: Record<Model, Record<string, Model>> = {
  Firma: {
    kullanicilar: "Kullanici",
    urunler: "Urun",
    alici_siparisler: "Siparis",
    satici_siparisler: "Siparis",
    odedigi_odemeler: "Odeme",
    aldigi_odemeler: "Odeme",
  },
  Kullanici: { firma: "Firma", denetim_kayitlari: "DenetimKaydi" },
  Urun: { firma: "Firma", siparis_satirlari: "SiparisSatir" },
  Siparis: { alici: "Firma", satici: "Firma", satirlar: "SiparisSatir", odemeler: "Odeme", onaylar: "Onay" },
  SiparisSatir: { siparis: "Siparis", urun: "Urun" },
  Odeme: { siparis: "Siparis", odeyen: "Firma", alan: "Firma" },
  Onay: { siparis: "Siparis" },
  DenetimKaydi: { kullanici: "Kullanici" },
};

// ---------------------------------------------------------------------------
// Rol kuralları (admin kısıtsızdır)
// ---------------------------------------------------------------------------

type YazmaIzni = { islemler: ReadonlySet<string>; alanlar: ReadonlySet<string> };

type RolKurali = {
  ad: string;
  /** Kök sorguya eklenen zorunlu filtre; erişimi olmayan modelde hata fırlatır. */
  filtre: (model: Model) => object;
  /** Gezilebilecek ilişkiler. Listede olmayan ilişki include/select/where/orderBy içinde reddedilir. */
  iliskiIzni: Partial<Record<Model, ReadonlySet<string>>>;
  /**
   * Alan beyaz listesi olan modeller: yalnız bu alanlar seçilebilir, filtrelenebilir, sıralanabilir.
   * Seçim belirtilmezse bu alanlar seçilir; bu modellerde toplama (aggregate/groupBy) kapalıdır.
   */
  alanIzni: Partial<Record<Model, readonly string[]>>;
  yazma: Partial<Record<Model, YazmaIzni>>;
};

/** Kullanıcı kaydının rol sahibine görünen alanları (parola özeti hariç). */
const KULLANICI_ALANLARI = ["id", "firma_id", "email", "rol", "aktif", "olusturma", "guncelleme"] as const;
/** Alıcının tedarikçi firmalarda gördüğü vitrin alanları (vergi no gizli). */
export const FIRMA_VITRIN_ALANLARI = ["id", "unvan", "adres", "telefon"] as const;

const SATICI_TIPLERI = ["tedarikci", "her_ikisi"] as const;

function tedarikciKurali(a: Extract<Aktor, { tip: "tedarikci" }>): RolKurali {
  return {
    ad: "Tedarikçi",
    filtre(model) {
      switch (model) {
        case "Siparis":
          return { satici_firma_id: a.firmaId };
        case "SiparisSatir":
        case "Odeme":
          return { siparis: { satici_firma_id: a.firmaId } };
        case "Urun":
          return { firma_id: a.firmaId };
        case "Kullanici":
          return { id: a.kullaniciId };
        case "Firma":
          // Kendi firması + kendisine sipariş vermiş alıcıların firma kartı.
          return { OR: [{ id: a.firmaId }, { alici_siparisler: { some: { satici_firma_id: a.firmaId } } }] };
        default:
          throw new YetkiHatasi(`Tedarikçi ${model} verisine erişemez.`);
      }
    },
    // Kök sorgu kendi firmasına kısıtlı olduğundan bu kenarlar yalnız kendi verisine (ya da kendi
    // siparişinin alıcısının firma kartına) çıkar. Firma ve Urun yapraktır.
    iliskiIzni: {
      Siparis: new Set(["alici", "satici", "satirlar", "odemeler"]),
      SiparisSatir: new Set(["siparis", "urun"]),
      Odeme: new Set(["siparis", "odeyen", "alan"]),
      Kullanici: new Set(["firma"]),
      Firma: new Set(),
      // Ürün kökü kendi firmasına kısıtlı: firma ilişkisi yalnız kendi firma kartına çıkar.
      Urun: new Set(["firma"]),
    },
    alanIzni: { Kullanici: KULLANICI_ALANLARI },
    // Durum geçiş kuralları lib/siparis-durum.ts'te ayrıca uygulanır.
    yazma: {
      Siparis: {
        islemler: new Set(["update", "updateMany"]),
        alanlar: new Set(["durum", "fatura_no", "fatura_tarihi", "fatura_tutar"]),
      },
    },
  };
}

function aliciKurali(a: Extract<Aktor, { tip: "alici" }>): RolKurali {
  const aktifTedarikci = { durum: "aktif", tip: { in: [...SATICI_TIPLERI] } };
  return {
    ad: "Alıcı",
    filtre(model) {
      switch (model) {
        case "Urun":
          // Pasif ürün de, pasif tedarikçinin aktif ürünü de katalogda görünmez.
          return { aktif: true, firma: aktifTedarikci };
        case "Firma":
          return { OR: [{ id: a.firmaId }, aktifTedarikci] };
        case "Kullanici":
          return { id: a.kullaniciId };
        default:
          // Siparis, SiparisSatir, Odeme, Onay, DenetimKaydi
          throw new YetkiHatasi(`Alıcı ${model} verisine erişemez.`);
      }
    },
    // Ürün → firma (yaprak). Firma → urunler kapalı: iç içe include kök filtreyi atlar ve pasif
    // ürünleri döndürürdü; katalog sorguları doğrudan Urun üzerinden yapılır.
    iliskiIzni: {
      Urun: new Set(["firma"]),
      Kullanici: new Set(["firma"]),
      Firma: new Set(),
    },
    alanIzni: { Firma: FIRMA_VITRIN_ALANLARI, Kullanici: KULLANICI_ALANLARI },
    yazma: {},
  };
}

function rolKurali(aktor: Aktor): RolKurali | null {
  if (aktor.tip === "tedarikci") return tedarikciKurali(aktor);
  if (aktor.tip === "alici") return aliciKurali(aktor);
  return null;
}

// ---------------------------------------------------------------------------
// İşlem izinleri
// ---------------------------------------------------------------------------

const OKUMA = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);
const YAZMA = new Set(["create", "createManyAndReturn", "update", "updateMany"]);

// Onay bağlantısını admin üretir; ama yalnız bu alanlarla. Onayın kendisini (kullanildi_mi,
// onay_zamani, onaylanan_*) yalnız alıcı onay servisi yazar; o servis bu katmanı kullanmaz.
const ONAY_OLUSTURMA_ALANLARI = new Set(["siparis_id", "siparis", "token_hash", "son_gecerlilik"]);

// ---------------------------------------------------------------------------
// Argüman denetimi
// ---------------------------------------------------------------------------

type Nesne = Record<string, unknown>;
const nesneMi = (x: unknown): x is Nesne =>
  typeof x === "object" && x !== null && !Array.isArray(x) && !(x instanceof Date);

function iliskiIzinli(k: RolKurali, model: Model, alan: string): Model {
  const hedef = ILISKILER[model][alan];
  if (!k.iliskiIzni[model]?.has(alan)) {
    throw new YetkiHatasi(`${k.ad} ${model}.${alan} ilişkisine erişemez.`);
  }
  return hedef;
}

/** Alan beyaz listesi olan modelde izinsiz alana (seçim, filtre, sıralama, cursor) erişimi reddeder. */
function alanIzinli(k: RolKurali, model: Model, alan: string): void {
  const izin = k.alanIzni[model];
  if (izin && !izin.includes(alan)) throw new YetkiHatasi(`${k.ad} ${model}.${alan} alanına erişemez.`);
}

const ILISKI_FILTRELERI = ["some", "every", "none", "is", "isNot"];

function whereDenetle(k: RolKurali, model: Model, where: unknown): void {
  if (Array.isArray(where)) return where.forEach((w) => whereDenetle(k, model, w));
  if (!nesneMi(where)) return;
  for (const [alan, v] of Object.entries(where)) {
    if (alan === "AND" || alan === "OR" || alan === "NOT") {
      whereDenetle(k, model, v);
    } else if (alan in ILISKILER[model]) {
      const hedef = iliskiIzinli(k, model, alan);
      if (!nesneMi(v)) continue;
      const dogrudan: Nesne = {};
      for (const [fk, fv] of Object.entries(v)) {
        if (ILISKI_FILTRELERI.includes(fk)) whereDenetle(k, hedef, fv);
        else dogrudan[fk] = fv;
      }
      whereDenetle(k, hedef, dogrudan);
    } else {
      alanIzinli(k, model, alan);
    }
  }
}

function secimDenetle(k: RolKurali, model: Model, secim: unknown, tur: "select" | "include"): void {
  if (!nesneMi(secim)) return;
  for (const [alan, v] of Object.entries(secim)) {
    if (alan === "_count") {
      if (v === true) throw new YetkiHatasi(`${k.ad} _count: true kullanamaz; sayılacak ilişkileri açıkça seçin.`);
      if (nesneMi(v)) {
        if (v.select === true) throw new YetkiHatasi(`${k.ad} _count.select: true kullanamaz.`);
        if (nesneMi(v.select)) {
          for (const [ck, cv] of Object.entries(v.select)) {
            const hedef = iliskiIzinli(k, model, ck);
            if (nesneMi(cv)) whereDenetle(k, hedef, cv.where);
          }
        }
      }
    } else if (alan in ILISKILER[model]) {
      const hedef = iliskiIzinli(k, model, alan);
      // Alan kısıtlı modele iç içe erişimde alanlar açıkça seçilmeli (include: true tüm alanları getirirdi).
      if (k.alanIzni[hedef] && !(nesneMi(v) && nesneMi(v.select))) {
        throw new YetkiHatasi(`${k.ad} ${model}.${alan} için alanları select ile seçmeli.`);
      }
      if (nesneMi(v)) argsDenetle(k, hedef, v);
    } else if (tur === "select") {
      alanIzinli(k, model, alan);
    }
  }
}

function siralamaDenetle(k: RolKurali, model: Model, siralama: unknown): void {
  if (Array.isArray(siralama)) return siralama.forEach((s) => siralamaDenetle(k, model, s));
  if (!nesneMi(siralama)) return;
  for (const [alan, v] of Object.entries(siralama)) {
    if (alan in ILISKILER[model]) {
      siralamaDenetle(k, iliskiIzinli(k, model, alan), v);
    } else if (alan !== "_count") {
      alanIzinli(k, model, alan);
    }
  }
}

/** Rol sorgusundaki tüm ilişki gezintilerini ve kısıtlı alanları beyaz listeye göre denetler. */
function argsDenetle(k: RolKurali, model: Model, args: Nesne): void {
  if (k.alanIzni[model]) {
    if (args.omit !== undefined) throw new YetkiHatasi(`${k.ad} ${model} sorgusunda omit yerine select kullanmalı.`);
    if (nesneMi(args.cursor)) Object.keys(args.cursor).forEach((alan) => alanIzinli(k, model, alan));
    const distinct = Array.isArray(args.distinct) ? args.distinct : args.distinct ? [args.distinct] : [];
    distinct.forEach((alan) => alanIzinli(k, model, String(alan)));
  }
  whereDenetle(k, model, args.where);
  secimDenetle(k, model, args.include, "include");
  secimDenetle(k, model, args.select, "select");
  siralamaDenetle(k, model, args.orderBy);
}

// Yazma verisindeki iç içe (nested) işlemler: Onay ve denetim kaydına dolaylı yazma ve
// iç içe silme her rol için yasaktır.
const IC_ICE_SILME = new Set(["delete", "deleteMany"]);

function veriDenetle(model: Model, veri: unknown): void {
  if (Array.isArray(veri)) return veri.forEach((v) => veriDenetle(model, v));
  if (!nesneMi(veri)) return;
  for (const [k, v] of Object.entries(veri)) {
    const hedef = ILISKILER[model][k];
    if (!hedef) continue;
    if (hedef === "Onay" || hedef === "DenetimKaydi") {
      throw new YetkiHatasi(`${model}.${k} üzerinden ${hedef} yazılamaz.`);
    }
    if (!nesneMi(v)) continue;
    for (const [islem, ic] of Object.entries(v)) {
      if (IC_ICE_SILME.has(islem)) throw new YetkiHatasi(`İç içe silme yasak (${model}.${k}.${islem}).`);
      if (islem === "create" || islem === "connectOrCreate" || islem === "upsert") {
        const liste = Array.isArray(ic) ? ic : [ic];
        for (const oge of liste) {
          if (islem === "create") veriDenetle(hedef, oge);
          else if (nesneMi(oge)) {
            veriDenetle(hedef, oge.create);
            veriDenetle(hedef, oge.update);
          }
        }
      } else if (islem === "createMany" && nesneMi(ic)) {
        veriDenetle(hedef, ic.data);
      } else if (islem === "update" || islem === "updateMany") {
        const liste = Array.isArray(ic) ? ic : [ic];
        for (const oge of liste) veriDenetle(hedef, nesneMi(oge) && "data" in oge ? oge.data : oge);
      }
    }
  }
}

function filtreEkle(where: unknown, filtre: object): Nesne {
  if (!nesneMi(where)) return { AND: [filtre] };
  const mevcut = where.AND === undefined ? [] : Array.isArray(where.AND) ? where.AND : [where.AND];
  return { ...where, AND: [...mevcut, filtre] };
}

// ---------------------------------------------------------------------------
// Denetim kaydı
// ---------------------------------------------------------------------------

export type DenetimBaglami = {
  tx: DbTx;
  islem: string;
  ip?: string | null;
  kayitlar: Prisma.DenetimKaydiCreateManyInput[];
};

const GIZLI_ALANLAR = new Set(["parola_hash", "token_hash"]);

// Denetim kaydına alt kayıtlarıyla birlikte yazılan modeller (sipariş satırları siparişin parçasıdır).
const DENETIM_ALT_KAYIT: Partial<Record<Model, object>> = {
  Siparis: { satirlar: { orderBy: { id: "asc" } } },
};

/** Decimal → string, Date → ISO. `maskele` ile gizli alanlar "[gizli]" olur. */
export function jsonla(deger: unknown, maskele = true): Prisma.InputJsonValue | null {
  if (deger === null || deger === undefined) return null;
  if (deger instanceof Date) return deger.toISOString();
  if (Prisma.Decimal.isDecimal(deger)) return (deger as Prisma.Decimal).toString();
  if (Array.isArray(deger)) return deger.map((d) => jsonla(d, maskele)) as Prisma.InputJsonValue;
  if (typeof deger === "object") {
    const sonuc: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [k, v] of Object.entries(deger)) {
      sonuc[k] = maskele && GIZLI_ALANLAR.has(k) ? "[gizli]" : jsonla(v, maskele);
    }
    return sonuc as Prisma.InputJsonValue;
  }
  return deger as Prisma.InputJsonValue;
}

/** Değişen alanlar. Karşılaştırma maskesiz değerlerle yapılır (parola değişikliği de yakalanır), çıktı maskelidir. */
function fark(eskiSatir: Nesne, yeniSatir: Nesne): { eski: Nesne; yeni: Nesne } | null {
  const eskiHam = jsonla(eskiSatir, false) as Nesne;
  const yeniHam = jsonla(yeniSatir, false) as Nesne;
  const eskiMaskeli = jsonla(eskiSatir) as Nesne;
  const yeniMaskeli = jsonla(yeniSatir) as Nesne;
  const e: Nesne = {};
  const y: Nesne = {};
  for (const k of new Set([...Object.keys(eskiHam), ...Object.keys(yeniHam)])) {
    // guncelleme her yazmada değişir; arama_metni veritabanı tetikleyicisinin türettiği alandır.
    if (k === "guncelleme" || k === "arama_metni") continue;
    if (JSON.stringify(eskiHam[k]) !== JSON.stringify(yeniHam[k])) {
      e[k] = eskiMaskeli[k] ?? null;
      y[k] = yeniMaskeli[k] ?? null;
    }
  }
  return Object.keys(y).length ? { eski: e, yeni: y } : null;
}

type Temsilci = Record<string, (args: Nesne) => Promise<unknown>>;

function hamTemsilci(client: DbTx, anahtar: ModelAnahtari): Temsilci {
  return (client as unknown as Record<string, Temsilci>)[anahtar];
}

async function satirlariGetir(baglam: DenetimBaglami, anahtar: ModelAnahtari, model: Model, where: object) {
  const include = DENETIM_ALT_KAYIT[model];
  return (await hamTemsilci(baglam.tx, anahtar).findMany({
    where,
    ...(include ? { include } : {}),
    orderBy: { id: "asc" },
  })) as Nesne[];
}

async function denetimliYaz(
  baglam: DenetimBaglami,
  aktor: Aktor,
  anahtar: ModelAnahtari,
  model: Model,
  islem: string,
  args: Nesne,
  calistir: (args: Nesne) => Promise<unknown>,
): Promise<unknown> {
  const kaydet = (kayitId: number, eski: Nesne | null, yeni: Nesne | null) =>
    baglam.kayitlar.push({
      kullanici_id: aktor.kullaniciId,
      islem: baglam.islem,
      tablo: model,
      kayit_id: kayitId,
      eski: eski === null ? Prisma.DbNull : (eski as Prisma.InputJsonValue),
      yeni: yeni === null ? Prisma.DbNull : (yeni as Prisma.InputJsonValue),
      ip: baglam.ip ?? null,
    });

  if (islem === "create" || islem === "createManyAndReturn") {
    // Kimliği her durumda geri almak için select'e id eklenir.
    const a = nesneMi(args.select) ? { ...args, select: { ...args.select, id: true } } : args;
    const sonuc = await calistir(a);
    const idler = (Array.isArray(sonuc) ? sonuc : [sonuc]).map((r) => (r as Nesne).id as number);
    for (const satir of await satirlariGetir(baglam, anahtar, model, { id: { in: idler } })) {
      kaydet(satir.id as number, null, jsonla(satir) as Nesne);
    }
    return sonuc;
  }

  // update / updateMany: önce eski hal, sonra yazma, sonra yeni hal — hepsi aynı transaction'da.
  const eskiler =
    islem === "update"
      ? await hamTemsilci(baglam.tx, anahtar)
          .findUnique({ where: args.where as Nesne, ...(DENETIM_ALT_KAYIT[model] ? { include: DENETIM_ALT_KAYIT[model] } : {}) })
          .then((r) => (r ? [r as Nesne] : []))
      : await satirlariGetir(baglam, anahtar, model, args.where as object);
  const sonuc = await calistir(args);
  const idler = eskiler.map((r) => r.id as number);
  const yeniler = new Map((await satirlariGetir(baglam, anahtar, model, { id: { in: idler } })).map((r) => [r.id, r]));
  for (const eski of eskiler) {
    const d = fark(eski, yeniler.get(eski.id) ?? {});
    if (d) kaydet(eski.id as number, d.eski, d.yeni);
  }
  return sonuc;
}

// ---------------------------------------------------------------------------
// Kapsamlı istemci
// ---------------------------------------------------------------------------

type KapsamliTemsilci<K extends ModelAnahtari> = Pick<
  DbTx[K],
  Extract<
    keyof DbTx[K],
    | "findUnique"
    | "findUniqueOrThrow"
    | "findFirst"
    | "findFirstOrThrow"
    | "findMany"
    | "count"
    | "aggregate"
    | "groupBy"
    | "create"
    | "createManyAndReturn"
    | "update"
    | "updateMany"
    | "fields"
  >
>;

export type KapsamliDb = { readonly [K in ModelAnahtari]: KapsamliTemsilci<K> };

function islemCalistir(
  client: DbTx,
  aktor: Aktor,
  baglam: DenetimBaglami | null,
  anahtar: ModelAnahtari,
  islem: string,
  hamArgs: unknown,
): Promise<unknown> {
  const model = MODELLER[anahtar];
  let args: Nesne = nesneMi(hamArgs) ? { ...hamArgs } : {};
  const yazma = YAZMA.has(islem);

  if (!OKUMA.has(islem) && !yazma) {
    throw new YetkiHatasi(`${model}.${islem} kapsamlı istemcide yok (silme, upsert ve toplu ekleme kapalıdır).`);
  }
  if (yazma && !baglam) {
    throw new YetkiHatasi(`Yazma işlemleri yalnız denetimli() içinde yapılır (${model}.${islem}).`);
  }
  if (model === "DenetimKaydi" && yazma) {
    throw new YetkiHatasi("Denetim kaydına yalnız denetim katmanı yazar.");
  }
  if (model === "Onay" && yazma) {
    if (islem !== "create") throw new YetkiHatasi("Onay kaydı bu katmandan güncellenemez.");
    const veri = nesneMi(args.data) ? args.data : {};
    for (const alan of Object.keys(veri)) {
      if (!ONAY_OLUSTURMA_ALANLARI.has(alan)) {
        throw new YetkiHatasi(`Onay oluştururken ${alan} verilemez; onayı yalnız alıcı bağlantıdan verir.`);
      }
    }
  }
  if (yazma) veriDenetle(model, args.data);

  const k = rolKurali(aktor);
  if (k) {
    if (yazma) {
      const izin = k.yazma[model];
      if (!izin || !izin.islemler.has(islem)) throw new YetkiHatasi(`${k.ad} ${model}.${islem} yapamaz.`);
      const veri = nesneMi(args.data) ? args.data : {};
      for (const alan of Object.keys(veri)) {
        if (!izin.alanlar.has(alan)) throw new YetkiHatasi(`${k.ad} ${model}.${alan} alanını değiştiremez.`);
      }
    }
    const filtre = k.filtre(model); // erişimi olmayan modelde hata fırlatır
    const alanlar = k.alanIzni[model];
    if (alanlar) {
      // Kısıtlı modelde toplama ve sayım seçimi gizli alanın değerini dolaylı ele verebilir.
      if (islem === "aggregate" || islem === "groupBy") throw new YetkiHatasi(`${k.ad} ${model} üzerinde ${islem} yapamaz.`);
      if (islem === "count" && args.select !== undefined) throw new YetkiHatasi(`${k.ad} ${model} sayımında select kullanamaz.`);
      // Seçim yoksa yalnız izinli alanlar döner; include tek başına tüm alanları getireceği için select istenir.
      if (args.include !== undefined && args.select === undefined) {
        throw new YetkiHatasi(`${k.ad} ${model} sorgusunda include yerine select kullanmalı.`);
      }
      if (args.select === undefined && islem !== "count") {
        args = { ...args, select: Object.fromEntries(alanlar.map((a) => [a, true])) };
      }
    }
    argsDenetle(k, model, args);
    args = { ...args, where: filtreEkle(args.where, filtre) };
  }

  const temsilci = hamTemsilci(client, anahtar);
  const calistir = (a: Nesne) => temsilci[islem](a);
  return yazma && baglam ? denetimliYaz(baglam, aktor, anahtar, model, islem, args, calistir) : calistir(args);
}

/** Aktöre göre kapsamlanmış istemci. `baglam` yoksa salt okunurdur. */
export function kapsamla(client: DbTx, aktor: Aktor, baglam: DenetimBaglami | null = null): KapsamliDb {
  const sonuc: Partial<Record<ModelAnahtari, unknown>> = {};
  for (const anahtar of Object.keys(MODELLER) as ModelAnahtari[]) {
    const ham = hamTemsilci(client, anahtar) as unknown as Nesne;
    sonuc[anahtar] = new Proxy(
      {},
      {
        get(_hedef, islem) {
          if (islem === "fields") return ham.fields;
          if (typeof islem !== "string" || islem === "then") return undefined;
          return (args?: unknown) => {
            try {
              return islemCalistir(client, aktor, baglam, anahtar, islem, args);
            } catch (e) {
              return Promise.reject(e);
            }
          };
        },
      },
    );
  }
  return Object.freeze(sonuc) as KapsamliDb;
}

/** Salt okunur kapsamlı istemci. */
export function kapsamliDbAktorle(aktor: Aktor): KapsamliDb {
  return kapsamla(db as unknown as DbTx, aktor);
}

/**
 * Yazma yapılan tek yol: tek transaction, kapsamlı istemci ve otomatik denetim kaydı.
 * `fn` hata fırlatırsa yazmalar da denetim kayıtları da geri alınır.
 */
export async function denetimliAktorle<T, A extends Aktor = Aktor>(
  aktor: A,
  islem: string,
  fn: (vt: KapsamliDb, aktor: A) => Promise<T>,
  secenek: { ip?: string | null } = {},
): Promise<T> {
  if (!islem.trim()) throw new Error("denetimli(): işlem adı zorunlu.");
  return db.$transaction(async (tx) => {
    const baglam: DenetimBaglami = { tx: tx as DbTx, islem, ip: secenek.ip, kayitlar: [] };
    const sonuc = await fn(kapsamla(tx as DbTx, aktor, baglam), aktor);
    if (baglam.kayitlar.length) await tx.denetimKaydi.createMany({ data: baglam.kayitlar });
    return sonuc;
  });
}

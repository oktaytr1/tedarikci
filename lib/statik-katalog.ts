import { eslesir } from "@/lib/arama";
import type { KatalogDetayi, KatalogFiltresi, KatalogUrunu } from "@/lib/katalog";
import { KATALOG_SAYFA_BOYU } from "@/lib/katalog";
import { dbOran, dbPara, satirHesapla } from "@/lib/money";

export type StatikUrun = {
  id: number;
  kod: string;
  ad: string;
  kategori: string;
  birim: string;
  koliAdedi: number | null;
  minSiparis: string | null;
  listeFiyat: string; // KDV hariç
  kdvOrani: string;
  fotografUrl: string | null;
  aciklama: string | null;
  tedarikci: {
    id: number;
    unvan: string;
    adres: string | null;
    telefon: string | null;
  };
};

/**
 * tedarikcim.net.tr — Hızlı yayın ve veritabanı kurulumu gerektirmeyen hazır B2B ürün listesi.
 * İhtiyaca göre bu liste üzerinden doğrudan ürün ekleyip çıkarabilir, fiyatları ve telefonları güncelleyebilirsiniz.
 */
export const STATIK_URUNLER: StatikUrun[] = [
  {
    id: 1,
    kod: "AG-101",
    ad: "Ayçiçek Yağı 5 L Pet Şişe (4'lü Koli)",
    kategori: "Yağ & Gıda",
    birim: "adet",
    koliAdedi: 4,
    minSiparis: "4",
    listeFiyat: "389.90",
    kdvOrani: "1.00",
    fotografUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
    aciklama: "Birinci sınıf rafine ayçiçek yağı. Dayanıklı ambalaj, toptan sevkiyata uygun 4'lü sağlam koli.",
    tedarikci: {
      id: 1,
      unvan: "Anadolu Gıda & Yağ Sanayi Ltd. Şti.",
      adres: "Gıda Çarşısı No:42, Bornova / İzmir",
      telefon: "0850 300 00 00",
    },
  },
  {
    id: 2,
    kod: "AG-102",
    ad: "Riviera Zeytinyağı 5 L Teneke",
    kategori: "Yağ & Gıda",
    birim: "adet",
    koliAdedi: 4,
    minSiparis: "4",
    listeFiyat: "1150.00",
    kdvOrani: "1.00",
    fotografUrl: "https://images.unsplash.com/photo-1541256942802-7b29631f0bc5?w=600&auto=format&fit=crop&q=80",
    aciklama: "Ege yöresi zeytinlerinden üretilmiş natürel sızma ve rafine zeytinyağı harmanı. Yüksek ısıya dayanıklı teneke ambalaj.",
    tedarikci: {
      id: 1,
      unvan: "Anadolu Gıda & Yağ Sanayi Ltd. Şti.",
      adres: "Gıda Çarşısı No:42, Bornova / İzmir",
      telefon: "0850 300 00 00",
    },
  },
  {
    id: 3,
    kod: "BK-201",
    ad: "Baldo Pirinç 1 kg (12'li Koli)",
    kategori: "Bakliyat",
    birim: "adet",
    koliAdedi: 12,
    minSiparis: "12",
    listeFiyat: "89.50",
    kdvOrani: "1.00",
    fotografUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
    aciklama: "Gönen menşeili iri taneli A kalite baldo pirinç. 1 kg vakumlu paket, 12'li shrinkli koli.",
    tedarikci: {
      id: 1,
      unvan: "Anadolu Gıda & Yağ Sanayi Ltd. Şti.",
      adres: "Gıda Çarşısı No:42, Bornova / İzmir",
      telefon: "0850 300 00 00",
    },
  },
  {
    id: 4,
    kod: "BK-202",
    ad: "Kırmızı Mercimek 25 kg Çuval",
    kategori: "Bakliyat",
    birim: "kg",
    koliAdedi: null,
    minSiparis: "25",
    listeFiyat: "62.40",
    kdvOrani: "1.00",
    fotografUrl: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=600&auto=format&fit=crop&q=80",
    aciklama: "Yerli üretim birinci sınıf temizlenmiş kırmızı yaprak mercimek. 25 kg hava alan jüt/polipropilen çuvallarda.",
    tedarikci: {
      id: 1,
      unvan: "Anadolu Gıda & Yağ Sanayi Ltd. Şti.",
      adres: "Gıda Çarşısı No:42, Bornova / İzmir",
      telefon: "0850 300 00 00",
    },
  },
  {
    id: 5,
    kod: "BK-203",
    ad: "Nohut 8 mm Koçbaşı 25 kg Çuval",
    kategori: "Bakliyat",
    birim: "kg",
    koliAdedi: null,
    minSiparis: "25",
    listeFiyat: "78.90",
    kdvOrani: "1.00",
    fotografUrl: "https://images.unsplash.com/photo-1585672840545-a7b29a67a050?w=600&auto=format&fit=crop&q=80",
    aciklama: "İç Anadolu menşeili, kalibre edilmiş 8 mm iri taneli koçbaşı nohut. Çabuk pişen ince kabuklu kalite.",
    tedarikci: {
      id: 1,
      unvan: "Anadolu Gıda & Yağ Sanayi Ltd. Şti.",
      adres: "Gıda Çarşısı No:42, Bornova / İzmir",
      telefon: "0850 300 00 00",
    },
  },
  {
    id: 6,
    kod: "TG-301",
    ad: "Kristal Toz Şeker 50 kg Çuval",
    kategori: "Temel Gıda",
    birim: "adet",
    koliAdedi: null,
    minSiparis: "1",
    listeFiyat: "2149.00",
    kdvOrani: "1.00",
    fotografUrl: "https://images.unsplash.com/photo-1622484216805-4c03b1e770c6?w=600&auto=format&fit=crop&q=80",
    aciklama: "Pancar şekeri, beyaz kristal kuru toz şeker. Fabrika dolumu orijinal 50 kg çift katlı çuval.",
    tedarikci: {
      id: 1,
      unvan: "Anadolu Gıda & Yağ Sanayi Ltd. Şti.",
      adres: "Gıda Çarşısı No:42, Bornova / İzmir",
      telefon: "0850 300 00 00",
    },
  },
  {
    id: 7,
    kod: "TM-401",
    ad: "Endüstriyel Bulaşık Deterjanı 20 L",
    kategori: "Temizlik",
    birim: "adet",
    koliAdedi: 1,
    minSiparis: "1",
    listeFiyat: "540.00",
    kdvOrani: "20.00",
    fotografUrl: "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=600&auto=format&fit=crop&q=80",
    aciklama: "Sanayi tipi bulaşık makineleri için kireç önleyicili konsantre sıvı deterjan. Otel, restoran ve yemekhaneler için ideal.",
    tedarikci: {
      id: 2,
      unvan: "Ege Hijyen & Kimya Ürünleri San. A.Ş.",
      adres: "İOSB Kimyacılar Sanayi Sitesi No:18, Başakşehir / İstanbul",
      telefon: "0212 500 00 00",
    },
  },
  {
    id: 8,
    kod: "TM-402",
    ad: "Kıvamlı Çamaşır Suyu 5 kg (4'lü Koli)",
    kategori: "Temizlik",
    birim: "adet",
    koliAdedi: 4,
    minSiparis: "4",
    listeFiyat: "92.50",
    kdvOrani: "20.00",
    fotografUrl: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80",
    aciklama: "Yoğun formüllü hijyenik çamaşır suyu. Yüzeylerde uzun süre tutunur, derinlemesine temizlik ve koku giderme sağlar.",
    tedarikci: {
      id: 2,
      unvan: "Ege Hijyen & Kimya Ürünleri San. A.Ş.",
      adres: "İOSB Kimyacılar Sanayi Sitesi No:18, Başakşehir / İstanbul",
      telefon: "0212 500 00 00",
    },
  },
  {
    id: 9,
    kod: "TM-403",
    ad: "Antibakteriyel Sıvı Sabun 5 L",
    kategori: "Kişisel Bakım",
    birim: "adet",
    koliAdedi: 4,
    minSiparis: "4",
    listeFiyat: "145.00",
    kdvOrani: "20.00",
    fotografUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    aciklama: "pH 5.5 cilt dostu nemlendiricili sıvı el sabunu. Dispenser dolumuna uygun, gliserinli formül.",
    tedarikci: {
      id: 2,
      unvan: "Ege Hijyen & Kimya Ürünleri San. A.Ş.",
      adres: "İOSB Kimyacılar Sanayi Sitesi No:18, Başakşehir / İstanbul",
      telefon: "0212 500 00 00",
    },
  },
  {
    id: 10,
    kod: "AM-501",
    ad: "Z Katlama Dispenser Havlu Kâğıt (12'li Paket)",
    kategori: "Ambalaj & Kâğıt",
    birim: "adet",
    koliAdedi: 12,
    minSiparis: "1",
    listeFiyat: "349.90",
    kdvOrani: "10.00",
    fotografUrl: "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&auto=format&fit=crop&q=80",
    aciklama: "%100 saf selüloz çift katlı Z katlama kâğıt havlu. Paket içi 200 yaprak, koli içi 12 paket (toplam 2400 yaprak).",
    tedarikci: {
      id: 3,
      unvan: "Marmara Ambalaj & Kâğıt Sanayi",
      adres: "Keresteciler Sitesi 4. Blok No:12, Zeytinburnu / İstanbul",
      telefon: "0212 600 00 00",
    },
  },
  {
    id: 11,
    kod: "AM-502",
    ad: "Şeffaf Koli Bandı 45x100 m (72'li Koli)",
    kategori: "Ambalaj & Kâğıt",
    birim: "adet",
    koliAdedi: 72,
    minSiparis: "72",
    listeFiyat: "38.50",
    kdvOrani: "20.00",
    fotografUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80",
    aciklama: "Akrilik güçlü yapışkanlı 40 mikron ambalaj ve koli kapatma bandı. Soğuk ve sıcak depolama koşullarına dayanıklı.",
    tedarikci: {
      id: 3,
      unvan: "Marmara Ambalaj & Kâğıt Sanayi",
      adres: "Keresteciler Sitesi 4. Blok No:12, Zeytinburnu / İstanbul",
      telefon: "0212 600 00 00",
    },
  },
  {
    id: 12,
    kod: "IC-601",
    ad: "Demlik Süzen Çay 3 kg Gastronomi Boy",
    kategori: "İçecek & Çay",
    birim: "adet",
    koliAdedi: 4,
    minSiparis: "1",
    listeFiyat: "520.00",
    kdvOrani: "1.00",
    fotografUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
    aciklama: "Doğu Karadeniz ilk hasat yapraklarından harmanlanmış toptan demlik çay. Otel, kafe ve işletmeler için yoğun dem ve parlak renk.",
    tedarikci: {
      id: 1,
      unvan: "Anadolu Gıda & Yağ Sanayi Ltd. Şti.",
      adres: "Gıda Çarşısı No:42, Bornova / İzmir",
      telefon: "0850 300 00 00",
    },
  },
];

function urunKatalogUrunuYap(u: StatikUrun): KatalogUrunu {
  const s = satirHesapla({ adet: "1", birim: u.birim, birimFiyat: u.listeFiyat, kdvOrani: u.kdvOrani });
  return {
    id: u.id,
    kod: u.kod,
    ad: u.ad,
    kategori: u.kategori,
    birim: u.birim,
    listeFiyat: dbPara(u.listeFiyat),
    kdvOrani: dbOran(u.kdvOrani),
    kdvDahil: dbPara(s.kdvDahil),
    fotografUrl: u.fotografUrl,
    tedarikci: u.tedarikci.unvan,
    tedarikciId: u.tedarikci.id,
    aktif: true,
  };
}

export function statikKatalogListesi(f: KatalogFiltresi) {
  let sonuclar = [...STATIK_URUNLER];

  if (f.q) {
    sonuclar = sonuclar.filter((u) => eslesir(f.q!, u.kod, u.ad, u.kategori, u.tedarikci.unvan));
  }
  if (f.tedarikci) {
    sonuclar = sonuclar.filter((u) => u.tedarikci.id === f.tedarikci);
  }
  if (f.kategori) {
    sonuclar = sonuclar.filter((u) => u.kategori === f.kategori);
  }

  const toplam = sonuclar.length;
  const sayfa = f.sayfa ?? 1;
  // eslint-disable-next-line no-restricted-syntax -- sayfa sayısı
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / KATALOG_SAYFA_BOYU));
  const parca = sonuclar.slice((sayfa - 1) * KATALOG_SAYFA_BOYU, sayfa * KATALOG_SAYFA_BOYU);

  return {
    urunler: parca.map(urunKatalogUrunuYap),
    toplam,
    sayfa,
    sayfaSayisi,
  };
}

export function statikKatalogSecenekleri() {
  const tedarikciHaritasi = new Map<number, string>();
  const kategoriKumesi = new Set<string>();

  for (const u of STATIK_URUNLER) {
    tedarikciHaritasi.set(u.tedarikci.id, u.tedarikci.unvan);
    if (u.kategori) kategoriKumesi.add(u.kategori);
  }

  return {
    tedarikciler: Array.from(tedarikciHaritasi.entries())
      .map(([id, unvan]) => ({ id, unvan }))
      .sort((a, b) => a.unvan.localeCompare(b.unvan, "tr")),
    kategoriler: Array.from(kategoriKumesi).sort((a, b) => a.localeCompare(b, "tr")),
  };
}

export function statikKatalogDetayi(id: number): KatalogDetayi | null {
  const u = STATIK_URUNLER.find((item) => item.id === id);
  if (!u) return null;

  return {
    ...urunKatalogUrunuYap(u),
    aciklama: u.aciklama,
    koliAdedi: u.koliAdedi,
    minSiparis: u.minSiparis,
    tedarikciBilgisi: {
      unvan: u.tedarikci.unvan,
      adres: u.tedarikci.adres,
      telefon: u.tedarikci.telefon,
    },
  };
}

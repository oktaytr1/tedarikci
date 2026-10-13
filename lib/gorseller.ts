// Site fotoğrafları: Unsplash (ücretsiz Unsplash lisansı, ticari kullanım serbest).
// Kendi fotoğraflarınızı kullanmak için dosyaları public/ altına koyup `src` değerini "/dosya.jpg" yapın.

export const GORSELLER = {
  depo: {
    src: "https://images.unsplash.com/photo-1689942010216-dc412bb1e7a9?w=2000&q=80&auto=format&fit=crop",
    alt: "Raflarında paletli ürünler bulunan depo ve forklift",
  },
  market: {
    src: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=2000&q=80&auto=format&fit=crop",
    alt: "Ürünlerle dolu market reyonu",
  },
  uretim: {
    src: "https://images.unsplash.com/photo-1701328778019-e95dedbf5346?w=2000&q=80&auto=format&fit=crop",
    alt: "Üretim ve paketleme hattı",
  },
  sevkiyat: {
    src: "https://images.unsplash.com/photo-1616432043562-3671ea2e5242?w=2000&q=80&auto=format&fit=crop",
    alt: "Yolda ilerleyen tır",
  },
} as const;

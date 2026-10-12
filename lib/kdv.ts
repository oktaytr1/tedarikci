// KDV oranları: TEK sabit kaynak.
//
// Oranlar değiştiğinde buraya yeni oran EKLENİR (eskisi çıkarılabilir). Ürünlerin oranı toplu
// güncellenmez: eski ürün eski oranıyla kalır. Ürün düzenlenirken mevcut oranı listede olmasa da
// korunabilir; yeni ya da değiştirilen oran bu listeden seçilmek zorundadır (lib/admin/urun.ts).

/** Seçilebilir KDV oranları (yüzde, "dbOran" biçimi). */
export const KDV_ORANLARI = ["0.00", "1.00", "10.00", "20.00"] as const;

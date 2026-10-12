// Kullanıcıya gösterilebilir iş kuralı hataları (mesajları Türkçe ve güvenli).

export class IslemHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "IslemHatasi";
  }
}

/** Alan bazında hatalar; form ilgili alanın altında gösterir. Anahtar: "kod", "satirlar.2.adet" … */
export class GirisHatasi extends IslemHatasi {
  constructor(public alanlar: Record<string, string>) {
    super(Object.values(alanlar)[0] ?? "Girdi hatalı.");
    this.name = "GirisHatasi";
  }
}

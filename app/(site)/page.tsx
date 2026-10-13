import {
  Avantajlar,
  Cozumler,
  Hero,
  KimlerIcin,
  IletisimBandi,
  Karsilastirma,
  Kategoriler,
  NasilCalisirBolumu,
  SevkiyatBandi,
  Sss,
  VadeBandi,
} from "@/components/site/bolumler";

export default function AnaSayfa() {
  return (
    <>
      <Hero />
      <KimlerIcin />
      <Cozumler />
      <SevkiyatBandi />
      <NasilCalisirBolumu />
      <Karsilastirma />
      <VadeBandi />
      <Kategoriler />
      <Avantajlar />
      <Sss />
      <IletisimBandi />
    </>
  );
}

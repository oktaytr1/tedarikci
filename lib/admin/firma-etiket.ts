// İstemci bileşenlerinin de kullanabildiği etiketler (veritabanı bağımlılığı yok).
import type { FirmaTip, Rol } from "@/generated/prisma/enums";

export const FIRMA_TIP_ETIKETI: Record<FirmaTip, string> = { tedarikci: "Tedarikçi", alici: "Alıcı", her_ikisi: "Her ikisi" };
export const ROL_ETIKETI: Record<Rol, string> = { admin: "Admin", tedarikci: "Tedarikçi", alici: "Alıcı" };

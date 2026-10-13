import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { TELEFON_GORUNEN } from "@/lib/iletisim";

// WhatsApp, LinkedIn vb. link önizlemesinde görünen paylaşım görseli.
export const alt = "tedarikcim.net.tr — Marketlere vadeli mal tedariki, üreticilere anında nakit.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PaylasimGorseli() {
  const font = await readFile(path.join(process.cwd(), "assets/Geist-Regular.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#10253f",
          color: "white",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="84" height="51" viewBox="0 0 56 34">
            <path d="M8 26C16 4 40 4 48 26" fill="none" stroke="#ffffff" strokeWidth="3.6" strokeLinecap="round" />
            <circle cx="8" cy="26" r="5.5" fill="#ffffff" />
            <circle cx="48" cy="26" r="5.5" fill="#5fbf94" />
          </svg>
          <div style={{ display: "flex", fontSize: 44 }}>
            tedarikcim
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 68, lineHeight: 1.15, maxWidth: 980 }}>
          Marketlere vadeli mal tedariki, üreticilere anında nakit.
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#9fb0c3" }}>Faktoring destekli B2B toptan tedarik · {TELEFON_GORUNEN}</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Geist", data: font, style: "normal", weight: 400 }] },
  );
}

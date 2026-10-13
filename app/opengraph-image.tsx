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
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="6" fill="#ffffff" />
            <g fill="none" stroke="#10253f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" transform="translate(4 4)">
              <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
              <path d="M12 12 4 7.5" />
              <path d="m12 12 8-4.5" />
              <path d="M12 12v9" />
            </g>
          </svg>
          <div style={{ display: "flex", fontSize: 40 }}>
            tedarikcim.net.tr
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

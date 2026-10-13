import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE_ADRESI } from "@/lib/iletisim";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const ACIKLAMA = "Marketlere vadeli mal tedariki, üreticilere anında nakit. Faktoring destekli B2B toptan tedarik.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ADRESI),
  title: "tedarikcim.net.tr — Vadeli B2B Tedarik",
  description: ACIKLAMA,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "tedarikcim.net.tr",
    title: "tedarikcim.net.tr — Vadeli B2B Tedarik",
    description: ACIKLAMA,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

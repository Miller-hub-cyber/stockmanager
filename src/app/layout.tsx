import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AvisoOffline } from "@/components/AvisoOffline";
import "./globals.css";

const display = Archivo({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--fonte-display" });
const corpo = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--fonte-corpo" });
const dado = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--fonte-dado" });

export const metadata: Metadata = {
  title: "StockManager",
  description: "Controle de estoque operacional interno",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StockManager",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F5563",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${corpo.variable} ${dado.variable}`}>
      <body>
        <AvisoOffline />
        {children}
      </body>
    </html>
  );
}

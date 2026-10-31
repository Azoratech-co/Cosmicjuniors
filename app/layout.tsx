import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-heading" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Cosmic Juniors · Ask Cosmo",
  description: "Cosmo is a friendly AI space buddy that answers kids' questions about planets, stars, rockets and astronauts.",
};

export const viewport: Viewport = {
  themeColor: "#0B1026",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}

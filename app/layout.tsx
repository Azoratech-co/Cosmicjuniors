import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Newsreader, Public_Sans } from "next/font/google";
import "./globals.css";

// Fonts match the Figma page "v2 · Cosmo":
// Public Sans (US government open typeface) for the interface, Newsreader for headlines,
// IBM Plex Mono for small labels and sources.
const sans = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });
const serif = Newsreader({ subsets: ["latin"], weight: ["500"], variable: "--font-serif" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Cosmo · Cosmic Juniors",
  description:
    "Cosmo is a space guide for young explorers that answers with facts from NASA and links every source. Built for the NASA Space Apps Challenge 2026.",
};

export const viewport: Viewport = {
  themeColor: "#F5F3EE",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Fonts match the Figma page "v4 · Cosmo (pro)": Space Grotesk for headings, Inter for text.
const heading = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-heading" });
const body = Inter({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Cosmic Juniors · Ask Cosmo",
  description: "Cosmo tells the stories of the rovers, landers and experiments NASA left on Mars and the Moon, with facts and sources from NASA. Built for NASA Space Apps 2026.",
};

export const viewport: Viewport = {
  themeColor: "#0B1026",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}

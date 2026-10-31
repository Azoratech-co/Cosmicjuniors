import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter, as used in the Figma homepage "Cosmic Juniors — Homepage".
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Cosmic Juniors",
  description: "Cosmic Juniors: the next generation of space explorers. Built for the NASA Space Apps Challenge 2026.",
};

export const viewport: Viewport = {
  themeColor: "#06152F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}

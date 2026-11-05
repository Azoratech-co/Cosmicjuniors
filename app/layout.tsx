import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Fonts match the Figma page "v4 · Cosmo (pro)": Space Grotesk for headings, Inter for text.
// Headings use Inter too, matching the link-preview card.
const heading = Inter({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-heading" });
const body = Inter({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-body" });

const DESCRIPTION =
  "Cosmo tells the stories of the rovers, landers and experiments NASA left on Mars and the Moon, with facts and sources from NASA. Built for NASA Space Apps 2026.";

export const metadata: Metadata = {
  metadataBase: new URL("https://cosmic-juniors.vercel.app"),
  title: "Cosmic Juniors · Ask Cosmo",
  description: DESCRIPTION,
  applicationName: "Cosmic Juniors",
  openGraph: {
    type: "website",
    siteName: "Cosmic Juniors",
    title: "Ask Cosmo · Cosmic Juniors",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Ask Cosmo · Cosmic Juniors", description: DESCRIPTION },
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

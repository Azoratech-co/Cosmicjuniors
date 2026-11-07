import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// IBM Plex Sans for text, IBM Plex Mono for data (dates, sources, coordinates): a calm,
// technical "mission log" feel instead of a generic app look.
const heading = IBM_Plex_Sans({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-heading" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

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
  themeColor: "#080D22",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

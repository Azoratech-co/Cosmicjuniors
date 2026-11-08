import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans, Inter } from "next/font/google";
import "./globals.css";
import "./themes.css";
import { THEME_SCRIPT } from "@/lib/themes";

// Fonts for every design (see app/themes.css): each theme picks its heading, body and data fonts.
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--ff-plex" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--ff-mono" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--ff-inter" });
const serif = Fraunces({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--ff-serif" });

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
  themeColor: "#E8DCC8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plex.variable} ${mono.variable} ${inter.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

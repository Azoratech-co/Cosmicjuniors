import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans, Inter, Irish_Grover } from "next/font/google";
import "./globals.css";
import "./themes.css";
import "./site.css";
import { THEME_SCRIPT } from "@/lib/themes";

// Fonts for every design (see app/themes.css): each theme picks its heading, body and data fonts.
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--ff-plex" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--ff-mono" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--ff-inter" });
const grover = Irish_Grover({ subsets: ["latin"], weight: "400", variable: "--ff-grover" });
const serif = Fraunces({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--ff-serif" });

const DESCRIPTION =
  "Stories and facts about the machines NASA left on Mars and the Moon: read our stories, meet the explorers, ask Cosmo, and play mission games. NASA Space Apps 2026, Beirut.";

export const metadata: Metadata = {
  metadataBase: new URL("https://cosmic-juniors.vercel.app"),
  title: "Cosmic Juniors",
  description: DESCRIPTION,
  applicationName: "Cosmic Juniors",
  openGraph: {
    type: "website",
    siteName: "Cosmic Juniors",
    title: "Cosmic Juniors · The next generation of space explorers",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Cosmic Juniors · The next generation of space explorers", description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#E8DCC8",
  width: "device-width",
  initialScale: 1,
  // Keep the app at full view on phones: no auto-zoom when tapping the text box.
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plex.variable} ${mono.variable} ${inter.variable} ${serif.variable} ${grover.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

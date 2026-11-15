import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Starfield from "@/components/Starfield";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import styles from "./reader.module.css";

export const metadata: Metadata = {
  title: "Sojourner Comic Book · Cosmic Juniors",
  description: "A Little Explorer in a Vast, Unknown World. Read Sojourner’s journey in eight illustrated comic pages.",
};

// Let readers enlarge the lettering with their device's normal pinch zoom.
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 5 };

const pages = [
  { title: "A Journey Beyond the Blue Planet", width: 936, description: "Earth, the rocket launch, and the start of Pathfinder and Sojourner’s journey." },
  { title: "The Journey to Mars", width: 683, description: "Crossing interplanetary space and approaching Mars and Ares Vallis." },
  { title: "The Terrifying Descent", width: 936, description: "Atmospheric entry, parachute deployment, airbags, and landing on Mars." },
  { title: "My First Martian Morning", width: 936, description: "The landing site, the blocked ramp, and Sojourner’s first drive onto Martian soil." },
  { title: "The Secrets Beneath the Rocks", width: 936, description: "Examining Martian rocks and soil with the APXS instrument." },
  { title: "The Little Rover’s Biggest Challenges", width: 936, description: "Navigating rocky terrain with instructions relayed through Pathfinder." },
  { title: "Far Beyond Expectations", width: 936, description: "Photographs, measurements, and a mission that continued beyond its planned lifetime." },
  { title: "When the Messages Stopped", width: 936, description: "The end of communication and Sojourner’s legacy for later Mars explorers." },
];

export default function SojournerComicPage() {
  return (
    <div className="site-page">
      <Starfield />
      <SiteHeader />
      <main className={styles.reader}>
        <header className={styles.intro}>
          <p className="crumb">Cosmic Juniors · Comic Book</p>
          <h1 className="display-title">Sojourner</h1>
          <p className="page-tagline">A Little Explorer in a Vast, Unknown World</p>
          <p>Scroll to read or jump to a page. Select any comic image to open it at full size.</p>
          <Link className="btn-ghost cta" href="/story/sojourner">Explore the animated story</Link>
        </header>
        <nav className={styles.navigation} aria-label="Comic pages">
          <span>Page</span>
          {pages.map((page, i) => <a key={page.title} href={`#page-${i + 1}`} aria-label={`Page ${i + 1}: ${page.title}`}>{i + 1}</a>)}
        </nav>
        {pages.map((page, i) => {
          const src = `/story/sojourner/comic/page-${String(i + 1).padStart(2, "0")}.jpg`;
          return (
            <figure id={`page-${i + 1}`} key={page.title} className={styles.page}>
              <figcaption><span>Page {i + 1} of 8</span><h2>{page.title}</h2></figcaption>
              <a href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open comic page ${i + 1} at full size (new tab)`}>
                {/* Preserve each uploaded page in full without cropping or recompression. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} width={page.width} height={1024} loading={i === 0 ? "eager" : "lazy"} alt={`Comic page ${i + 1}: ${page.description}`} />
              </a>
            </figure>
          );
        })}
        <footer className={styles.end}>
          <Link className="btn-purple cta" href="/">Back to home</Link>
          <a className="btn-ghost cta" href="#page-1">Read again</a>
        </footer>
      </main>
      <SiteFooter />
    </div>
  );
}

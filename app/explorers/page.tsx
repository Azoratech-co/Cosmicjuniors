import type { Metadata } from "next";
import Link from "next/link";
import Starfield from "@/components/Starfield";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import Reveal from "@/components/site/Reveal";
import Planet from "@/components/site/Planet";
import JourneyPanel from "@/components/site/JourneyPanel";
import BackLink from "@/components/site/BackLink";
import { EXPLORERS } from "@/lib/explorers";

export const metadata: Metadata = {
  title: "Mars & Moon Explorers · Cosmic Juniors",
  description: "Meet the rovers and landers NASA sent to Mars and the Moon, and find out where they are today.",
};

const rovers = EXPLORERS.filter((e) => e.world === "mars" && e.kind === "Rover");
const landers = EXPLORERS.filter((e) => e.world === "mars" && e.kind !== "Rover");
const moon = EXPLORERS.filter((e) => e.world === "moon");

function Explore({ label = "Explore" }: { label?: string }) {
  return (
    <span className="explore">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/magnifier.svg" alt="" width={24} height={24} />
      {label}
    </span>
  );
}

export default function ExplorersPage() {
  return (
    <div className="site-page">
      <Starfield />
      <SiteHeader />
      <main className="site-main">
        <div className="page-top">
          <div>
            <h1 className="display-title">Mars &amp; Moon Explorers</h1>
            <span className="title-accent" aria-hidden="true" />
          </div>
          <BackLink href="/" label="Back to main page" />
        </div>

        <p className="section-label">Choose a rover</p>
        <div className="rovers-layout">
          <div className="rover-list">
            {rovers.map((r, i) => (
              <Reveal key={r.id} delay={i * 90}>
                <Link href={`/explorers/${r.id}`} className="rover-tab">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="rover-tab__art" src="/figma/rover-tab.svg" alt="" width={118} height={159} />
                  <span className="rover-tab__text">
                    <span className="rover-tab__name">Rover: {r.name}</span>
                    <span className="rover-tab__line">{r.cardLine}</span>
                    <Explore />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
          <JourneyPanel />
        </div>

        <hr className="section-rule" />
        <Reveal as="section">
          <h2 className="display-subtitle">More Mars Explorers</h2>
          <p className="section-eyebrow">These robots stayed in one place: they were landers!</p>
          <div className="mini-grid">
            {landers.map((l) => (
              <Link key={l.id} href={`/explorers/${l.id}`} className="mini-card mini-card--rose">
                <span className="chip-badge">Mars</span>
                <span className="mini-card__name">{l.name}</span>
                <span className="mini-card__line">{l.tagline}</span>
                <Explore label="Explore story" />
              </Link>
            ))}
          </div>
        </Reveal>

        <hr className="section-rule" />
        <Reveal as="section" className="moon-section">
          <div className="moon-head">
            <div>
              <h2 className="display-subtitle">Moon Explorers</h2>
              <p className="section-intro">Meet the NASA machines that still rest on Earth&apos;s Moon.</p>
            </div>
            <Planet kind="moon" size={155} className="moon-head__planet" />
          </div>
          <div className="mini-grid">
            {moon.map((m) => (
              <Link key={m.id} href={`/explorers/${m.id}`} className="mini-card mini-card--violet">
                <span className="chip-badge chip-badge--violet">Moon</span>
                <span className="mini-card__name">{m.name}</span>
                <span className="mini-card__line">{m.tagline}</span>
                <Explore label="Explore story" />
              </Link>
            ))}
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}

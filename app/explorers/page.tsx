import type { Metadata } from "next";
import Starfield from "@/components/Starfield";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import Reveal from "@/components/site/Reveal";
import JourneyPanel from "@/components/site/JourneyPanel";
import BackLink from "@/components/site/BackLink";
import { EXPLORERS, type World } from "@/lib/explorers";
import styles from "./page.module.css";
import ExplorerCard from "./ExplorerCard";

export const metadata: Metadata = {
  title: "Mars & Moon Explorers · Cosmic Juniors",
  description: "Meet the rovers and landers NASA sent to Mars and the Moon, and find out where they are today.",
};

const sections: { world: World; title: string; intro: string }[] = [
  {
    world: "mars",
    title: "Mars Explorers",
    intro: "Rovers drove across Mars. Landers studied it from one spot.",
  },
  {
    world: "moon",
    title: "Moon Explorers",
    intro: "Meet the vehicles that explored the Moon and visit the Apollo 11 landing site.",
  },
];

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

        {sections.map(({ world, title, intro }) => (
          <section key={world} aria-labelledby={world + "-explorers"} className={styles.section}>
            <div className={styles.heading}>
              <h2 id={world + "-explorers"} className="display-subtitle">{title}</h2>
              <p className="section-intro">{intro}</p>
            </div>
            <div className={styles.layout}>
              <ul className={styles.list}>
                {EXPLORERS.filter((explorer) => explorer.world === world).map((explorer, index) => (
                  <Reveal key={explorer.id} as="li" delay={index * 45}>
                    <ExplorerCard explorer={explorer} />
                  </Reveal>
                ))}
              </ul>
              <JourneyPanel destination={world} />
            </div>
          </section>
        ))}
        <p className={styles.credits}><a href="/explorer-art/image-credits.txt">Image credits</a></p>
      </main>
      <SiteFooter />
    </div>
  );
}

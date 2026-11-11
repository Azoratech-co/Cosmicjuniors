import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Starfield from "@/components/Starfield";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import Reveal from "@/components/site/Reveal";
import ChatCardArt from "@/components/site/ChatCardArt";
import { ABOUT_US, GROUP_VIDEOS } from "@/lib/home";

export const metadata: Metadata = {
  title: "Cosmic Juniors · Stories of the machines NASA left behind",
  description: "Read our stories, meet the rovers and landers NASA left on Mars and the Moon, ask Cosmo, and play mission games. NASA Space Apps 2026, Beirut.",
};

// Homepage, built from the team's Figma ("Cosmic Juniors | iPad 11-inch Portrait").

const MISSIONS: { n: string; title: string; text: string; cta: string; href: string; img?: string; alt?: string; art?: "cosmo" }[] = [
  {
    n: "01",
    title: "Storyline",
    text: "Follow Sojourner on its adventure on Mars.",
    cta: "Explore the story",
    href: "/story/sojourner",
    img: "/figma/home-storyline.png",
    alt: "Sojourner rover on the surface of Mars",
  },
  {
    n: "02",
    title: "Wiki",
    text: "Meet the rovers and landers that explored Mars and the Moon, and the other technology NASA left behind.",
    cta: "Discover the robots",
    href: "/explorers",
    img: "/figma/home-wiki.png",
    alt: "Mars rovers on the Martian surface",
  },
  {
    n: "03",
    title: "AI Chatbot",
    text: "Chat with Cosmo for more info, with real NASA sources.",
    cta: "Start chatting",
    href: "/chat",
    art: "cosmo",
  },
  {
    n: "04",
    title: "Games",
    text: "Rebuild Sojourner, launch a real rocket to Mars, and land like the real missions did.",
    cta: "Play now",
    href: "/games",
    img: "https://images-assets.nasa.gov/image/PIA24318/PIA24318~medium.jpg",
    alt: "Illustration of NASA's Perseverance rover firing its engines as it lands on Mars",
  },
];

export default function HomePage() {
  return (
    <div className="site-page">
      <Starfield />
      <SiteHeader />
      <main className="site-main">
        <section className="home-hero">
          <p className="home-eyebrow rise" style={{ animationDelay: "0ms" }}>The next generation of space explorers</p>
          <h1 className="home-title rise" style={{ animationDelay: "90ms" }}>Cosmic Juniors</h1>
          <p className="home-intro rise" style={{ animationDelay: "180ms" }}>
            Welcome to Cosmic Juniors, where curiosity takes us beyond Earth and onto the red planet. Discover the amazing robots
            that have explored Mars and the stories behind their missions. Follow Sojourner&apos;s pioneering journey, meet the other
            robotic explorers, and learn how they changed space science. Have a question? Ask our space chatbot and keep exploring!
          </p>
        </section>

        <h2 className="home-label">Choose your mission</h2>
        <div className="mission-grid">
          {MISSIONS.map((m, i) => (
            <Reveal key={m.n} delay={i * 90}>
              <Link href={m.href} className="mission-card">
                <span className="mission-card__media">
                  {m.img ? (
                    <Image src={m.img} alt={m.alt ?? ""} width={1536} height={864} sizes="(max-width: 700px) 92vw, 360px" />
                  ) : (
                    <ChatCardArt />
                  )}
                </span>
                <span className="mission-card__n">{m.n}</span>
                <span className="mission-card__title">{m.title}</span>
                <span className="mission-card__text">{m.text}</span>
                <span className="mission-card__cta">{m.cta} →</span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal as="section" className="home-videos">
          <h2 className="home-h2">Watch the group videos</h2>
          <p className="home-sub">Cosmic Juniors</p>
          {GROUP_VIDEOS.map((v) => (
            <div key={v.title} className="video-card">
              {v.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                  title={v.title}
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="video-card__play" src="/figma/play.svg" alt="" width={72} height={72} />
                  <span className="video-card__soon">Coming soon</span>
                </>
              )}
              <span className="video-card__title">{v.title}</span>
            </div>
          ))}
        </Reveal>

        <Reveal as="section" className="about-card">
          <h2 className="home-h2">About us</h2>
          <p>{ABOUT_US}</p>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}

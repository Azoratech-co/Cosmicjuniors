import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Starfield from "@/components/Starfield";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import Reveal from "@/components/site/Reveal";
import RoverHero from "@/components/site/RoverHero";
import BackLink from "@/components/site/BackLink";
import { EXPLORERS, explorerFacts, explorerSources, getExplorer } from "@/lib/explorers";
import { getTopic } from "@/lib/cosmo/knowledge";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return EXPLORERS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = getExplorer((await params).id);
  if (!e) return {};
  return { title: `${e.title} · Cosmic Juniors`, description: `${e.tagline}. ${e.meet}` };
}

export default async function ExplorerPage({ params }: Props) {
  const e = getExplorer((await params).id);
  if (!e) notFound();
  const main = getTopic(e.main)!;
  const facts = explorerFacts(e);
  const sources = explorerSources(e);
  const others = EXPLORERS.filter((x) => x.world === e.world && x.id !== e.id).slice(0, 3);

  return (
    <div className="site-page">
      <Starfield />
      <SiteHeader />
      <main className="site-main site-main--narrow">
        <div className="page-top">
          <div>
            <p className="crumb">
              <Link href="/explorers">{e.world === "moon" ? "Moon explorers" : "Mars explorers"}</Link> / {e.name}
            </p>
            <h1 className="display-title">{e.title}</h1>
            <p className="page-tagline">{e.tagline}</p>
            <span className="title-accent" aria-hidden="true" />
          </div>
          <BackLink href="/explorers" label="Back to explorers" />
        </div>

        <Reveal>
          <RoverHero world={e.world} badge={e.badge} />
        </Reveal>

        <Reveal className="info-card">
          <h2 className="info-card__label">Meet {e.name}</h2>
          <p className="info-card__lead">{e.meet}</p>
        </Reveal>

        <div className="info-pair">
          <Reveal className="info-card" delay={60}>
            <h2 className="info-card__label">{e.dates[0].label === "Missions" ? "Missions" : "Launch & landing"}</h2>
            <dl className="dates">
              {e.dates.map((d) => (
                <div key={d.label}>
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal className="info-card" delay={140}>
            <h2 className="info-card__label">The robot&apos;s job</h2>
            <p>{e.job}</p>
          </Reveal>
        </div>

        {main.whereNow && (
          <Reveal className="where-banner">
            <span className="where-banner__label">Where it is now</span>
            <span className="where-banner__place">{main.whereNow.place}</span>
            <span className="where-banner__status">{main.whereNow.status}</span>
          </Reveal>
        )}

        <Reveal className="section-banner">
          <h2>{facts.length} amazing discoveries</h2>
        </Reveal>
        <ol className="facts-list">
          {facts.map((f, i) => (
            <Reveal as="li" key={i} delay={i * 70} className="fact-row">
              <span className="fact-row__n">{String(i + 1).padStart(2, "0")}</span>
              <span className="fact-row__body">
                <span className="fact-row__text">{f.text}</span>
                <span className="fact-row__cite">
                  {f.publisher} · {f.source}
                </span>
              </span>
            </Reveal>
          ))}
        </ol>

        <Reveal className="photo-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={main.image.src} alt={main.image.alt} loading="lazy" />
          <span className="photo-card__cap">
            {main.image.alt} · Photo: {main.image.credit}
          </span>
        </Reveal>

        <Reveal className="cta-row">
          <Link className="btn-purple cta" href={`/chat?q=${encodeURIComponent(`Tell me about ${e.name}`)}`}>
            Ask Cosmo about {e.name}
          </Link>
          {e.storyId && (
            <Link className="btn-ghost cta" href={`/story/${e.storyId}`}>
              Read {e.name}&apos;s story
            </Link>
          )}
        </Reveal>

        <Reveal className="sources-panel">
          <h2 className="info-card__label">Official sources · Check the facts</h2>
          <ul>
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title}
                </a>
                <span> · {s.publisher}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {others.length > 0 && (
          <section className="more-explorers">
            <h2 className="display-subtitle">More explorers</h2>
            <div className="mini-grid">
              {others.map((o) => (
                <Link key={o.id} href={`/explorers/${o.id}`} className={`mini-card ${o.world === "moon" ? "mini-card--violet" : "mini-card--rose"}`}>
                  <span className={`chip-badge${o.world === "moon" ? " chip-badge--violet" : ""}`}>{o.world === "moon" ? "Moon" : "Mars"}</span>
                  <span className="mini-card__name">{o.name}</span>
                  <span className="mini-card__line">{o.tagline}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

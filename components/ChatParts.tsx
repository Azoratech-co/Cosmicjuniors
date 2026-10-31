"use client";

import { ArrowRightIcon, ExternalIcon, PlusIcon, RoverIcon } from "./Icons";
import { STARTERS } from "@/lib/starters";
import type { ChatMessage, Source } from "@/lib/types";

// Chat building blocks. Each maps to a component in the Figma page "v2 · Cosmo".

/** Figma: Avatar/Cosmo */
export function Avatar({ size = 32 }: { size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size }} aria-hidden="true">
      <RoverIcon size={Math.round(size * 0.62)} />
    </span>
  );
}

/** Figma: Top Bar */
export function TopBar({ onNew }: { onNew: () => void }) {
  return (
    <header className="topbar">
      <Avatar />
      <div className="topbar__title">
        <span className="t-heading">Cosmo</span>
        <span className="t-small c-secondary">Answers from NASA sources</span>
      </div>
      <button className="btn-outline t-button" onClick={onNew}>
        <PlusIcon /> New
      </button>
    </header>
  );
}

const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Figma: Card/Source */
export function SourceCard({ source }: { source: Source }) {
  const domain = new URL(source.url).hostname.replace(/^www\./, "");
  return (
    <a className="source" href={source.url} target="_blank" rel="noopener noreferrer">
      {source.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="source__photo" src={source.image.src} alt={source.image.alt} loading="lazy" />
      )}
      <span className="source__text">
        <span className="t-label c-accent">Source · {source.publisher}</span>
        <span className="t-body-strong">{source.title}</span>
        <span className="t-small c-secondary">{source.fact}</span>
        <span className="source__meta t-label c-tertiary">
          {domain} <ExternalIcon />
          {source.image && <span className="source__credit">· Photo {source.image.credit}</span>}
        </span>
      </span>
    </a>
  );
}

/** Figma: Message/Assistant and Message/User */
export function MessageRow({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="row row--end">
        <div className="bubble-user t-body">{message.text}</div>
      </div>
    );
  }
  return (
    <article className="assistant">
      <div className="assistant__head">
        <Avatar size={28} />
        <span className="t-body-strong">Cosmo</span>
        <time className="t-label c-tertiary">{time(message.at)}</time>
      </div>
      <div className="assistant__body">
        <p className="t-body">{message.text}</p>
        {message.source && <SourceCard source={message.source} />}
      </div>
    </article>
  );
}

/** Figma: Message/Typing */
export function Typing() {
  return (
    <div className="typing" role="status">
      <Avatar size={28} />
      <span className="t-small c-secondary">Checking NASA sources</span>
      <span className="typing__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

/** Figma: Button/Follow-up */
export function FollowUps({ items, onPick }: { items: string[]; onPick: (q: string) => void }) {
  return (
    <div className="followups">
      {items.map((q) => (
        <button key={q} className="btn-outline t-button" onClick={() => onPick(q)}>
          {q}
        </button>
      ))}
    </div>
  );
}

/** Welcome screen: intro, featured archive photo, and Figma: Row/Prompt */
export function Welcome({ onPick }: { onPick: (q: string) => void }) {
  return (
    <section className="welcome">
      <span className="t-label c-accent">Cosmic Juniors · NASA Space Apps 2026</span>
      <h1 className="t-display">What would you like to explore today?</h1>
      <p className="t-body c-secondary">
        I’m Cosmo, your guide to space. I answer with facts from NASA and show you where each one comes from.
      </p>

      <button className="featured" onClick={() => onPick("What did Sojourner do on Mars?")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="featured__photo"
          src="https://images-assets.nasa.gov/image/PIA01551/PIA01551~orig.jpg"
          alt="The Sojourner rover on Mars, just after rolling off the Pathfinder lander"
        />
        <span className="featured__text">
          <span className="t-label c-accent">From the archive</span>
          <span className="t-body-strong">Sojourner’s first day on Mars</span>
          <span className="t-small c-secondary">July 4, 1997 · Ares Vallis</span>
          <span className="t-label c-tertiary">NASA/JPL · PIA01551</span>
        </span>
      </button>

      <span className="t-label c-tertiary">Start with a question</span>
      <div className="prompts">
        {STARTERS.slice(0, 3).map((s) => (
          <button key={s.question} className="prompt" onClick={() => onPick(s.question)}>
            <span className="prompt__text">
              <span className="t-label c-accent">{s.topic}</span>
              <span className="t-body-strong">{s.question}</span>
            </span>
            <ArrowRightIcon />
          </button>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Cosmo from "./Cosmo";
import type { ChatMessage, Source } from "@/lib/types";

// Chat building blocks. Each maps to a component in the Figma page "v4 · Cosmo (pro)".

/** Figma: Chat Header */
export function ChatHeader({ stars }: { stars: number }) {
  return (
    <header className="chat-header">
      <Cosmo size={44} />
      <div className="chat-header__name">
        <span className="t-title">Cosmo</span>
        <span className="chat-header__status t-caption">
          <span className="dot" aria-hidden="true" /> Online · NASA sources
        </span>
      </div>
      <span className="stars-badge t-label" aria-label={`${stars} stars collected`}>
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" />
        </svg>
        {stars}
      </span>
    </header>
  );
}

/** Figma: Card/Space Fact — the NASA page an answer is based on, with a real NASA photo. */
export function SourceCard({ source }: { source: Source }) {
  return (
    <article className="fact-card">
      {source.image && (
        <figure className="fact-card__photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={source.image.src} alt={source.image.alt} loading="lazy" />
          <figcaption className="t-caption">Photo: {source.image.credit}</figcaption>
        </figure>
      )}
      <div className="fact-card__content">
        <span className="t-caption c-star">NASA source · {source.publisher}</span>
        <h3 className="t-title">{source.title}</h3>
        <p className="t-body-sm c-muted">{source.fact}</p>
        <a className="btn-cyan t-label" href={source.url} target="_blank" rel="noopener noreferrer">
          Read on NASA.gov
        </a>
      </div>
    </article>
  );
}

/** Reveals text a few letters at a time, like Cosmo is typing it. */
function useTypewriter(text: string, enabled: boolean, onDone?: () => void) {
  const chars = useMemo(() => Array.from(text), [text]); // Array.from keeps emojis whole
  const [count, setCount] = useState(enabled ? 0 : chars.length);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(chars.length);
      doneRef.current?.();
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i = Math.min(i + 3, chars.length);
      setCount(i);
      if (i >= chars.length) {
        window.clearInterval(id);
        doneRef.current?.();
      }
    }, 22);
    return () => window.clearInterval(id);
  }, [chars, enabled]);

  return { shown: chars.slice(0, count).join(""), done: count >= chars.length };
}

/** Figma: Message/Bot and Message/User */
export function MessageRow({ message, animate, onDone }: { message: ChatMessage; animate?: boolean; onDone?: () => void }) {
  const { shown, done } = useTypewriter(message.text, Boolean(animate) && message.role === "bot", onDone);

  if (message.role === "user") {
    return (
      <div className="row row--end">
        <div className="bubble bubble--user t-body">{message.text}</div>
      </div>
    );
  }
  return (
    <>
      <div className="row bot-row">
        <Cosmo size={32} className="bot-row__avatar" />
        <div className="bubble bubble--bot t-body">
          <span className="sr-only">{message.text}</span>
          <span aria-hidden="true">{shown}</span>
        </div>
      </div>
      {done && message.source && (
        <div className="row indent">
          <SourceCard source={message.source} />
        </div>
      )}
    </>
  );
}

/** Figma: Message/Typing */
export function Typing() {
  return (
    <div className="row bot-row bot-row--center" aria-live="polite">
      <Cosmo size={32} />
      <div className="bubble bubble--bot typing" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span className="t-caption c-muted">Checking NASA sources…</span>
    </div>
  );
}

/** Figma: Chip/Quick Reply */
export function QuickReplies({ items, onPick }: { items: string[]; onPick: (q: string) => void }) {
  return (
    <div className="chips indent">
      {items.map((q) => (
        <button key={q} className="chip t-label" onClick={() => onPick(q)}>
          {q}
        </button>
      ))}
    </div>
  );
}

// Starter questions about the machines NASA left on Mars and the Moon (the challenge theme).
const starters: [string, string][] = [
  ["Mars · 1997", "Where is Sojourner now?"],
  ["Mars · 2004–2018", "How far did Opportunity drive?"],
  ["Moon · Apollo", "What did astronauts leave on the Moon?"],
  ["Mars · 2021–2024", "What happened to Ingenuity?"],
];

/** Welcome screen with Card/Suggestion grid */
export function Welcome({ onPick }: { onPick: (q: string) => void }) {
  return (
    <section className="welcome">
      <div className="welcome__hero">
        <div className="welcome__glow" aria-hidden="true" />
        <Cosmo size={112} />
      </div>
      <h1 className="t-display">Hi, explorer.</h1>
      <p className="t-body c-muted welcome__intro">
        I’m Cosmo. Ask me about the rovers, landers and experiments NASA left on Mars and the Moon, and what they
        discovered.
      </p>
      <p className="t-label c-star welcome__try">Try asking</p>
      <div className="suggestions">
        {starters.map(([topic, q]) => (
          <button key={q} className="suggestion" onClick={() => onPick(q)}>
            <span className="t-caption c-cyan">{topic}</span>
            <span className="t-label">{q}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

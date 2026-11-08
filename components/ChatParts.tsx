"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CosmoLogo, { LogoTile } from "./CosmoLogo";
import NavTabs from "./NavTabs";
import RichText from "./RichText";
import type { ChatMessage, Reference, Source, SourceKind } from "@/lib/types";

// Chat building blocks. Each maps to a component in the Figma page "v4 · Cosmo (pro)".

/** Figma: Chat Header */
export function ChatHeader({ stars, onChats, chatCount = 0 }: { stars: number; onChats?: () => void; chatCount?: number }) {
  return (
    <header className="chat-header">
      {onChats && (
        <button className="chats-btn" onClick={onChats} aria-label={`Open conversations (${chatCount} saved)`} title="Conversations">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5M12 7v5l3 2" />
          </svg>
          {chatCount > 0 && <span className="chats-btn__count">{chatCount}</span>}
        </button>
      )}
      <LogoTile size={42} />
      <div className="chat-header__name">
        <CosmoLogo size={19} />
        <span className="chat-header__status t-caption">
          <span className="dot" aria-hidden="true" /> Online
        </span>
      </div>
      <NavTabs />
      <span className="stars-badge t-label" aria-label={`${stars} stars collected`}>
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" />
        </svg>
        {stars}
      </span>
    </header>
  );
}

const KIND_LABEL: Record<SourceKind, string> = { nasa: "NASA", partner: "Partner · .org", law: "U.S. law" };
const readLabel = (r: Reference) =>
  r.kind === "partner" ? `Read on ${new URL(r.url).hostname.replace(/^www\./, "")}` : r.kind === "law" ? "Read the law" : "Read on NASA.gov";

/** Figma: Card/Space Fact — the page an answer is based on, with a real NASA photo. */
export function SourceCard({ source, compact }: { source: Source; compact?: boolean }) {
  return (
    <article className={`fact-card${compact ? " fact-card--compact" : ""}`}>
      {source.image && !compact && (
        <figure className="fact-card__photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={source.image.src} alt={source.image.alt} loading="lazy" />
          <figcaption className="t-caption">Photo: {source.image.credit}</figcaption>
        </figure>
      )}
      <div className="fact-card__content">
        <span className="t-caption c-star">
          {source.publisher}
          {source.heading ? ` · ${source.title}` : ""}
        </span>
        <h3 className="t-title">{source.heading ?? source.title}</h3>
        {source.whereNow && (
          <p className="where-now t-body-sm">
            <span className="where-now__label t-caption">Where it is now</span>
            <span>
              <b>{source.whereNow.place}</b> · {source.whereNow.status}
            </span>
          </p>
        )}
        <p className="t-body-sm c-muted">{source.fact}</p>
        <a className="btn-cyan t-label" href={source.url} target="_blank" rel="noopener noreferrer">
          {readLabel(source)}
        </a>
      </div>
    </article>
  );
}

/** Numbered list of every page an answer used, plus the fact-check result. */
export function References({ items, checked }: { items: Reference[]; checked?: boolean }) {
  return (
    <section className="refs" aria-label="References">
      <div className="refs__head">
        <span className="t-caption c-muted">References</span>
        {checked && (
          <span className="refs__check t-caption" title="Every number in this answer was found in these sources.">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Fact-checked
          </span>
        )}
      </div>
      <ol className="refs__list">
        {items.map((r, i) => (
          <li key={r.id}>
            <span className="refs__n t-caption">[{i + 1}]</span>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="t-body-sm">
              {r.title}
            </a>
            <span className={`refs__kind refs__kind--${r.kind} t-caption`}>{KIND_LABEL[r.kind]}</span>
          </li>
        ))}
      </ol>
    </section>
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
export function MessageRow({
  message,
  animate,
  onDone,
  repeat,
}: {
  message: ChatMessage;
  animate?: boolean;
  onDone?: () => void;
  /** Same card as Cosmo's previous answer: show it small, without the photo. */
  repeat?: boolean;
}) {
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
        <LogoTile size={32} />
        <div className={`bubble bubble--bot t-body${message.story ? " bubble--story" : ""}`}>
          <span className="sr-only">{message.text}</span>
          <div aria-hidden="true" className="rt">
            <RichText text={shown} />
          </div>
        </div>
      </div>
      {done && message.source && (
        <div className="row indent">
          <SourceCard source={message.source} compact={repeat} />
        </div>
      )}
      {done && message.references && message.references.length > 0 && (
        <div className="row indent">
          <References items={message.references} checked={message.checked} />
        </div>
      )}
    </>
  );
}

/** Figma: Message/Typing */
export function Typing() {
  return (
    <div className="row bot-row bot-row--center thinking" aria-live="polite">
      <LogoTile size={32} />
      <div className="bubble bubble--bot thinking__bubble">
        <span className="orbit" aria-hidden="true">
          <span />
        </span>
        <span className="thinking__text">Cosmo is checking NASA sources</span>
      </div>
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
const starters: { q: string; icon: "mars" | "moon" | "shield" | "chute" }[] = [
  { q: "Where is Sojourner now?", icon: "mars" },
  { q: "What did astronauts leave on the Moon?", icon: "moon" },
  { q: "Why protect the Apollo landing sites?", icon: "shield" },
  { q: "What did Perseverance leave behind?", icon: "chute" },
];

function StarterIcon({ kind }: { kind: "mars" | "moon" | "shield" | "chute" }) {
  const p = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (kind === "mars") return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="M6 10c3 1 6 .5 9-1.5M7.5 15.5c2.5-1 5-1 8 .5" /></svg>;
  if (kind === "moon") return <svg {...p}><path d="M19 14.5A8 8 0 1 1 9.5 5a6.5 6.5 0 0 0 9.5 9.5z" /></svg>;
  if (kind === "shield") return <svg {...p}><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>;
  return <svg {...p}><path d="M4 11a8 8 0 0 1 16 0z" /><path d="M5 11l7 8 7-8M12 19v2" /></svg>;
}

/** Welcome screen with Card/Suggestion grid */
export function Welcome({ onPick, onStory }: { onPick: (q: string) => void; onStory?: (q: string) => void }) {
  return (
    <section className="hero">
      <h1 className="hero__title">
        <span>Ask</span> <CosmoLogo size={56} />
      </h1>
      <p className="hero__text">
        The machines NASA left on Mars and the Moon, with real sources.
      </p>
      <div className="hero__chips">
        {starters.map(({ q, icon }) => (
          <button key={q} className="hero-chip" onClick={() => onPick(q)}>
            <span className="hero-chip__icon">
              <StarterIcon kind={icon} />
            </span>
            <span className="hero-chip__q">{q}</span>
          </button>
        ))}
      </div>
      {onStory && (
        <button className="hero-story" onClick={() => onStory("Tell me your story, Sojourner")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0z" />
            <path d="M12 5.5V19" />
          </svg>
          <span>Hear Sojourner tell its own story</span>
        </button>
      )}
    </section>
  );
}

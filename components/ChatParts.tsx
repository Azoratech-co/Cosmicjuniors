"use client";

import Link from "next/link";
import { StarIcon } from "./Icons";
import type { ChatMessage, Source } from "@/lib/types";

// Chat building blocks. Each maps to a component in the Figma page "v3 · Cosmo (homepage theme)".

/** Figma: Header (same as the homepage header). */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__accent" />
      <div className="site-header__row">
        <Link href="/" className="brand">
          ✦ COSMIC JUNIORS
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link href="/">HOME</Link>
          <Link href="/#mission">OUR MISSION</Link>
          <Link href="/#explore-mars">EXPLORE MARS</Link>
        </nav>
      </div>
    </header>
  );
}

/** Figma: Avatar/Cosmo */
export function Avatar() {
  return (
    <span className="avatar" aria-hidden="true">
      <StarIcon />
    </span>
  );
}

/** Figma: Card/Source (styled like the homepage mission cards). */
export function SourceCard({ source }: { source: Source }) {
  return (
    <a className="source" href={source.url} target="_blank" rel="noopener noreferrer">
      {source.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="source__photo" src={source.image.src} alt={source.image.alt} loading="lazy" />
      )}
      <span className="source__text">
        <span className="label c-sky">Source · {source.publisher}</span>
        <span className="card-title">{source.title}</span>
        <span className="small c-muted">{source.fact}</span>
        <span className="link">Read on NASA.gov →</span>
      </span>
    </a>
  );
}

/** Figma: Message/Cosmo and Message/User */
export function MessageRow({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="row row--end">
        <div className="bubble-user">{message.text}</div>
      </div>
    );
  }
  return (
    <article className="cosmo">
      <div className="cosmo__head">
        <Avatar />
        <span className="label c-sky">Cosmo</span>
      </div>
      <div className="cosmo__body">
        <p>{message.text}</p>
        {message.source && <SourceCard source={message.source} />}
      </div>
    </article>
  );
}

/** Figma: Message/Typing */
export function Typing() {
  return (
    <div className="typing" role="status">
      <Avatar />
      <span className="label c-sky">Checking NASA sources</span>
      <span className="typing__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

/** Figma: Button/Follow-up */
export function Pills({ items, onPick, indent }: { items: string[]; onPick: (q: string) => void; indent?: boolean }) {
  return (
    <div className={`pills${indent ? " pills--indent" : ""}`}>
      {items.map((q) => (
        <button key={q} className="pill" onClick={() => onPick(q)}>
          {q}
        </button>
      ))}
    </div>
  );
}

const STARTERS = ["What did Sojourner do on Mars?", "Is any rover still driving today?", "Why is Mars red?"];

/** Start screen: title and three example questions. */
export function Welcome({ onPick }: { onPick: (q: string) => void }) {
  return (
    <section className="welcome">
      <span className="eyebrow">03 · AI Chatbot</span>
      <h1 className="title">Ask Cosmo</h1>
      <p className="c-muted">Ask anything about Mars and space missions. Every answer comes from NASA.</p>
      <Pills items={STARTERS} onPick={onPick} />
    </section>
  );
}

"use client";

import Cosmo from "./Cosmo";
import CardArt from "./CardArt";
import type { ChatMessage, FactCard } from "@/lib/types";

// Small chat building blocks. Each one maps to a Figma component of the same name.

/** Figma: Chat Header */
export function ChatHeader({ stars }: { stars: number }) {
  return (
    <header className="chat-header">
      <Cosmo size={44} />
      <div className="chat-header__name">
        <span className="t-title">Cosmo</span>
        <span className="chat-header__status t-caption">
          <span className="dot" aria-hidden="true" /> Online · your space buddy
        </span>
      </div>
      <span className="stars-badge t-label" aria-label={`${stars} stars collected`}>
        ⭐ {stars}
      </span>
    </header>
  );
}

/** Figma: Card/Space Fact */
export function FactCardView({ card }: { card: FactCard }) {
  return (
    <article className="fact-card">
      <CardArt image={card.image} />
      <div className="fact-card__content">
        <span className="t-caption c-star">🔭 NASA FACT</span>
        <h3 className="t-title">{card.title}</h3>
        <p className="t-body-sm c-muted">{card.body}</p>
        {card.button && (
          <a className="btn-cyan t-label" href={card.button.href} target="_blank" rel="noreferrer">
            {card.button.label}
          </a>
        )}
      </div>
    </article>
  );
}

/** Figma: Message/Bot and Message/User */
export function MessageRow({ message }: { message: ChatMessage }) {
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
        <div className="bubble bubble--bot t-body">{message.text}</div>
      </div>
      {message.card && (
        <div className="row indent">
          <FactCardView card={message.card} />
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
      <span className="t-caption c-muted">Cosmo is thinking…</span>
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

const starters: [string, string][] = [
  ["🪐", "Why does Saturn have rings?"],
  ["🚀", "How do rockets fly to space?"],
  ["🌙", "Why does the Moon change shape?"],
  ["👩‍🚀", "What do astronauts eat?"],
];

/** Welcome screen with Card/Suggestion grid */
export function Welcome({ onPick }: { onPick: (q: string) => void }) {
  return (
    <section className="welcome">
      <div className="welcome__hero">
        <div className="welcome__glow" aria-hidden="true" />
        <Cosmo size={112} />
      </div>
      <h1 className="t-display">Hi, Explorer! 👋</h1>
      <p className="t-body c-muted welcome__intro">
        I’m Cosmo, your space buddy. Ask me anything about planets, stars, rockets and astronauts!
      </p>
      <p className="t-label c-star welcome__try">✨ Try asking…</p>
      <div className="suggestions">
        {starters.map(([emoji, q]) => (
          <button key={q} className="suggestion" onClick={() => onPick(q)}>
            <span className="t-display" aria-hidden="true">
              {emoji}
            </span>
            <span className="t-label">{q}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

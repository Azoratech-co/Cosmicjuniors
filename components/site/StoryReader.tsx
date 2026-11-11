"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Story } from "@/lib/storyline";
import Reveal from "./Reveal";

// The Storyline reader: chapter menu, reading progress, read-aloud (the browser's free built-in
// voices), a sign language panel that follows the chapter you're reading, and "Ask Cosmo" links.

export default function StoryReader({ story, signVideos, nextStory }: { story: Story; signVideos: Record<number, string>; nextStory?: { id: string; title: string } }) {
  const [current, setCurrent] = useState(1);
  const [progress, setProgress] = useState(0);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [canSpeak, setCanSpeak] = useState(false);
  const [signOn, setSignOn] = useState(false);
  const refs = useRef<Record<number, HTMLElement | null>>({});

  // Which chapter is on screen, and how far through the story we are.
  useEffect(() => {
    setCanSpeak("speechSynthesis" in window);
    const onScroll = () => {
      const h = document.documentElement;
      setProgress(Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)));
      let cur = 1;
      for (const c of story.chapters) {
        const el = refs.current[c.n];
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = c.n;
      }
      setCurrent(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [story]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // Opened from a Cosmo reference (e.g. #chapter-3-p2): land on that paragraph and mark it.
  // Scroll again once photos above it have loaded and moved it down.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!/^chapter-\d+-p\d+$/.test(id)) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("is-found");
    const go = () => el.scrollIntoView({ block: "center" });
    const timers = [100, 700, 1500].map((t) => window.setTimeout(go, t));
    return () => timers.forEach(clearTimeout);
  }, []);

  const readAloud = (n: number) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking === n) {
      synth.cancel();
      setSpeaking(null);
      return;
    }
    synth.cancel();
    const ch = story.chapters.find((c) => c.n === n)!;
    const u = new SpeechSynthesisUtterance(`Chapter ${n}. ${ch.title}. ${ch.paragraphs.join(" ")}`);
    u.lang = "en-US";
    u.rate = 0.95;
    u.onend = () => setSpeaking((s) => (s === n ? null : s));
    u.onerror = () => setSpeaking(null);
    setSpeaking(n);
    synth.speak(u);
  };

  const ask = (n: number, title: string) =>
    `/chat?mode=story&q=${encodeURIComponent(`What happens in chapter ${n} of ${story.id === "spirit" ? "Spirit's" : "Sojourner's"} story, "${title}"?`)}`;

  const video = signVideos[current];

  return (
    <div className="story">
      <div className="story-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="story-tools">
        <button className={`tool-btn${signOn ? " is-on" : ""}`} onClick={() => setSignOn((v) => !v)} aria-pressed={signOn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5V4a1.5 1.5 0 0 1 3 0v6m0-4.5a1.5 1.5 0 0 1 3 0V12m0-3a1.5 1.5 0 0 1 3 0v4.5a7.5 7.5 0 0 1-7.5 7.5h-.7a7 7 0 0 1-5.6-2.8L4 16a1.6 1.6 0 0 1 2.4-2.1L8 15.5" />
          </svg>
          Sign language
        </button>
        <nav className="chapter-menu" aria-label="Chapters">
          {story.chapters.map((c) => (
            <a key={c.n} href={`#chapter-${c.n}`} className={c.n === current ? "is-on" : ""} aria-current={c.n === current ? "true" : undefined}>
              {c.n}
            </a>
          ))}
        </nav>
      </div>

      {story.chapters.map((c) => (
        <section key={c.n} id={`chapter-${c.n}`} className="chapter-block" ref={(el) => { refs.current[c.n] = el; }}>
          <Reveal>
            <p className="chapter-block__num">Chapter {c.n}</p>
            <h2 className="chapter-block__title">{c.title}</h2>
          </Reveal>
          {c.image && (
            <Reveal className="chapter-block__photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image.src} alt={c.image.alt} loading="lazy" />
              <span>Photo: {c.image.credit}</span>
            </Reveal>
          )}
          <div className="chapter-block__actions">
            {canSpeak && (
              <button className={`tool-btn${speaking === c.n ? " is-on" : ""}`} onClick={() => readAloud(c.n)} aria-pressed={speaking === c.n}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 9v6h4l5 4V5L8 9z" />
                  <path d={speaking === c.n ? "M17 9l4 6M21 9l-4 6" : "M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"} />
                </svg>
                {speaking === c.n ? "Stop reading" : "Read aloud"}
              </button>
            )}
            <Link className="tool-btn" href={ask(c.n, c.title)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" />
              </svg>
              Ask Cosmo about this chapter
            </Link>
          </div>
          <div className="chapter-block__text">
            {c.paragraphs.map((p, i) => (
              <Reveal key={i}>
                <p id={`chapter-${c.n}-p${i + 1}`} className={p === "To be continued…" ? "tbc" : undefined}>{p}</p>
              </Reveal>
            ))}
          </div>
        </section>
      ))}

      <div className="story-end">
        <p>{story.status === "complete" ? "The end." : "The team is still writing this story. Come back soon!"}</p>
        <div className="cta-row">
          {nextStory && (
            <Link className="btn-purple cta" href={`/story/${nextStory.id}`}>
              Next story: {nextStory.title}
            </Link>
          )}
          <Link className="btn-ghost cta" href="/explorers">
            Meet the explorers
          </Link>
        </div>
      </div>

      {signOn && (
        <aside className="sign-panel" aria-label={`Sign language, chapter ${current}`}>
          <div className="sign-panel__head">
            <span>Sign language · Chapter {current}</span>
            <button onClick={() => setSignOn(false)} aria-label="Close sign language">
              ✕
            </button>
          </div>
          {video ? (
            <video key={video} src={video} autoPlay muted loop playsInline controls />
          ) : (
            <div className="sign-panel__soon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5V4a1.5 1.5 0 0 1 3 0v6m0-4.5a1.5 1.5 0 0 1 3 0V12m0-3a1.5 1.5 0 0 1 3 0v4.5a7.5 7.5 0 0 1-7.5 7.5h-.7a7 7 0 0 1-5.6-2.8L4 16a1.6 1.6 0 0 1 2.4-2.1L8 15.5" />
              </svg>
              <span>The sign language video for this chapter is coming soon.</span>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Scene } from "@/lib/film/types";
import type { ChatReply } from "@/lib/types";
import { VH, VW, drawScene, filmImages, type Images } from "./scenes";

// The scrolling story film. Scroll (or press Play) to move scene by scene: each scene is a short
// animated clip with a caption and narration. Narration uses a recorded file when one exists
// (public/film/<id>/audio/NN.mp3) and the browser's voice otherwise.

interface Props {
  id: string;
  title: string;
  scenes: Scene[];
  chapters: Record<number, string>;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const strip = (s: string) => s.replace(/\*\*/g, "").replace(/^#+\s*/gm, "");

function pickVoice() {
  const vs = window.speechSynthesis?.getVoices() ?? [];
  const en = vs.filter((v) => /^en[-_]/i.test(v.lang));
  const pref = ["Samantha", "Google UK English Female", "Google US English", "Karen", "Daniel", "Moira", "Serena", "Aria", "Jenny"];
  for (const p of pref) {
    const v = en.find((x) => x.name.includes(p));
    if (v) return v;
  }
  return en[0] ?? vs[0];
}

export default function FilmPlayer({ id, title, scenes, chapters }: Props) {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [sound, setSound] = useState(true);
  const [captions, setCaptions] = useState(true);
  const [auto, setAuto] = useState(true);
  const [ask, setAsk] = useState<{ q: string; reply?: ChatReply; error?: boolean } | null>(null);

  const canvases = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];
  const [front, setFront] = useState(0);
  const frontRef = useRef(0);
  const sceneStart = useRef(performance.now());
  const images = useRef<Images>({});
  const audio = useRef<HTMLAudioElement | null>(null);
  const noFile = useRef(new Set<number>());
  const advance = useRef(0);
  const idxRef = useRef(0);
  const shownIdx = useRef(-1);
  const state = useRef({ started, sound, auto, ask: false });
  state.current = { started, sound, auto, ask: !!ask };

  const sc = scenes[idx];

  // Load every picture once.
  useEffect(() => {
    for (const src of filmImages(scenes)) {
      const im = new Image();
      im.src = src;
      images.current[src] = im;
    }
    audio.current = new Audio();
    audio.current.preload = "auto";
    window.speechSynthesis?.getVoices();
  }, [scenes]);

  const goTo = useCallback((i: number) => {
    const n = Math.max(0, Math.min(scenes.length - 1, i));
    window.scrollTo({ top: n * window.innerHeight, behavior: "smooth" });
  }, [scenes.length]);

  // Scroll position decides the scene.
  useEffect(() => {
    const onScroll = () => {
      const i = Math.max(0, Math.min(scenes.length - 1, Math.round(window.scrollY / window.innerHeight)));
      if (i !== idxRef.current) {
        idxRef.current = i;
        setIdx(i);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scenes.length]);

  const stopVoice = () => {
    window.clearTimeout(advance.current);
    window.speechSynthesis?.cancel();
    if (audio.current) {
      audio.current.onended = null;
      audio.current.onerror = null;
      audio.current.pause();
    }
  };

  // New scene: swap canvases (the old one fades out), restart its clock, narrate it.
  useEffect(() => {
    if (shownIdx.current !== idx) {
      shownIdx.current = idx;
      sceneStart.current = performance.now();
      const f = 1 - frontRef.current;
      frontRef.current = f;
      setFront(f);
      setAsk(null);
    }
    if (!state.current.started) return;
    stopVoice();
    const scene = scenes[idx];
    const next = () => {
      if (!state.current.auto || state.current.ask) return;
      advance.current = window.setTimeout(() => goTo(idxRef.current + 1), 900);
    };
    const speak = () => {
      const synth = window.speechSynthesis;
      if (!synth || !state.current.sound) {
        // no voice: give readers time to read, then move on
        advance.current = window.setTimeout(() => state.current.auto && !state.current.ask && goTo(idxRef.current + 1), 2200 + scene.text.split(" ").length * 330);
        return;
      }
      const u = new SpeechSynthesisUtterance(scene.text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = 0.93;
      u.pitch = 1;
      u.onend = next;
      synth.speak(u);
    };
    if (!state.current.sound) return speak();
    const n = idx + 1;
    const a = audio.current;
    if (a && !noFile.current.has(n)) {
      a.src = `/film/${id}/audio/${pad2(n)}.mp3`;
      a.onended = next;
      a.onerror = () => {
        noFile.current.add(n);
        speak();
      };
      a.play().catch(() => {
        noFile.current.add(n);
        speak();
      });
    } else speak();
    return stopVoice;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, started, sound]);

  const speaking = () => !!window.speechSynthesis?.speaking || (!!audio.current && !audio.current.paused && !audio.current.ended);

  // Pause autoplay while Cosmo is answering; carry on when the panel closes.
  const asking = !!ask;
  useEffect(() => {
    window.clearTimeout(advance.current);
    if (!asking && started && auto && !speaking() && shownIdx.current >= 0) {
      advance.current = window.setTimeout(() => goTo(idxRef.current + 1), 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asking]);

  // Draw loop: only the front canvas animates.
  useEffect(() => {
    let raf = 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let drawnStill = -1;
    const loop = (now: number) => {
      const c = canvases[frontRef.current].current;
      if (c) {
        const w = c.clientWidth, h = c.clientHeight;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
          c.width = Math.round(w * dpr);
          c.height = Math.round(h * dpr);
          drawnStill = -1;
        }
        const ctx = c.getContext("2d")!;
        // Landscape screens: fill the screen. Portrait phones: show the middle of the scene
        // as a wide "video" in the upper part, so nothing important is cropped away.
        const portrait = w < h * 0.9;
        const s = portrait ? (w * dpr) / (VW * 0.86) : Math.max((w * dpr) / VW, (h * dpr) / VH);
        const oy = portrait ? h * dpr * 0.4 - (VH * s) / 2 : (h * dpr - VH * s) / 2;
        const t = still ? 6 : (now - sceneStart.current) / 1000;
        if (!still || drawnStill !== idxRef.current) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.fillStyle = "#05070f";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.setTransform(s, 0, 0, s, (w * dpr - VW * s) / 2, oy);
          drawScene(ctx, scenes[idxRef.current], t, images.current);
          if (portrait) {
            // soften the top and bottom edges of the picture into the dark background
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            const top = oy, bot = oy + VH * s, f = 70 * dpr;
            let g = ctx.createLinearGradient(0, top, 0, top + f);
            g.addColorStop(0, "#05070f");
            g.addColorStop(1, "rgba(5,7,15,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, top, c.width, f);
            g = ctx.createLinearGradient(0, bot - f, 0, bot);
            g.addColorStop(0, "rgba(5,7,15,0)");
            g.addColorStop(1, "#05070f");
            ctx.fillStyle = g;
            ctx.fillRect(0, bot - f, c.width, f);
          }
          drawnStill = idxRef.current;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes]);

  // Keyboard: arrows and space move between scenes.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        goTo(idxRef.current + 1);
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goTo(idxRef.current - 1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [goTo]);

  useEffect(() => () => stopVoice(), []);

  const start = (withSound: boolean) => {
    // speak something tiny inside the tap, so phones allow the voice afterwards
    if (withSound && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
    if (withSound && audio.current) {
      audio.current.muted = true;
      audio.current.play().catch(() => {});
      audio.current.pause();
      audio.current.muted = false;
    }
    setSound(withSound);
    setStarted(true);
  };

  const askCosmo = async () => {
    if (!sc.ask) return;
    const q = sc.ask;
    stopVoice();
    setAsk({ q });
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "story", messages: [{ role: "user", text: q }] }),
      });
      const reply = (await r.json()) as ChatReply;
      setAsk((a) => (a && a.q === q ? { q, reply } : a));
    } catch {
      setAsk((a) => (a && a.q === q ? { q, error: true } : a));
    }
  };

  const chapterLabel = sc.chapter ? `Chapter ${sc.chapter} · ${chapters[sc.chapter]}` : title;
  const big = sc.kind === "title" || sc.kind === "chapter";
  const last = idx === scenes.length - 1;

  return (
    <div className="film" style={{ height: `${scenes.length * 100}svh` }}>
      <div className="film-stage">
        {canvases.map((r, i) => (
          <canvas key={i} ref={r} className={`film-canvas${front === i ? " is-front" : ""}`} aria-hidden="true" />
        ))}

        <div className="film-top">
          <Link href={`/story/${id}`} className="film-btn" aria-label="Back to the story page">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </Link>
          <span className="film-chapter">{chapterLabel}</span>
          <span className="film-spacer" />
          {started && (
            <>
              <button
                className="film-btn"
                onClick={() => {
                  if (auto) {
                    window.clearTimeout(advance.current);
                    setAuto(false);
                  } else {
                    setAuto(true);
                    if (!speaking()) goTo(idx + 1);
                  }
                }}
                aria-pressed={auto}
                title={auto ? "Pause" : "Play"}
              >
                {auto ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                )}
                <span>{auto ? "Pause" : "Play"}</span>
              </button>
              <button className="film-btn" onClick={() => setSound((s) => !s)} aria-pressed={sound} title={sound ? "Mute narration" : "Turn narration on"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 9v6h4l5 4V5L8 9z" />
                  {sound ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9l4 6M21 9l-4 6" />}
                </svg>
              </button>
              <button className="film-btn" onClick={() => setCaptions((c) => !c)} aria-pressed={captions} title="Captions">
                <span className="film-cc">CC</span>
              </button>
            </>
          )}
        </div>
        <div className="film-progress" aria-hidden="true">
          <span style={{ width: `${((idx + 1) / scenes.length) * 100}%` }} />
        </div>

        {big && started && (
          <div className="film-card" key={`card-${idx}`}>
            {sc.kind === "chapter" ? <span className="film-card__n">Chapter {sc.chapter}</span> : <span className="film-card__n">A Cosmic Juniors story</span>}
            <h2 className="film-card__title">{sc.kind === "chapter" ? sc.title : title}</h2>
          </div>
        )}

        {captions && started && !big && (
          <div className="film-caption" key={`cap-${idx}`} aria-live="polite">
            <p>{sc.text}</p>
            {sc.credit && <span className="film-credit">{sc.credit}</span>}
          </div>
        )}

        {started && (
          <div className="film-nav">
            {sc.ask ? (
              <button className="film-ask" onClick={askCosmo}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" /></svg>
                Ask Cosmo
              </button>
            ) : <span />}
            <div className="film-steps">
              <button className="film-btn" onClick={() => goTo(idx - 1)} disabled={idx === 0} aria-label="Previous scene">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
              </button>
              <span className="film-count">{idx + 1} / {scenes.length}</span>
              <button className="film-btn" onClick={() => goTo(idx + 1)} disabled={last} aria-label="Next scene">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </div>
          </div>
        )}

        {ask && (
          <div className="film-cosmo" role="dialog" aria-label="Cosmo's answer">
            <div className="film-cosmo__head">
              <strong>Cosmo</strong>
              <button className="film-btn" onClick={() => setAsk(null)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <p className="film-cosmo__q">{ask.q}</p>
            {!ask.reply && !ask.error && <p className="film-cosmo__wait">Cosmo is checking the NASA notes…</p>}
            {ask.error && <p className="film-cosmo__wait">Cosmo couldn&apos;t answer right now. Try again in a moment.</p>}
            {ask.reply && (
              <>
                <p className="film-cosmo__a">{strip(ask.reply.text)}</p>
                {ask.reply.source && (
                  <p className="film-cosmo__src">
                    Source:{" "}
                    {ask.reply.source.url ? (
                      <a href={ask.reply.source.url} target={ask.reply.source.url.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer">{ask.reply.source.title}</a>
                    ) : (
                      ask.reply.source.title
                    )}
                  </p>
                )}
                <Link className="film-cosmo__more" href={`/chat?mode=story&q=${encodeURIComponent(ask.q)}`}>Keep asking in the chat →</Link>
              </>
            )}
          </div>
        )}

        {last && started && (
          <div className="film-end">
            <Link className="film-end__btn is-main" href={`/story/${id}`}>Read the full story</Link>
            <Link className="film-end__btn" href="/chat?mode=story">Ask Cosmo</Link>
            <button className="film-end__btn" onClick={() => goTo(0)}>Watch again</button>
          </div>
        )}

        {!started && (
          <div className="film-intro">
            <span className="film-card__n">A Cosmic Juniors story · {scenes.length} scenes</span>
            <h1 className="film-intro__title">{title}</h1>
            <p className="film-intro__text">Scroll, or press play and watch. Every scene is narrated, and you can ask Cosmo about it.</p>
            <div className="film-intro__btns">
              <button className="film-end__btn is-main" onClick={() => start(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                Start the story
              </button>
              <button className="film-end__btn" onClick={() => start(false)}>Watch without sound</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

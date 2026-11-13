"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StoryScene } from "@/lib/story/types";
import { disableStorySound, duckStorySound, enableStorySound, setStorySound } from "@/lib/storySound";

// One continuous scroll through the story, like a picture book you scroll: a framed clip in the
// middle of a starry stage. Scrolling blends each clip into the next while the camera drifts
// slowly over it, and the story's line settles in at the bottom of the frame. The page eases
// toward the scroll position (so a flick or a trackpad nudge glides instead of jumping), gently
// snaps onto each scene, and can be driven with the arrow keys, the buttons or the journey rail.

interface Props {
  scenes: StoryScene[];
  storyTitle: string;
  storySubtitle: string;
  chapters: Record<number, string>;
  folder: string;
}

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
// the second half of each scene's scroll blends it into the next one
const FADE_FROM = 0.45;

export default function StoryScroll({ scenes, storyTitle, storySubtitle, chapters, folder }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const rover = useRef<HTMLSpanElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const glows = useRef<(HTMLDivElement | null)[]>([]);
  const moving = useRef<(HTMLElement | null)[]>([]);
  const lines = useRef<(HTMLDivElement | null)[]>([]);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(0);
  const [voice, setVoice] = useState(false);
  const [sound, setSound] = useState(false);
  const activeRef = useRef(0);

  const chapterNos = [...new Set(scenes.map((s) => s.chapter).filter((c) => c > 0))];
  const hasAudio = scenes.some((s) => s.audio);
  const last = scenes.length - 1;

  // ---------- drawing: everything follows one number, the (eased) scroll progress ----------
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let shown = -1; // eased progress
    let prevT = 0;

    const target = () => {
      const el = wrap.current;
      if (!el) return 0;
      const top = el.getBoundingClientRect().top + window.scrollY;
      return clamp((window.scrollY - top) / window.innerHeight, 0, last);
    };

    const draw = (p: number) => {
      const k = Math.floor(p);
      const f = p - k;
      const cross = k < last ? smooth((f - FADE_FROM) / (1 - FADE_FROM)) : 0;
      const fw = frame.current?.clientWidth ?? 1;

      scenes.forEach((sc, i) => {
        const layer = layers.current[i];
        if (!layer) return;
        let o = i === k ? 1 - cross : i === k + 1 ? cross : 0;
        // a chapter title waits until the picture before it has mostly faded
        if (sc.card && i === k + 1) o = smooth((cross - 0.4) / 0.6);
        layer.style.opacity = String(o);
        layer.style.visibility = o > 0.001 ? "visible" : "hidden";

        const g = glows.current[i];
        if (g) g.style.opacity = String(o * 0.55);

        // camera: from when the scene starts fading in until it has faded out
        const lp = clamp((p - i + (1 - FADE_FROM)) / (2 - FADE_FROM));
        const m = moving.current[i];
        if (m && !still) {
          if (sc.fit === "pan") {
            const from = sc.panFrom ?? 0;
            const t = from + (1 - from) * lp;
            m.style.transform = `translate3d(${-t * Math.max(0, m.clientWidth - fw)}px,0,0)`;
          } else {
            const [z0, z1] = sc.zoom ?? [1, 1.06];
            m.style.transform = `scale(${z0 + (z1 - z0) * lp})`;
          }
        }

        const v = videos.current[i];
        if (v) {
          if (o > 0.01 && v.paused) v.play().catch(() => {});
          else if (o <= 0.01 && !v.paused) v.pause();
        }

        // the story line settles in once its picture is mostly on screen, and leaves early
        const line = lines.current[i];
        if (line) {
          const lo = smooth((o - 0.6) / 0.35);
          line.style.opacity = String(lo);
          line.style.visibility = lo > 0.001 ? "visible" : "hidden";
          line.style.transform = `translate3d(0,${(1 - lo) * 14}px,0)`;
        }
      });

      // stars drift a little as you travel; the rover drives along the journey rail
      if (sky.current && !still) sky.current.style.transform = `translate3d(0,${-p * 9}px,0)`;
      if (rover.current) rover.current.style.left = `${(p / last) * 100}%`;

      const now = cross > 0.5 ? k + 1 : k;
      if (now !== activeRef.current) {
        activeRef.current = now;
        setActive(now);
      }
      setNear((n) => (Math.abs(n - k) >= 1 ? k : n));
    };

    const tick = (t: number) => {
      raf = 0;
      const goal = target();
      const dt = prevT ? Math.min(64, t - prevT) : 16;
      prevT = t;
      if (shown < 0 || still) shown = goal;
      else shown += (goal - shown) * (1 - Math.exp(-dt / 110));
      if (Math.abs(goal - shown) < 0.0004) shown = goal;
      draw(shown);
      if (shown !== goal) raf = requestAnimationFrame(tick);
      else prevT = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    // a gentle snap onto each scene, only while the story is on screen
    document.documentElement.classList.add("ss-snap");
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("ss-snap");
    };
  }, [scenes, last]);

  // ---------- moving around: buttons, rail and arrow keys ----------
  const goTo = useCallback(
    (i: number) => {
      const el = wrap.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: top + clamp(i, 0, last) * window.innerHeight, behavior: still ? "auto" : "smooth" });
    },
    [last],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const r = wrap.current?.getBoundingClientRect();
      if (!r || r.top > 1 || r.bottom < window.innerHeight - 1) return; // only while the stage fills the screen
      const next = e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown";
      const prev = e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp";
      if (!next && !prev) return;
      const cur = activeRef.current;
      if ((next && cur >= last) || (prev && cur <= 0)) return; // let the page scroll on past the ends
      e.preventDefault();
      goTo(cur + (next ? 1 : -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, last]);

  // ---------- narration: plays each scene's recorded line while it is on screen ----------
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const src = scenes[active]?.audio;
    if (!voice || !src) {
      a.pause();
      return;
    }
    const url = `${folder}${src}`;
    if (!a.src.endsWith(url)) a.src = url;
    a.currentTime = 0;
    a.play().catch(() => {});
  }, [active, voice, scenes, folder]);

  // ---------- sound effects: follow the scene on screen ----------
  useEffect(() => {
    const sc = scenes[active];
    setStorySound(sc?.sound ?? (sc?.card ? "card" : undefined));
  }, [active, scenes]);
  useEffect(() => {
    duckStorySound(voice && !!scenes[active]?.audio);
  }, [voice, active, scenes]);
  useEffect(() => () => disableStorySound(), []);
  const toggleSound = () => {
    if (sound) disableStorySound();
    else enableStorySound();
    setSound(!sound);
    try {
      localStorage.setItem("cj-story-sound", sound ? "off" : "on");
    } catch {}
  };
  // if sound was on last time, it comes back with the first tap or key press
  useEffect(() => {
    let want = false;
    try {
      want = localStorage.getItem("cj-story-sound") === "on";
    } catch {}
    if (!want) return;
    const go = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest?.(".ss-sound")) return; // the button handles itself
      enableStorySound();
      setSound(true);
      off();
    };
    const off = () => ["pointerdown", "keydown", "touchend"].forEach((t) => window.removeEventListener(t, go));
    ["pointerdown", "keydown", "touchend"].forEach((t) => window.addEventListener(t, go));
    return off;
  }, []);

  const cur = scenes[active];
  const onCard = !!cur.card;
  const sceneNo = scenes.slice(0, active + 1).filter((s) => !s.card).length;
  const sceneCount = scenes.filter((s) => !s.card).length;
  const firstOf = (c: number) => scenes.findIndex((s) => s.chapter === c);

  return (
    <div className="ss" ref={wrap} style={{ height: `${scenes.length * 100}svh` }}>
      {scenes.map((_, i) => (
        <span key={`s${i}`} className="ss-snap-pt" style={{ top: `${i * 100}svh` }} aria-hidden="true" />
      ))}

      <div className="ss-stage">
        <div className="ss-sky" aria-hidden="true">
          <div className="ss-sky__stars" ref={sky} />
        </div>
        <div className="ss-glow" aria-hidden="true">
          {scenes.map((sc, i) =>
            sc.image && Math.abs(i - near) <= 2 ? (
              <div key={i} ref={(el) => { glows.current[i] = el; }} style={{ backgroundImage: `url(${sc.image})` }} />
            ) : null,
          )}
        </div>

        <div className="ss-view">
          <div className="ss-frame" ref={frame}>
            {scenes.map((sc, i) => {
              const load = Math.abs(i - near) <= 3;
              return (
                <div key={i} className={`ss-layer${sc.card ? " is-card" : ""}`} ref={(el) => { layers.current[i] = el; }} aria-hidden={i !== active}>
                  {sc.card ? (
                    <div className="ss-card">
                      {sc.chapter ? (
                        <>
                          <span className="ss-card__num" aria-hidden="true">{String(sc.chapter).padStart(2, "0")}</span>
                          <span className="ss-card__n">Chapter {sc.chapter}</span>
                          <h2 className="ss-card__t">{chapters[sc.chapter]}</h2>
                        </>
                      ) : (
                        <>
                          <span className="ss-card__n">A Cosmic Juniors story</span>
                          <h1 className="ss-card__t ss-card__t--story">{storyTitle}</h1>
                          <p className="ss-card__sub">{storySubtitle}</p>
                          <button type="button" className="ss-card__hint" onClick={() => goTo(1)}>
                            Scroll to begin
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className={`ss-pic ss-pic--${sc.fit ?? "cover"}${sc.gray ? " is-gray" : ""}`}>
                      {sc.fit === "contain" && load && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="ss-pic__blur" src={sc.image} alt="" aria-hidden="true" />
                      )}
                      {sc.video && load ? (
                        <video
                          ref={(el) => { videos.current[i] = el; moving.current[i] = el; }}
                          className="ss-pic__main"
                          style={sc.focus ? { objectPosition: sc.focus } : undefined}
                          src={`${folder}${sc.video}`}
                          poster={sc.image}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          aria-label={sc.credit}
                          onCanPlay={(e) => {
                            // a clip that finishes loading while its scene is on screen starts right away
                            const v = e.currentTarget;
                            const layer = v.closest(".ss-layer") as HTMLElement | null;
                            if (layer && Number(layer.style.opacity) > 0.01 && v.paused) v.play().catch(() => {});
                          }}
                        />
                      ) : load ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img ref={(el) => { moving.current[i] = el; }} className="ss-pic__main" style={sc.focus ? { objectPosition: sc.focus } : undefined} src={sc.image} alt={sc.credit ?? ""} decoding="async" />
                      ) : null}
                      <span className="ss-pic__shade" aria-hidden="true" />
                    </div>
                  )}
                </div>
              );
            })}

            {scenes.map((sc, i) =>
              sc.text ? (
                <div key={`l${i}`} className="ss-line" ref={(el) => { lines.current[i] = el; }}>
                  <p>{sc.text}</p>
                </div>
              ) : null,
            )}

            <div className={`ss-chips${onCard ? " is-hidden" : ""}`} aria-live="polite">
              <span className="ss-chip">
                <b>Chapter {cur.chapter}</b>
                <span>{chapters[cur.chapter]}</span>
              </span>
              {cur.stamp && <span className="ss-stamp">{cur.stamp}</span>}
            </div>
          </div>
          <span className="ss-corner ss-corner--tl" aria-hidden="true" />
          <span className="ss-corner ss-corner--tr" aria-hidden="true" />
          <span className="ss-corner ss-corner--bl" aria-hidden="true" />
          <span className="ss-corner ss-corner--br" aria-hidden="true" />
        </div>

        <p className={`ss-caption${onCard ? " is-hidden" : ""}`}>{cur.text}</p>

        <div className="ss-rail">
          <span className="ss-rail__end">Earth</span>
          <div className="ss-rail__track">
            <span className="ss-rail__line" />
            {chapterNos.map((c) => {
              const at = firstOf(c);
              return (
                <button
                  key={c}
                  type="button"
                  className={`ss-rail__dot${cur.chapter === c ? " is-on" : ""}${cur.chapter > c ? " is-past" : ""}`}
                  style={{ left: `${(at / last) * 100}%` }}
                  onClick={() => goTo(at + 1 <= last && scenes[at].card ? at + 1 : at)}
                  aria-label={`Chapter ${c}: ${chapters[c]}`}
                  title={`Chapter ${c}: ${chapters[c]}`}
                />
              );
            })}
            <span className="ss-rail__rover" ref={rover} aria-hidden="true">
              <svg viewBox="0 0 32 20" width="30" height="19">
                <rect x="5" y="3" width="22" height="3" rx="1" fill="#f3c87a" />
                <rect x="8" y="6.5" width="16" height="5" rx="1.5" fill="#d7dcf2" />
                <path d="M11 11.5 7 15M16 11.5V15M21 11.5l4 3.5" stroke="#d7dcf2" strokeWidth="1.3" />
                <circle cx="6" cy="16.5" r="2.6" fill="#2b3150" stroke="#d7dcf2" strokeWidth="1.2" />
                <circle cx="16" cy="16.5" r="2.6" fill="#2b3150" stroke="#d7dcf2" strokeWidth="1.2" />
                <circle cx="26" cy="16.5" r="2.6" fill="#2b3150" stroke="#d7dcf2" strokeWidth="1.2" />
              </svg>
            </span>
          </div>
          <span className="ss-rail__end">Mars</span>
        </div>

        <div className={`ss-meta${onCard && active === 0 ? " is-hidden" : ""}`}>
          <span className="ss-credit">{cur.credit ?? ""}</span>
          <span className="ss-meta__end">
            <button type="button" className={`ss-btn ss-sound${sound ? " is-on" : ""}`} onClick={toggleSound} aria-pressed={sound} title={sound ? "Turn sound off" : "Turn sound on"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9z" />
                {sound ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
              </svg>
              <span>Sound</span>
            </button>
            {hasAudio && (
              <button type="button" className={`ss-btn${voice ? " is-on" : ""}`} onClick={() => setVoice((v) => !v)} aria-pressed={voice}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 9v6h4l5 4V5L8 9z" />
                  {voice ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
                </svg>
                <span>Narration</span>
              </button>
            )}
            {cur.ask && (
              <Link className="ss-ask" href={`/chat?mode=story&q=${encodeURIComponent(cur.ask)}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" /></svg>
                <span>Ask Cosmo</span>
              </Link>
            )}
            <span className="ss-nav">
              <button type="button" className="ss-btn ss-btn--icon" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous scene">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6" /></svg>
              </button>
              <span className="ss-count">{onCard ? "·" : `${sceneNo} / ${sceneCount}`}</span>
              <button type="button" className="ss-btn ss-btn--icon" onClick={() => goTo(active + 1)} disabled={active === last} aria-label="Next scene">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </span>
          </span>
        </div>
        {hasAudio && <audio ref={audio} preload="none" />}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { StoryScene } from "@/lib/story/types";

// One continuous scroll through the story: a framed picture (or video) in the middle of a starry
// background. Scrolling blends each picture into the next, moves the camera slowly over it, and
// carries the story's line up through the frame, like a picture book you scroll.

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

export default function StoryScroll({ scenes, storyTitle, storySubtitle, chapters, folder }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const moving = useRef<(HTMLElement | null)[]>([]);
  const bubbles = useRef<(HTMLDivElement | null)[]>([]);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrap.current;
      if (!el) return;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const p = clamp((window.scrollY - top) / vh, 0, scenes.length - 1);
      const k = Math.floor(p);
      const f = p - k;
      const cross = k < scenes.length - 1 ? smooth((f - 0.55) / 0.45) : 0;
      const fw = frame.current?.clientWidth ?? 1;
      const fh = frame.current?.clientHeight ?? 1;

      scenes.forEach((sc, i) => {
        const layer = layers.current[i];
        if (!layer) return;
        let o = i === k ? 1 - cross : i === k + 1 ? cross : 0;
        // chapter titles appear only once the picture before them has mostly faded
        if (sc.card && i === k + 1) o = smooth((cross - 0.45) / 0.55);
        layer.style.opacity = String(o);
        layer.style.visibility = o > 0.001 ? "visible" : "hidden";
        // camera: from when the scene starts fading in until it has faded out
        const lp = clamp((p - i + 0.45) / 1.45);
        const m = moving.current[i];
        if (m && !still) {
          if (sc.fit === "pan") {
            const iw = m.clientWidth;
            const from = sc.panFrom ?? 0;
            const t = from + (1 - from) * lp;
            m.style.transform = `translate3d(${-t * Math.max(0, iw - fw)}px,0,0)`;
          } else {
            const [z0, z1] = sc.zoom ?? [1, 1.08];
            m.style.transform = `scale(${z0 + (z1 - z0) * lp})`;
          }
        }
        const v = videos.current[i];
        if (v) {
          if (o > 0.01 && v.paused) v.play().catch(() => {});
          else if (o <= 0.01 && !v.paused) v.pause();
        }
        // the story line rises through the frame while its picture is on screen
        const b = bubbles.current[i];
        if (b) {
          const bf = i === k ? f : i === k + 1 ? f - 1 : i < k ? 1 : -1;
          const y = (0.6 - bf * 0.72) * fh;
          const op = clamp((bf + 0.12) / 0.16) * (1 - smooth((bf - 0.72) / 0.22));
          b.style.transform = `translate3d(0,${y}px,0)`;
          b.style.opacity = String(op);
          b.style.visibility = op > 0.001 ? "visible" : "hidden";
        }
      });

      const shown = cross > 0.5 ? k + 1 : k;
      if (shown !== activeRef.current) {
        activeRef.current = shown;
        setActive(shown);
      }
      setNear((n) => (Math.abs(n - k) >= 1 ? k : n));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [scenes]);

  const cur = scenes[active];
  const onCard = !!cur.card;
  const sceneNo = scenes.slice(0, active + 1).filter((s) => !s.card).length;
  const sceneCount = scenes.filter((s) => !s.card).length;

  return (
    <div className="ss" ref={wrap} style={{ height: `${scenes.length * 100}svh` }}>
      <div className="ss-stage">
        <div className="ss-sky" aria-hidden="true" />

        <div className={`ss-head${onCard ? " is-hidden" : ""}`} aria-live="polite">
          <span className="ss-head__n">{cur.chapter ? `Chapter ${cur.chapter}:` : storyTitle}</span>
          <span className="ss-head__t">{cur.chapter ? chapters[cur.chapter] : storySubtitle}</span>
        </div>

        <div className="ss-frame" ref={frame}>
          {scenes.map((sc, i) => {
            const load = Math.abs(i - near) <= 3;
            return (
              <div key={i} className={`ss-layer${sc.card ? " is-card" : ""}`} ref={(el) => { layers.current[i] = el; }} aria-hidden={i !== active}>
                {sc.card ? (
                  <div className="ss-card">
                    {sc.chapter ? (
                      <>
                        <span className="ss-card__n">Chapter {sc.chapter}</span>
                        <h2 className="ss-card__t">{chapters[sc.chapter]}</h2>
                      </>
                    ) : (
                      <>
                        <span className="ss-card__n">A Cosmic Juniors story</span>
                        <h1 className="ss-card__t ss-card__t--story">{storyTitle}</h1>
                        <p className="ss-card__sub">{storySubtitle}</p>
                        <span className="ss-card__hint">
                          Scroll to begin
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                        </span>
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
                        src={`${folder}${sc.video}`}
                        poster={sc.image}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onCanPlay={(e) => {
                          // a clip that finishes loading while its scene is on screen starts right away
                          const v = e.currentTarget;
                          const layer = v.closest(".ss-layer") as HTMLElement | null;
                          if (layer && Number(layer.style.opacity) > 0.01 && v.paused) v.play().catch(() => {});
                        }}
                      />
                    ) : load ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img ref={(el) => { moving.current[i] = el; }} className="ss-pic__main" src={sc.image} alt={sc.credit ?? ""} decoding="async" />
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}

          {scenes.map((sc, i) =>
            sc.text ? (
              <div key={`b${i}`} className={`ss-bubble${scenes.slice(0, i).filter((s) => !s.card).length % 2 ? " is-right" : ""}`} ref={(el) => { bubbles.current[i] = el; }}>
                {sc.text}
              </div>
            ) : null,
          )}
        </div>

        <div className={`ss-meta${onCard ? " is-hidden" : ""}`}>
          <p className="ss-caption">{cur.text}</p>
          <div className="ss-meta__row">
            <span className="ss-credit">{cur.credit}</span>
            <span className="ss-meta__end">
              {cur.ask && (
                <Link className="ss-ask" href={`/chat?mode=story&q=${encodeURIComponent(cur.ask)}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" /></svg>
                  Ask Cosmo
                </Link>
              )}
              <span className="ss-count">{sceneNo} / {sceneCount}</span>
            </span>
          </div>
        </div>

        <div className="ss-progress" aria-hidden="true">
          <span style={{ height: `${((active + 1) / scenes.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNarration } from "./useNarration";
import styles from "./reader.module.css";

type Edition = {
  author: string;
  chapters: { title: string | null; paragraphs: string[]; background: string }[];
};

export default function NovelReader({ editions }: { editions: Edition[] }) {
  const [editionIndex, setEditionIndex] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [menu, setMenu] = useState<"contents" | "settings" | null>(null);
  const [audioOpen, setAudioOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [textSize, setTextSize] = useState(22);
  const [progress, setProgress] = useState(0);
  const reader = useRef<HTMLElement>(null);
  const article = useRef<HTMLElement>(null);
  const audioButton = useRef<HTMLButtonElement>(null);
  const contentsButton = useRef<HTMLButtonElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const edition = editions[editionIndex];
  const chapter = edition.chapters[chapterIndex];
  const chapterLabel = "Chapter " + (chapterIndex + 1);
  const title = chapter.title ? chapterLabel + " · " + chapter.title : chapterLabel;
  const narrationText = useMemo(() => chapter.paragraphs.join("\n\n"), [chapter]);
  const narration = useNarration(narrationText);

  useEffect(() => {
    const viewport = reader.current;
    const content = article.current;
    if (!viewport || !content) return;
    const sync = () => {
      const distance = viewport.scrollHeight - viewport.clientHeight;
      setProgress(distance > 0 ? Math.max(0, Math.min(viewport.scrollTop / distance, 1)) : 0);
    };
    const resize = new ResizeObserver(sync);
    resize.observe(viewport);
    resize.observe(content);
    viewport.addEventListener("scroll", sync, { passive: true });
    sync();
    return () => {
      resize.disconnect();
      viewport.removeEventListener("scroll", sync);
    };
  }, []);

  function openChapter(nextEdition: number, nextChapter: number) {
    if (nextEdition !== editionIndex || nextChapter !== chapterIndex) {
      narration.reset();
      setEditionIndex(nextEdition);
      setChapterIndex(nextChapter);
      reader.current?.scrollTo({ top: 0, behavior: "instant" });
      setProgress(0);
    }
    setMenu(null);
  }

  function goToChapter(index: number) {
    openChapter(editionIndex, index);
    reader.current?.focus({ preventScroll: true });
  }

  function closeAudio() {
    narration.stop();
    setAudioOpen(false);
    audioButton.current?.focus();
  }

  return (
    <div
      className={styles.novel}
      data-appearance={dark ? "dark" : "light"}
      data-audio-open={audioOpen}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        if (menu) {
          setMenu(null);
          const trigger = menu === "contents" ? contentsButton : settingsButton;
          trigger.current?.focus();
        } else if (audioOpen) closeAudio();
      }}
    >
      <div
        className={styles.backdrop}
        aria-hidden="true"
        style={{ backgroundImage: "url(" + chapter.background + ")" }}
      />

      <header className={styles.header}>
        <div className={styles.tools} aria-label="Reader controls" role="group">
          <Link href="/" className={styles.home}><span aria-hidden="true">‹ </span>Home</Link>
          <button
            ref={contentsButton}
            type="button"
            aria-expanded={menu === "contents"}
            aria-controls="novel-contents"
            onClick={() => setMenu(menu === "contents" ? null : "contents")}
          >Contents</button>
          <button
            ref={settingsButton}
            type="button"
            aria-label="Reading options"
            aria-expanded={menu === "settings"}
            aria-controls="novel-settings"
            onClick={() => setMenu(menu === "settings" ? null : "settings")}
          >Aa</button>
          <button
            ref={audioButton}
            type="button"
            aria-expanded={audioOpen}
            aria-controls="novel-audio"
            onClick={() => {
              if (audioOpen) closeAudio();
              else {
                setMenu(null);
                setAudioOpen(true);
              }
            }}
          >Audiobook</button>
        </div>

        <h1 className={styles.title} aria-live="polite">{title}</h1>

        <div className={styles.versions} role="group" aria-label="Manuscript version">
          {editions.map((version, index) => (
            <button
              key={version.author}
              type="button"
              aria-pressed={index === editionIndex}
              onClick={() => openChapter(index, chapterIndex < version.chapters.length ? chapterIndex : 0)}
            >
              V{index + 1} <span>· {version.author}</span>
            </button>
          ))}
        </div>

        <nav id="novel-contents" className={styles.popover} aria-label="Chapters" hidden={menu !== "contents"}>
          {edition.chapters.map((entry, index) => (
            <button
              key={index}
              type="button"
              aria-current={index === chapterIndex ? "true" : undefined}
              onClick={() => goToChapter(index)}
            >
              {entry.title ? (index + 1) + ". " + entry.title : "Chapter " + (index + 1)}
            </button>
          ))}
        </nav>

        <div id="novel-settings" className={styles.popover} hidden={menu !== "settings"}>
          <div className={styles.settingsRow} role="group" aria-label="Appearance">
            <button type="button" aria-pressed={!dark} onClick={() => setDark(false)}>Light</button>
            <button type="button" aria-pressed={dark} onClick={() => setDark(true)}>Dark</button>
          </div>
          <div className={styles.settingsRow} role="group" aria-label="Text size">
            <button type="button" aria-label="Smaller text" disabled={textSize <= 16} onClick={() => setTextSize(size => size - 2)}>A−</button>
            <button type="button" aria-label="Larger text" disabled={textSize >= 32} onClick={() => setTextSize(size => size + 2)}>A+</button>
          </div>
        </div>
      </header>

      <main ref={reader} className={styles.reader} tabIndex={0} aria-label="Chapter text">
        <article ref={article} className={styles.prose} style={{ fontSize: textSize }}>
          {chapter.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <div className={styles.chapterLinks}>
            {chapterIndex > 0 && (
              <button type="button" onClick={() => goToChapter(chapterIndex - 1)}>← Previous chapter</button>
            )}
            {chapterIndex + 1 < edition.chapters.length && (
              <button type="button" onClick={() => goToChapter(chapterIndex + 1)}>Next chapter →</button>
            )}
          </div>
        </article>
      </main>

      <footer className={styles.progress} hidden={audioOpen}>
        {chapterLabel} · {Math.round(progress * 100)}%
      </footer>

      <section id="novel-audio" className={styles.player} aria-label="Audiobook player" hidden={!audioOpen}>
        <div className={styles.audioRow}>
          <div className={styles.transport}>
            <button type="button" title="Playback speed" aria-label={"Playback speed " + narration.rate + " times"} onClick={narration.cycleRate}>{narration.rate}×</button>
            <button type="button" title="Back about 15 seconds" aria-label="Back about 15 seconds" onClick={() => narration.skip(-15)}>↶<small>15</small></button>
            <button type="button" className={styles.play} aria-label={narration.playing ? "Pause narration" : "Play narration"} onClick={narration.toggle}>{narration.playing ? "Ⅱ" : "▶"}</button>
            <button type="button" title="Forward about 30 seconds" aria-label="Forward about 30 seconds" onClick={() => narration.skip(30)}>↷<small>30</small></button>
          </div>
          <div className={styles.audioTitle}>
            <strong>{chapter.title ?? chapterLabel}</strong>
            <small role="status">{narration.error || "Browser narration"}</small>
          </div>
          <label className={styles.volume}>
            <span>Volume</span>
            <input type="range" min="0" max="1" step="0.05" value={narration.volume} onChange={(event) => narration.changeVolume(Number(event.currentTarget.value))} />
          </label>
          <button className={styles.close} type="button" aria-label="Close audiobook" onClick={closeAudio}>×</button>
        </div>
        <input className={styles.seek} aria-label="Narration progress" type="range" min="0" max="100" value={narration.progress} onChange={(event) => narration.seekPercent(Number(event.currentTarget.value))} />
      </section>
    </div>
  );
}

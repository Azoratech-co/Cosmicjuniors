"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import ScrollPicker from "@/components/rovers/ScrollPicker";
import type { EmphasisRange } from "./emphasis";
import { useNarration } from "./useNarration";
import styles from "./reader.module.css";

type Chapter = {
  title: string | null;
  paragraphs: string[];
  background: string;
  emphasis: EmphasisRange[][];
};

type Edition = { author: string; chapters: Chapter[] };

function emphasizedParagraph(text: string, ranges: EmphasisRange[]) {
  let cursor = 0;
  const parts = ranges.map(({ start, end }) => {
    if (start < cursor) return null;
    const plain = text.slice(cursor, start);
    cursor = end;
    return <Fragment key={start}>{plain}<em className={styles.emphasis}>{text.slice(start, end)}</em></Fragment>;
  });
  return <>{parts}{text.slice(cursor)}</>;
}

export default function NovelReader({ editions, fontClassName }: { editions: Edition[]; fontClassName: string }) {
  const [editionIndex, setEditionIndex] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [contentsOpen, setContentsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [textSize, setTextSize] = useState(24);
  const [progress, setProgress] = useState(0);
  const reader = useRef<HTMLElement>(null);
  const article = useRef<HTMLElement>(null);
  const audioButton = useRef<HTMLButtonElement>(null);
  const contentsButton = useRef<HTMLButtonElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const chapters = editions[editionIndex].chapters;
  const chapterItems = useMemo(() => chapters.map((entry, index) => ({
    id: String(index),
    name: entry.title ? (index + 1) + ". " + entry.title : "Chapter " + (index + 1),
    index,
  })), [chapters]);
  const chapter = chapters[chapterIndex];
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
    if (nextEdition === editionIndex && nextChapter === chapterIndex) return;
    narration.reset();
    setEditionIndex(nextEdition);
    setChapterIndex(nextChapter);
    reader.current?.scrollTo({ top: 0, behavior: "instant" });
    setProgress(0);
  }

  function goToChapter(index: number, focusReader = true) {
    openChapter(editionIndex, index);
    if (focusReader) reader.current?.focus({ preventScroll: true });
  }

  function closeAudio() {
    narration.stop();
    setAudioOpen(false);
    audioButton.current?.focus();
  }

  return (
    <div
      className={styles.novel + " " + fontClassName}
      data-contents-open={contentsOpen}
      data-appearance={dark ? "dark" : "light"}
      data-audio-open={audioOpen}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        if (settingsOpen) {
          setSettingsOpen(false);
          settingsButton.current?.focus();
        } else if (audioOpen) closeAudio();
        else if (contentsOpen) {
          setContentsOpen(false);
          contentsButton.current?.focus();
        }
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
            aria-expanded={contentsOpen}
            aria-controls="novel-contents"
            onClick={() => setContentsOpen((open) => !open)}
          >Contents</button>
          <button
            ref={settingsButton}
            type="button"
            aria-label="Reading options"
            aria-expanded={settingsOpen}
            aria-controls="novel-settings"
            onClick={() => setSettingsOpen((open) => !open)}
          >Aa</button>
          <button
            ref={audioButton}
            type="button"
            aria-expanded={audioOpen}
            aria-controls="novel-audio"
            onClick={() => {
              if (audioOpen) closeAudio();
              else {
                setSettingsOpen(false);
                setAudioOpen(true);
              }
            }}
          >Audiobook</button>
        </div>

        <h1 className={styles.title} aria-live="polite">{title}</h1>

        {editions.length > 1 && (
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
        )}

        <div id="novel-settings" className={styles.popover} hidden={!settingsOpen}>
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

      <nav id="novel-contents" className={styles.contents} aria-labelledby="novel-chapter-picker" hidden={!contentsOpen}>
        <h2 id="novel-chapter-picker">Chapters</h2>
        <ScrollPicker
          items={chapterItems}
          selected={String(chapterIndex)}
          label="Choose a chapter"
          onSelect={(item) => goToChapter(item.index, false)}
        />
      </nav>

      <main ref={reader} className={styles.reader} tabIndex={0} aria-label="Chapter text">
        <article ref={article} className={styles.prose} style={{ "--novel-type-size": textSize + "px" } as CSSProperties}>
          {chapter.paragraphs.map((paragraph, index) => <p key={index}>{emphasizedParagraph(paragraph, chapter.emphasis[index])}</p>)}
          <div className={styles.chapterLinks}>
            {chapterIndex > 0 && (
              <button type="button" onClick={() => goToChapter(chapterIndex - 1)}>← Previous chapter</button>
            )}
            {chapterIndex + 1 < chapters.length && (
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

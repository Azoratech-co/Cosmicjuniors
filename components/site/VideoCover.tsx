"use client";

import { useState } from "react";

/** A YouTube video that shows our own cover until the visitor presses play. */
export default function VideoCover({ youtubeId, title, cover }: { youtubeId: string; title: string; cover: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <button type="button" className="video-card__cover" onClick={() => setPlaying(true)} aria-label={`Play ${title}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="video-card__cover-img" src={cover} alt="" loading="lazy" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="video-card__play" src="/figma/play.svg" alt="" width={72} height={72} />
      <span className="video-card__title">{title}</span>
    </button>
  );
}

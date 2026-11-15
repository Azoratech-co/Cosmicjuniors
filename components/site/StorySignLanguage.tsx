"use client";

import { useEffect, useRef } from "react";
import type { StorySignVideo } from "@/lib/story/types";

interface Props {
  signVideo: StorySignVideo;
  open: boolean;
  onCueChange: (index: number) => void;
}

export default function StorySignLanguage({ signVideo, open, onCueChange }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const currentCue = useRef(0);
  useEffect(() => {
    const element = video.current;
    if (!open || !element) return;
    void element.play().catch(() => {});
    return () => element.pause();
  }, [open, signVideo.src]);

  function updateCue(time: number) {
    const index = Math.max(0, signVideo.cues.findLastIndex((cue) => cue.start <= time));
    if (index === currentCue.current) return;
    currentCue.current = index;
    onCueChange(index);
  }

  function repeatPlayback() {
    const element = video.current;
    if (!element || !open) return;
    element.currentTime = 0;
    updateCue(0);
    void element.play().catch(() => {});
  }

  return (
    <aside id="story-sign-language-panel" className="ss-sign-panel" aria-label="Sign language video" hidden={!open}>
      <video
        ref={video}
        src={signVideo.src}
        muted
        playsInline
        preload={open ? "auto" : "none"}
        aria-label="American Sign Language for this slide"
        onTimeUpdate={(event) => updateCue(event.currentTarget.currentTime)}
        onSeeked={(event) => updateCue(event.currentTarget.currentTime)}
      />
      <div className="ss-sign-controls">
        <button type="button" className="ss-btn" onClick={repeatPlayback} aria-label="Repeat sign language video">
          Repeat
        </button>
      </div>
    </aside>
  );
}

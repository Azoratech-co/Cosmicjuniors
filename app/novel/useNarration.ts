"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const rates = [1, 1.25, 1.5, 0.75];
const chunkLimit = 240;

function chunkEnd(text: string, start: number) {
  const limit = Math.min(start + chunkLimit, text.length);
  if (limit === text.length) return limit;

  const fragment = text.slice(start, limit);
  const sentence = fragment.match(/^.*[.!?](?=\s)/s);
  if (sentence) return start + sentence[0].length;
  const space = fragment.lastIndexOf(" ");
  return space > 0 ? start + space : limit;
}

export function useNarration(text: string) {
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState("");
  const latestPosition = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  const cancel = useCallback(() => {
    if (!utterance.current) return;
    utterance.current = null;
    window.speechSynthesis.cancel();
  }, []);
  useEffect(() => () => cancel(), [cancel]);

  function updatePosition(next: number) {
    latestPosition.current = next;
    setPosition(next);
  }

  function stop() {
    cancel();
    setPlaying(false);
  }

  function reset() {
    stop();
    updatePosition(0);
    setError("");
  }

  function play(from: number, speed = rate, loudness = volume) {
    cancel();
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setPlaying(false);
      setError("Read-aloud is unavailable in this browser.");
      return;
    }

    setError("");
    setPlaying(true);
    function speakChunk(start: number) {
      while (start < text.length && /\s/.test(text[start])) start++;
      updatePosition(start);
      if (start >= text.length) {
        utterance.current = null;
        setPlaying(false);
        return;
      }

      const end = chunkEnd(text, start);
      const speech = new SpeechSynthesisUtterance(text.slice(start, end));
      speech.lang = "en-US";
      speech.rate = speed;
      speech.volume = loudness;
      utterance.current = speech;
      speech.onboundary = (event) => {
        if (utterance.current === speech) updatePosition(start + event.charIndex);
      };
      speech.onend = () => {
        if (utterance.current === speech) speakChunk(end);
      };
      speech.onerror = () => {
        if (utterance.current !== speech) return;
        utterance.current = null;
        setPlaying(false);
        setError("The browser could not start a reading voice.");
      };
      window.speechSynthesis.speak(speech);
    }
    speakChunk(from);
  }

  function seek(target: number) {
    let next = Math.max(0, Math.min(text.length, Math.round(target)));
    while (next > 0 && next < text.length && !/\s/.test(text[next - 1])) next--;
    if (playing && next < text.length) play(next);
    else {
      stop();
      updatePosition(next);
    }
  }

  return {
    playing, rate, volume, error, stop, reset,
    progress: Math.round(100 * position / text.length),
    toggle() {
      if (playing) stop();
      else play(latestPosition.current >= text.length ? 0 : latestPosition.current);
    },
    seekPercent(percent: number) {
      seek(text.length * percent / 100);
    },
    skip(seconds: number) {
      seek(latestPosition.current + seconds * 13 * rate);
    },
    cycleRate() {
      const next = rates[(rates.indexOf(rate) + 1) % rates.length];
      setRate(next);
      if (playing) play(latestPosition.current, next);
    },
    changeVolume(next: number) {
      setVolume(next);
      if (playing) play(latestPosition.current, rate, next);
    },
  };
}

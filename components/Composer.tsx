"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, MicIcon } from "./Icons";

// Figma: Composer (v3 · Cosmo (homepage theme)). Text field, mic (browser speech
// recognition, hidden where unsupported) and send button.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Recognition = any;

export default function Composer({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => {
    const w = window as any;
    setCanListen(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const submit = (value = text) => {
    const v = value.trim();
    if (!v || disabled) return;
    onSend(v);
    setText("");
  };

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec: Recognition = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as ArrayLike<any>)
        .map((r) => r[0].transcript)
        .join("");
      setText(transcript);
      if (e.results[e.results.length - 1].isFinal) submit(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        className="composer__field"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={listening ? "Listening…" : "Ask Cosmo anything…"}
        aria-label="Ask Cosmo a question"
        maxLength={300}
      />
      {canListen && (
        <button
          type="button"
          className={`icon-btn${listening ? " is-listening" : ""}`}
          onClick={toggleMic}
          aria-label={listening ? "Stop listening" : "Ask with your voice"}
        >
          <MicIcon />
        </button>
      )}
      <button type="submit" className="icon-btn icon-btn--solid" aria-label="Send" disabled={disabled || !text.trim()}>
        <ArrowUpIcon />
      </button>
    </form>
  );
}

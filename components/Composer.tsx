"use client";

import { useEffect, useRef, useState } from "react";

// Figma: Composer. Text field + send button, plus a mic button that uses the
// browser's built-in speech recognition (Chrome, Edge, Safari) so younger kids
// can talk instead of type. The mic hides itself where it isn't supported.

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
      {canListen && (
        <button
          type="button"
          className={`round-btn round-btn--dark${listening ? " is-listening" : ""}`}
          onClick={toggleMic}
          aria-label={listening ? "Stop listening" : "Talk to Cosmo"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
      <input
        className="composer__field t-body"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={listening ? "Listening…" : "Ask Cosmo anything…"}
        aria-label="Ask Cosmo a question"
        maxLength={300}
      />
      <button type="submit" className="round-btn round-btn--purple" aria-label="Send" disabled={disabled || !text.trim()}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}

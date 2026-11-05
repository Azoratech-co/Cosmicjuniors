"use client";

import { useEffect, useRef, useState } from "react";
import Composer from "./Composer";
import Sidebar from "./Sidebar";
import Starfield from "./Starfield";
import { ChatHeader, MessageRow, QuickReplies, Typing, Welcome } from "./ChatParts";
import type { ChatMessage, ChatReply } from "@/lib/types";

const STARS_KEY = "cj-stars";

const uid = () => Math.random().toString(36).slice(2);

export default function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [stars, setStars] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  // The bot message currently being "typed" on screen.
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Stars are saved in this browser only (no accounts yet).
  useEffect(() => {
    try {
      setStars(Number(localStorage.getItem(STARS_KEY)) || 0);
    } catch {}
  }, []);

  // Keep the newest message in view, including while Cosmo is typing.
  useEffect(() => {
    const scroller = scrollRef.current;
    const thread = threadRef.current;
    if (!scroller || !thread) return;
    const ro = new ResizeObserver(() => scroller.scrollTo({ top: scroller.scrollHeight }));
    ro.observe(thread);
    return () => ro.disconnect();
  }, []);

  const addStar = () =>
    setStars((s) => {
      const n = s + 1;
      try {
        localStorage.setItem(STARS_KEY, String(n));
      } catch {}
      return n;
    });

  const ask = async (text: string) => {
    if (thinking || revealingId) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", text, at: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setSuggestions([]);
    setThinking(true);
    setHistory((h) => [text, ...h.filter((x) => x !== text)].slice(0, 6));
    addStar();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, text }) => ({ role, text })) }),
      });
      if (res.status === 429) {
        throw new Error("slow-down");
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reply: ChatReply = await res.json();
      const id = uid();
      setRevealingId(id);
      setMessages((m) => [...m, { id, role: "bot", text: reply.text, source: reply.source, at: Date.now() }]);
      setSuggestions(reply.suggestions ?? []);
    } catch (err) {
      const text =
        err instanceof Error && err.message === "slow-down"
          ? "That’s a lot of questions in a short time. Give me a few seconds, then ask again."
          : "I lost the signal for a moment. Please try asking again.";
      setMessages((m) => [...m, { id: uid(), role: "bot", text, at: Date.now() }]);
    } finally {
      setThinking(false);
    }
  };

  const reset = () => {
    setRevealingId(null);
    setMessages([]);
    setSuggestions([]);
  };

  const empty = messages.length === 0;

  return (
    <div className="app">
      <Starfield />
      <div className="mars-glow" aria-hidden="true" />
      <Sidebar stars={stars} history={history} onNew={reset} onPick={ask} />
      <main className="main">
        <ChatHeader stars={stars} />
        <div className="scroll" ref={scrollRef}>
          <div className={`thread${empty ? " thread--empty" : ""}`} ref={threadRef}>
            {empty ? (
              <Welcome onPick={ask} />
            ) : (
              <>
                <div className="row row--center">
                  <span className="day-pill t-caption c-muted">Today</span>
                </div>
                {messages.map((m) => (
                  <MessageRow
                    key={m.id}
                    message={m}
                    animate={m.id === revealingId}
                    onDone={() => setRevealingId((cur) => (cur === m.id ? null : cur))}
                  />
                ))}
                {thinking && <Typing />}
                {!thinking && !revealingId && suggestions.length > 0 && (
                  <QuickReplies items={suggestions} onPick={ask} />
                )}
              </>
            )}
          </div>
        </div>
        <div className="composer-wrap">
          <Composer onSend={ask} disabled={thinking || Boolean(revealingId)} />
          <p className="t-body-sm c-muted disclaimer">
            Answers are based on NASA sources. Open a source card to read more.
          </p>
        </div>
      </main>
    </div>
  );
}

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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stars are saved in this browser only (no accounts yet).
  useEffect(() => {
    try {
      setStars(Number(localStorage.getItem(STARS_KEY)) || 0);
    } catch {}
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const addStar = () =>
    setStars((s) => {
      const n = s + 1;
      try {
        localStorage.setItem(STARS_KEY, String(n));
      } catch {}
      return n;
    });

  const ask = async (text: string) => {
    if (thinking) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", text };
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reply: ChatReply = await res.json();
      setMessages((m) => [...m, { id: uid(), role: "bot", text: reply.text, card: reply.card }]);
      setSuggestions(reply.suggestions ?? []);
    } catch {
      setMessages((m) => [
        ...m,
        { id: uid(), role: "bot", text: "Oops! My radio lost signal 📡 Can you try asking again?" },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setSuggestions([]);
  };

  const empty = messages.length === 0;

  return (
    <div className="app">
      <Starfield />
      <Sidebar stars={stars} history={history} onNew={reset} onPick={ask} />
      <main className="main">
        <ChatHeader stars={stars} />
        <div className="scroll" ref={scrollRef}>
          <div className={`thread${empty ? " thread--empty" : ""}`}>
            {empty ? (
              <Welcome onPick={ask} />
            ) : (
              <>
                <div className="row row--center">
                  <span className="day-pill t-caption c-muted">Today</span>
                </div>
                {messages.map((m) => (
                  <MessageRow key={m.id} message={m} />
                ))}
                {thinking && <Typing />}
                {!thinking && suggestions.length > 0 && <QuickReplies items={suggestions} onPick={ask} />}
              </>
            )}
          </div>
        </div>
        <div className="composer-wrap">
          <Composer onSend={ask} disabled={thinking} />
          <p className="t-caption c-muted disclaimer">
            Cosmo can make mistakes — ask a grown-up to double-check big facts! 🌍
          </p>
        </div>
      </main>
    </div>
  );
}

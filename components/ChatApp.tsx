"use client";

import { useEffect, useRef, useState } from "react";
import Composer from "./Composer";
import { MessageRow, Pills, SiteHeader, Typing, Welcome } from "./ChatParts";
import type { ChatMessage, ChatReply } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2);

export default function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    const scroller = scrollRef.current;
    const thread = threadRef.current;
    if (!scroller || !thread) return;
    const ro = new ResizeObserver(() => scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" }));
    ro.observe(thread);
    return () => ro.disconnect();
  }, []);

  const ask = async (text: string) => {
    if (thinking) return;
    const next: ChatMessage[] = [...messages, { id: uid(), role: "user", text, at: Date.now() }];
    setMessages(next);
    setSuggestions([]);
    setThinking(true);

    let reply: ChatReply;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, text }) => ({ role, text })) }),
      });
      reply =
        res.status === 429
          ? { text: "That’s a lot of questions in a short time. Give me a few seconds, then ask again." }
          : res.ok
            ? await res.json()
            : { text: "I couldn’t reach my notes just now. Please try asking again." };
    } catch {
      reply = { text: "I couldn’t reach my notes just now. Check your connection and try again." };
    }

    setMessages((m) => [...m, { id: uid(), role: "bot", text: reply.text, source: reply.source, at: Date.now() }]);
    setSuggestions(reply.suggestions ?? []);
    setThinking(false);
  };

  const reset = () => {
    setMessages([]);
    setSuggestions([]);
  };

  const empty = messages.length === 0;

  return (
    <div className="app">
      <SiteHeader />
      <div className="scroll" ref={scrollRef}>
        <div className="column thread" ref={threadRef}>
          {empty ? (
            <Welcome onPick={ask} />
          ) : (
            <>
              <div className="thread__top">
                <span className="eyebrow">03 · Ask Cosmo</span>
                <button className="link" onClick={reset} disabled={thinking}>
                  New chat →
                </button>
              </div>
              {messages.map((m) => (
                <MessageRow key={m.id} message={m} />
              ))}
              {thinking && <Typing />}
              {!thinking && suggestions.length > 0 && <Pills items={suggestions} onPick={ask} indent />}
            </>
          )}
        </div>
      </div>
      <div className="column composer-wrap">
        <Composer onSend={ask} disabled={thinking} />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Composer from "./Composer";
import Sidebar from "./Sidebar";
import ChatsPanel from "./ChatsPanel";
import { fallbackTitle, loadChats, saveChats, type SavedChat } from "@/lib/chats";
import Starfield from "./Starfield";
import { ChatHeader, MessageRow, QuickReplies, Typing, Welcome } from "./ChatParts";
import type { ChatMessage, ChatMode, ChatReply } from "@/lib/types";
import { STARS_EVENT, addStars, getStars } from "@/lib/stars";


const uid = () => Math.random().toString(36).slice(2);

export default function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [stars, setStars] = useState(0);
  const [chats, setChats] = useState<SavedChat[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  // The bot message currently being "typed" on screen.
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>("guide");
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Stars are saved in this browser only (no accounts yet). Stay in sync with every screen.
  useEffect(() => {
    const sync = () => setStars(getStars());
    sync();
    window.addEventListener(STARS_EVENT, sync);
    return () => window.removeEventListener(STARS_EVENT, sync);
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

  const addStar = () => addStars(1);

  // Saved conversations (this browser only).
  useEffect(() => setChats(loadChats()), []);

  /** Save the current conversation. Its name is set once, from the first answer, and never changes. */
  const persist = (id: string, msgs: ChatMessage[], title?: string) => {
    setChats((all) => {
      const existing = all.find((c) => c.id === id);
      const now = Date.now();
      const chat: SavedChat = existing
        ? { ...existing, messages: msgs, updatedAt: now, title: existing.title || title || "" }
        : { id, title: title || "", createdAt: now, updatedAt: now, messages: msgs };
      return saveChats([chat, ...all.filter((c) => c.id !== id)]);
    });
  };

  const openChat = (id: string) => {
    const c = chats.find((x) => x.id === id);
    if (!c || thinking) return;
    setRevealingId(null);
    setChatId(id);
    setMessages(c.messages);
    setSuggestions([]);
  };

  const deleteChat = (id: string) => {
    setChats((all) => saveChats(all.filter((c) => c.id !== id)));
    if (id === chatId) {
      setChatId(null);
      setMessages([]);
      setSuggestions([]);
    }
  };

  const ask = async (text: string, askMode: ChatMode = mode) => {
    if (thinking || revealingId) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", text, at: Date.now() };
    const next = [...messages, userMsg];
    const id0 = chatId ?? uid();
    if (!chatId) setChatId(id0);
    setMessages(next);
    setSuggestions([]);
    setThinking(true);
    persist(id0, next);
    addStar();

    const send = async (): Promise<ChatReply> => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, text }) => ({ role, text })), mode: askMode }),
      });
      if (res.status === 429) throw new Error("slow-down");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    };

    try {
      let reply = await send();
      // If Cosmo's AI was busy, wait a moment and quietly ask again (up to twice) before showing anything.
      for (let i = 0; reply.busy && i < 2; i++) {
        await new Promise((r) => setTimeout(r, 5000 + i * 3000));
        reply = await send();
      }
      const id = uid();
      setRevealingId(id);
      const botMsg: ChatMessage = {
        id,
        role: "bot",
        text: reply.text,
        source: reply.source,
        references: reply.references,
        checked: reply.checked,
        story: reply.story,
        at: Date.now(),
      };
      setMessages((m) => [...m, botMsg]);
      persist(id0, [...next, botMsg], reply.title || fallbackTitle(next[0].text, reply.source));
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
    setChatId(null);
    setMessages([]);
    setSuggestions([]);
  };

  const empty = messages.length === 0;

  return (
    <div className="app">
      <Starfield />
      <div className="mars-glow" aria-hidden="true" />
      <Sidebar
        chats={chats}
        currentId={chatId}
        onNew={reset}
        onOpen={openChat}
        onDelete={deleteChat}
        onSeeAll={() => setPanelOpen(true)}
      />
      <ChatsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onNew={reset}
        chats={chats}
        currentId={chatId}
        onOpen={openChat}
        onDelete={deleteChat}
      />
      <main className="main">
        <ChatHeader stars={stars} onChats={() => setPanelOpen(true)} chatCount={chats.length} />
        <div className="scroll" ref={scrollRef}>
          <div className={`thread${empty ? " thread--empty" : ""}`} ref={threadRef}>
            {empty ? (
              <Welcome
                onPick={(q) => ask(q)}
                onStory={(q) => {
                  setMode("story");
                  ask(q, "story");
                }}
              />
            ) : (
              <>
                {messages.map((m, i) => (
                  <MessageRow
                    key={m.id}
                    message={m}
                    repeat={(() => {
                      const prev = messages.slice(0, i).reverse().find((x) => x.role === "bot" && x.source);
                      return Boolean(
                        m.source && prev?.source && prev.source.id === m.source.id && prev.source.image?.src === m.source.image?.src,
                      );
                    })()}
                    animate={m.id === revealingId}
                    onDone={() => setRevealingId((cur) => (cur === m.id ? null : cur))}
                  />
                ))}
                {thinking && <Typing />}
                {!thinking && !revealingId && suggestions.length > 0 && (
                  <QuickReplies items={suggestions} onPick={(q) => ask(q)} />
                )}
              </>
            )}
          </div>
        </div>
        <div className="composer-wrap">
          <div className="mode-switch" role="radiogroup" aria-label="How Cosmo answers">
            <span className="mode-switch__thumb" data-mode={mode} aria-hidden="true" />
            <button role="radio" aria-checked={mode === "guide"} className={mode === "guide" ? "is-on" : ""} onClick={() => setMode("guide")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
              </svg>
              Explain
            </button>
            <button role="radio" aria-checked={mode === "story"} className={mode === "story" ? "is-on" : ""} onClick={() => setMode("story")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0z" />
                <path d="M12 5.5V19" />
              </svg>
              Story
            </button>
          </div>
          <Composer onSend={(q) => ask(q)} disabled={thinking || Boolean(revealingId)} />
        </div>
      </main>
    </div>
  );
}

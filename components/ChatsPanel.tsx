"use client";

import { useEffect, useRef } from "react";
import { when, type SavedChat } from "@/lib/chats";

// List of saved conversations. Used inline in the desktop sidebar and as a slide-in panel.

export function ChatList({
  chats,
  currentId,
  onOpen,
  onDelete,
  limit,
}: {
  chats: SavedChat[];
  currentId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  limit?: number;
}) {
  const list = limit ? chats.slice(0, limit) : chats;
  if (!list.length) return <p className="chats-empty">Your conversations will be saved here.</p>;
  return (
    <ul className="chat-list">
      {list.map((c) => (
        <li key={c.id} className={`chat-item${c.id === currentId ? " is-on" : ""}`}>
          <button className="chat-item__open" onClick={() => onOpen(c.id)} aria-current={c.id === currentId ? "true" : undefined}>
            <span className="chat-item__title">{c.title || "New conversation"}</span>
            <span className="chat-item__meta">
              {when(c.updatedAt)} · {c.messages.filter((m) => m.role === "user").length} questions
            </span>
          </button>
          <button className="chat-item__del" onClick={() => onDelete(c.id)} aria-label={`Delete "${c.title}"`} title="Delete">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function ChatsPanel({
  open,
  onClose,
  onNew,
  ...list
}: {
  open: boolean;
  onClose: () => void;
  onNew: () => void;
  chats: SavedChat[];
  currentId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`chats-layer${open ? " is-open" : ""}`} aria-hidden={!open}>
      <div className="chats-backdrop" onClick={onClose} />
      <div className="chats-panel" role="dialog" aria-modal="true" aria-label="Conversations" ref={panelRef}>
        <div className="chats-panel__head">
          <h2 className="chats-panel__title">Conversations</h2>
          <button className="chats-panel__close" onClick={onClose} aria-label="Close conversations">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <button
          className="btn-purple t-label chats-panel__new"
          onClick={() => {
            onNew();
            onClose();
          }}
        >
          + New conversation
        </button>
        <ChatList
          {...list}
          onOpen={(id) => {
            list.onOpen(id);
            onClose();
          }}
        />
      </div>
    </div>
  );
}

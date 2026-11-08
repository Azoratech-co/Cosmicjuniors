"use client";

import { LogoTile } from "./CosmoLogo";
import Explorer from "./Explorer";
import ThemePicker from "./ThemePicker";
import { ChatList } from "./ChatsPanel";
import type { SavedChat } from "@/lib/chats";

// Desktop-only sidebar: new chat, recent topics, and the Explorer Level card.


export default function Sidebar({
  chats,
  currentId,
  onNew,
  onOpen,
  onDelete,
  onSeeAll,
}: {
  chats: SavedChat[];
  currentId: string | null;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onSeeAll: () => void;
}) {

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <LogoTile size={40} />
        <span className="hero__eyebrow hero__eyebrow--sm">Cosmic Juniors</span>
      </div>
      <button className="btn-purple t-label" onClick={onNew}>
        +&nbsp; New conversation
      </button>

      <nav className="history" aria-label="Conversations">
        <span className="history__head">
          <span className="t-caption c-muted">Conversations</span>
          {chats.length > 6 && (
            <button className="history__all" onClick={onSeeAll}>
              See all
            </button>
          )}
        </span>
        <ChatList chats={chats} currentId={currentId} onOpen={onOpen} onDelete={onDelete} limit={6} />
      </nav>

      <Explorer />
      <p className="sidebar__foot">NASA Space Apps 2026 · Photos: NASA</p>
      <ThemePicker />
    </aside>
  );
}

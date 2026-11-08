import type { ChatMessage, Source } from "./types";

// Saved conversations, kept in this browser only (no accounts, nothing sent anywhere).

export interface SavedChat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const KEY = "cj-chats";
const MAX_CHATS = 30;
const MAX_MESSAGES = 40;

export function loadChats(): SavedChat[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list.filter((c) => c && c.id && Array.isArray(c.messages)) : [];
  } catch {
    return [];
  }
}

export function saveChats(chats: SavedChat[]) {
  const trimmed = [...chats]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CHATS)
    .map((c) => ({ ...c, messages: c.messages.slice(-MAX_MESSAGES) }));
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {}
  return trimmed;
}

const LEAD = /^(please\s+)?(tell me (about|the story of|your story,?)|can you tell me|what (is|are|was|were|did|does|do|happened to)|where (is|are|was|were|did)|why (is|are|was|were|did|do|does)|how (did|does|do|is|are|was|far|big|many|much|long)|who (is|was|were)|when (did|was|is)|which|is there|are there|did|does|do|is|are|was|were|can|could)\s+/i;
const SMALL = new Set(["a", "an", "the", "of", "on", "in", "to", "and", "for", "at", "by", "with"]);

/** Fallback name when the AI didn't give one: the card's topic, or the question's key words. */
export function fallbackTitle(question: string, source?: Source): string {
  const fromSource = source?.heading ?? source?.title;
  if (fromSource && fromSource.length <= 34) return fromSource;
  const core = question.replace(/[?!.]+$/g, "").replace(LEAD, "").replace(/^(the|a|an)\s+/i, "").trim();
  const words = core.split(/\s+/).filter(Boolean).slice(0, 5);
  if (!words.length) return "Space chat";
  return words
    .map((w, i) => (i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/** "Today", "Yesterday", "Mon", or "Nov 3". */
export function when(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

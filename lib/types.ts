// Shared types between the chat UI and the /api/chat endpoint.

export type Role = "user" | "bot";

/** Who published a source: NASA, a trusted partner (.org), or official U.S. law. */
export type SourceKind = "nasa" | "partner" | "law" | "story";

/** One page an answer used, listed under it as a numbered reference. */
export interface Reference {
  id: string;
  title: string;
  publisher: string;
  url: string;
  kind: SourceKind;
}

/** The main page an answer is based on, shown as a source card. */
export interface Source extends Reference {
  /** What the card is about (e.g. "Sojourner rover"); the source page title stays in `title`. */
  heading?: string;
  /** One extra fact from that page. */
  fact: string;
  image?: { src: string; alt: string; credit: string; nasaId: string };
  /** For machines left on the Moon or Mars: where they are today. */
  whereNow?: { place: string; status: string };
}

/** "guide": Cosmo explains. "story": the machine tells its own story. */
export type ChatMode = "guide" | "story";

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  source?: Source;
  references?: Reference[];
  /** True when every number in the answer was found in its sources. */
  checked?: boolean;
  story?: boolean;
  /** Time the message was created (ms since epoch). */
  at: number;
}

/** POST /api/chat request body. */
export interface ChatRequest {
  messages: { role: Role; text: string }[];
  mode?: ChatMode;
}

/** POST /api/chat response body. */
export interface ChatReply {
  text: string;
  source?: Source;
  /** Every page the answer used, most important first. */
  references?: Reference[];
  /** True when every number in the answer was found in its sources. */
  checked?: boolean;
  story?: boolean;
  /** A short name for the conversation's topic (used to name saved chats). */
  title?: string;
  /** The AI was busy; the app may quietly ask again in a few seconds. */
  busy?: boolean;
  /** Follow-up questions shown as buttons. */
  suggestions?: string[];
}

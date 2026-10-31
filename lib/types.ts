// Shared types between the chat UI and the /api/chat endpoint.

export type Role = "user" | "bot";

/** The NASA page an answer is based on, shown as a source card. */
export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** One extra fact from that page. */
  fact: string;
  image?: { src: string; alt: string; credit: string; nasaId: string };
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  source?: Source;
  /** Time the message was created (ms since epoch). */
  at: number;
}

/** POST /api/chat request body. */
export interface ChatRequest {
  messages: { role: Role; text: string }[];
}

/** POST /api/chat response body. */
export interface ChatReply {
  text: string;
  source?: Source;
  /** Follow-up questions shown as buttons. */
  suggestions?: string[];
}

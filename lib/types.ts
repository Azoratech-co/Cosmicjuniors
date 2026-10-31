// Shared types between the chat UI and the /api/chat endpoint.
// The API team can swap the mock brain for a real AI model as long as
// it keeps returning a `ChatReply`.

export type Role = "user" | "bot";

/** Which illustration to show on a fact card. */
export type CardImage = "mars" | "saturn" | "moon" | "sun" | "earth" | "rocket" | "blackhole";

export interface FactCard {
  title: string;
  body: string;
  image: CardImage;
  /** Optional link button, e.g. to a NASA page. */
  button?: { label: string; href: string };
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  card?: FactCard;
}

/** POST /api/chat request body. */
export interface ChatRequest {
  messages: Pick<ChatMessage, "role" | "text">[];
}

/** POST /api/chat response body. */
export interface ChatReply {
  text: string;
  card?: FactCard;
  /** Follow-up questions shown as tappable chips. */
  suggestions?: string[];
}

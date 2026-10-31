import "server-only";
import { groqChat } from "./groq";
import { LIMITS, MODELS } from "./config";
import type { ChatReply } from "../types";

// Kid-safety layers, cheapest first:
//   1. screenQuestion: instant pattern checks in our own code (no AI, no cost).
//   2. isTrickAttempt: Prompt Guard model spots attempts to break Cosmo's rules.
//   3. The chat model labels each question with a "safety" field (see prompt.ts).
//   4. screenAnswer: a word filter on Cosmo's reply before it is shown.

export type SafetyCategory = "ok" | "self_harm" | "personal_info" | "unsafe" | "trick";

const SELF_HARM = [
  /\b(kill|hurt|cut|harm)\s+(myself|me)\b/i,
  /\b(want|wanna|going)\s+to\s+die\b/i,
  /\bsuicid/i,
  /\bend\s+my\s+life\b/i,
  /\b(nobody|no\s+one)\s+(loves|cares\s+about)\s+me\b/i,
  /\bsomeone\s+(is\s+)?(hurting|hitting|touching)\s+me\b/i,
];

const PERSONAL_INFO = [
  /[\w.+-]+@[\w-]+\.[\w.]+/, // email
  // 8+ digits (with spaces/dashes) that are not a science number like "150000000 km"
  /(?<![\w.,])\+?\d(?:[\s-]?\d){7,}(?![\s-]?\d)(?!\s*(km|kilomet|mile|mi\b|year|light|degree|°|kg|ton|people|star|planet|moon|time|meter|m\b))/i,
  /\b\d{1,5}\s+[a-z]+(\s[a-z]+)?\s+(street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd)\b/i,
  /\b(my\s+(home\s+)?address|i\s+live\s+at|my\s+phone\s+(number|is)|my\s+password)\b/i,
];

const UNSAFE_WORDS =
  /\b(sex|sexy|porn|nude|naked|kill\s+(him|her|them|you)|gun|shoot|drugs?|weed|cocaine|alcohol|beer|vodka|fuck|shit|bitch)\b/i;

/** Instant checks on the kid's question. */
export function screenQuestion(text: string): SafetyCategory {
  if (SELF_HARM.some((r) => r.test(text))) return "self_harm";
  if (PERSONAL_INFO.some((r) => r.test(text))) return "personal_info";
  return "ok";
}

/** Last check on Cosmo's own answer before a kid sees it. */
export function screenAnswer(reply: ChatReply): boolean {
  const all = [reply.text, ...(reply.suggestions ?? [])].join(" ");
  return !UNSAFE_WORDS.test(all) && !/https?:\/\//i.test(all);
}

/** Prompt Guard returns a 0–1 score of how likely a message is a jailbreak attempt. */
export async function isTrickAttempt(content: string): Promise<boolean> {
  const raw = await groqChat({ model: MODELS.promptGuard, messages: [{ role: "user", content }] }, LIMITS.timeoutMs);
  const score = Number.parseFloat(raw);
  return Number.isFinite(score) && score >= LIMITS.jailbreakThreshold;
}

/** Gentle, pre-written replies used when a check blocks a message. */
export const SAFE_REPLIES: Record<Exclude<SafetyCategory, "ok">, ChatReply> = {
  self_harm: {
    text: "I'm really glad you told me. What you're feeling matters, and you deserve help from a real person. Please talk to a parent, a teacher, or another grown-up you trust, today. You're not alone.",
    suggestions: ["Tell me something calm about space", "What does Earth look like from space?"],
  },
  personal_info: {
    text: "Let's keep things like your address, school, phone number or email private, even from me. You never need to share them here. What would you like to explore instead?",
    suggestions: ["What did the first Mars rover do?", "How far away is the Moon?"],
  },
  unsafe: {
    text: "That's not something I can help with. I'm here for space, science and exploration. Want to try one of these?",
    suggestions: ["What is a black hole?", "Why does Saturn have rings?", "Who flew on Artemis II?"],
  },
  trick: {
    text: "I'll stick to my usual rules, but I'm happy to keep exploring with you. What would you like to know about space?",
    suggestions: ["What did the first Mars rover do?", "What has Webb discovered?"],
  },
};

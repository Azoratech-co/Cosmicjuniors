import "server-only";
import { GroqError, groqChat, hasGroqKey } from "./groq";
import { LIMITS, MODELS } from "./config";
import { SYSTEM_PROMPT } from "./prompt";
import { CARD_IMAGES, CARD_LINKS } from "./links";
import { SAFE_REPLIES, isTrickAttempt, screenAnswer, screenQuestion, type SafetyCategory } from "./safety";
import { mockReply } from "../mockBrain";
import type { CardImage, ChatReply, ChatRequest } from "../types";

// Cosmo's brain: safety checks + the Groq model, returning a ChatReply.
//
// Flow for every question:
//   1. Instant pattern check in our own code. Blocked → gentle pre-written reply, no AI call.
//   2. Trick check (Prompt Guard) runs at the same time as the answer is written (faster).
//   3. The model labels the question's safety itself; anything not "ok" gets a pre-written reply.
//   4. The answer goes through a word filter before the kid sees it.
//   5. If anything goes wrong (no key, Groq busy or down, bad output), use the canned answers.

type History = ChatRequest["messages"];

export async function askCosmo(history: History): Promise<ChatReply> {
  const question = history[history.length - 1].text;

  const quick = screenQuestion(question);
  if (quick !== "ok") return SAFE_REPLIES[quick];

  if (!hasGroqKey()) return mockReply(question);

  try {
    const [trick, draft] = await Promise.all([isTrickAttempt(question), writeAnswer(history)]);
    if (trick) return SAFE_REPLIES.trick;
    if (draft.safety !== "ok") return SAFE_REPLIES[draft.safety];
    if (!screenAnswer(draft.reply)) return SAFE_REPLIES.unsafe;
    return draft.reply;
  } catch (err) {
    // Log only the error, never the kid's message.
    console.error("Cosmo brain error:", err instanceof Error ? err.message : err);
    return mockReply(question);
  }
}

async function writeAnswer(history: History): Promise<{ safety: SafetyCategory; reply: ChatReply }> {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text })),
  ];

  // Try each model in order; move to the next one only if Groq says it's busy (429).
  let lastError: unknown;
  for (const model of MODELS.chat) {
    try {
      const raw = await groqChat(
        {
          model,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.8,
          reasoning_effort: "low",
          max_completion_tokens: 1000,
        },
        LIMITS.timeoutMs,
      );
      return parseAnswer(JSON.parse(raw));
    } catch (err) {
      lastError = err;
      if (!(err instanceof GroqError && err.status === 429)) throw err;
    }
  }
  throw lastError;
}

/** Never trust model output blindly: keep only the expected fields, with size limits. */
function parseAnswer(data: unknown): { safety: SafetyCategory; reply: ChatReply } {
  const d = (data ?? {}) as Record<string, unknown>;

  // Anything other than an explicit "ok" is treated as not safe.
  const safety: SafetyCategory =
    d.safety === "ok" ? "ok" : d.safety === "self_harm" || d.safety === "personal_info" ? d.safety : "unsafe";

  const text = typeof d.text === "string" ? d.text.trim().slice(0, 600) : "";
  if (!text) throw new Error("Model returned no text");
  const reply: ChatReply = { text };

  const c = d.card as Record<string, unknown> | null | undefined;
  if (c && typeof c.title === "string" && typeof c.body === "string" && CARD_IMAGES.includes(c.image as CardImage)) {
    const image = c.image as CardImage;
    reply.card = { title: c.title.slice(0, 60), body: c.body.slice(0, 240), image, button: CARD_LINKS[image] };
  }

  if (Array.isArray(d.suggestions)) {
    reply.suggestions = d.suggestions
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim().slice(0, 40))
      .slice(0, 3);
  }
  return { safety, reply };
}

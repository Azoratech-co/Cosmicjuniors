import "server-only";
import { GroqError, groqChat, hasGroqKey } from "./groq";
import { LIMITS, MODELS } from "./config";
import { buildSystemPrompt } from "./prompt";
import { findTopics, getTopic, type Topic } from "./knowledge";
import { toSource } from "./sources";
import { SAFE_REPLIES, isTrickAttempt, screenAnswer, screenQuestion, type SafetyCategory } from "./safety";
import { mockReply } from "../mockBrain";
import type { ChatReply, ChatRequest } from "../types";

// Cosmo's brain: safety checks + verified NASA notes + the Groq model.
//
// Flow for every question:
//   1. Instant pattern check in our own code. Blocked → careful pre-written reply, no AI call.
//   2. Find the NASA reference notes that match the question (lib/cosmo/knowledge.ts).
//   3. Trick check (Prompt Guard) runs at the same time as the answer is written.
//   4. The model labels the question's safety itself; anything not "ok" gets a pre-written reply.
//   5. The answer goes through a word filter, then gets its NASA source card attached.
//   6. If anything goes wrong (no key, Groq busy or down, bad output), answer from the notes directly.

type History = ChatRequest["messages"];

export async function askCosmo(history: History): Promise<ChatReply> {
  const question = history[history.length - 1].text;

  const quick = screenQuestion(question);
  if (quick !== "ok") return SAFE_REPLIES[quick];

  if (!hasGroqKey()) return mockReply(question);

  const context = history.slice(-5, -1).map((m) => m.text).join(" ");
  const topics = findTopics(question, context);

  try {
    const [trick, draft] = await Promise.all([isTrickAttempt(question), writeAnswer(history, topics)]);
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

async function writeAnswer(history: History, topics: Topic[]) {
  const messages = [
    { role: "system", content: buildSystemPrompt(topics) },
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
          temperature: 0.4,
          reasoning_effort: "low",
          max_completion_tokens: 1000,
        },
        LIMITS.timeoutMs,
      );
      return parseAnswer(JSON.parse(raw), topics);
    } catch (err) {
      lastError = err;
      if (!(err instanceof GroqError && err.status === 429)) throw err;
    }
  }
  throw lastError;
}

/** Never trust model output blindly: keep only the expected fields, with size limits. */
function parseAnswer(data: unknown, topics: Topic[]): { safety: SafetyCategory; reply: ChatReply } {
  const d = (data ?? {}) as Record<string, unknown>;

  // Anything other than an explicit "ok" is treated as not safe.
  const safety: SafetyCategory =
    d.safety === "ok" ? "ok" : d.safety === "self_harm" || d.safety === "personal_info" ? d.safety : "unsafe";

  const text = typeof d.text === "string" ? tidy(d.text).slice(0, 700) : "";
  if (!text) throw new Error("Model returned no text");
  const reply: ChatReply = { text };

  // Only accept a source that was actually given to the model for this question.
  const topic = typeof d.source === "string" && topics.some((t) => t.id === d.source) ? getTopic(d.source) : undefined;
  if (topic) reply.source = toSource(topic, typeof d.fact === "number" ? d.fact : null, text);

  if (Array.isArray(d.suggestions)) {
    reply.suggestions = d.suggestions
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => tidy(s).slice(0, 48))
      .slice(0, 3);
  }
  return { safety, reply };
}

/** Replace unusual spaces and hyphens some models emit, which many fonts can't draw. */
function tidy(s: string): string {
  return s
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[\u2010\u2011]/g, "-")
    .trim();
}

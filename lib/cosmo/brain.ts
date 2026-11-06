import "server-only";
import { GroqError, groqChat, hasGroqKey } from "./groq";
import { LIMITS, MODELS } from "./config";
import { buildSystemPrompt } from "./prompt";
import { findTopics, getTopic, type Topic } from "./knowledge";
import { toReference, toSource, unsupportedClaims, unsupportedNumbers, usedTopics } from "./sources";
import { SAFE_REPLIES, isTrickAttempt, screenAnswer, screenQuestion, type SafetyCategory } from "./safety";
import { mockReply } from "../mockBrain";
import type { ChatMode, ChatReply, ChatRequest } from "../types";

// Cosmo's brain: safety checks + verified NASA notes + the Groq model.
//
// Flow for every question:
//   1. Instant pattern check in our own code. Blocked → careful pre-written reply, no AI call.
//   2. Find the NASA reference notes that match the question (lib/cosmo/knowledge.ts).
//   3. Trick check (Prompt Guard) runs at the same time as the answer is written.
//   4. The model labels the question's safety itself; anything not "ok" gets a pre-written reply.
//   5. Fact-check: every number in the answer must appear in the notes. If not, Cosmo rewrites it
//      once; if it still fails, the answer is replaced by one built straight from the notes.
//   6. The answer goes through a word filter, then gets its source card and numbered references.
//   7. If anything goes wrong (no key, Groq busy or down, bad output), answer from the notes directly.

type History = ChatRequest["messages"];

export async function askCosmo(history: History, mode: ChatMode = "guide"): Promise<ChatReply> {
  const question = history[history.length - 1].text;

  const quick = screenQuestion(question);
  if (quick !== "ok") return SAFE_REPLIES[quick];

  if (!hasGroqKey()) return mockReply(question);

  // For follow-ups, the last exchange (kid's previous question + Cosmo's reply) says what "it" means.
  const context = history.slice(-3, -1).map((m) => m.text).join(" ");
  const topics = findTopics(question, context);
  const kidText = history.filter((m) => m.role === "user").map((m) => m.text).join(" ");

  try {
    const [trick, first] = await Promise.all([isTrickAttempt(question), writeAnswer(history, topics, mode)]);
    if (trick) return SAFE_REPLIES.trick;
    let draft = first;
    if (draft.safety !== "ok") return SAFE_REPLIES[draft.safety];

    // Fact-check numbers and "the first / the largest" claims; give Cosmo one chance to fix them.
    const problems = (text: string) => [
      ...unsupportedNumbers(text, topics, kidText).map((n) => `the number ${n}`),
      // With no notes (general questions like "why is the sky blue?") there is nothing to check claims against.
      ...(topics.length ? unsupportedClaims(text, topics) : []).map((c) => `the claim "${c}"`),
    ];
    let bad = problems(draft.reply.text);
    if (bad.length) {
      draft = await writeAnswer(history, topics, mode, bad);
      bad = problems(draft.reply.text);
      if (draft.safety !== "ok") return SAFE_REPLIES[draft.safety];
    }
    if (bad.length) {
      console.warn("Cosmo fact-check failed twice; answering from the notes.");
      return mockReply(question);
    }
    if (!screenAnswer(draft.reply)) return SAFE_REPLIES.unsafe;
    draft.reply.checked = Boolean(draft.reply.references?.length);
    if (mode === "story") draft.reply.story = true;
    return draft.reply;
  } catch (err) {
    // Log only the error, never the kid's message.
    console.error("Cosmo brain error:", err instanceof Error ? err.message : err);
    return mockReply(question);
  }
}

async function writeAnswer(history: History, topics: Topic[], mode: ChatMode, badNumbers: string[] = []) {
  const messages = [
    { role: "system", content: buildSystemPrompt(topics, mode) },
    ...history.map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text })),
  ];
  if (badNumbers.length) {
    messages.push({
      role: "system",
      content: `FACT-CHECK FAILED. Your answer used ${badNumbers.join(", ")}, which the REFERENCE NOTES do not support exactly. Write the answer again. Use only numbers that appear in the notes, and copy any "first", "largest" or "only" claim exactly as the notes word it, including words like "America's", "U.S." or "successful". Or leave the claim out.`,
    });
  }

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

  // Only accept sources that were actually given to the model for this question.
  const ids = (Array.isArray(d.sources) ? d.sources : typeof d.source === "string" ? [d.source] : []).filter(
    (id, i, all): id is string => typeof id === "string" && topics.some((t) => t.id === id) && all.indexOf(id) === i,
  );
  const used = usedTopics(text, topics, ids.map((id) => getTopic(id)!)).slice(0, 4);
  if (used.length) {
    reply.source = toSource(used[0], typeof d.fact === "number" ? d.fact : null, text);
    reply.references = used.map(toReference);
  }

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

import "server-only";
import { GroqError, availableModels, groqChat, hasGroqKey } from "./groq";
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

// Opening questions (like the starter buttons) are asked by almost every visitor. Remember good
// answers for 10 minutes so they don't use up the AI's per-minute limit. Only answers with no
// earlier conversation are cached, and nothing personal: just the question text and Cosmo's reply.
const CACHE_MS = 10 * 60_000;
const firstAnswers = new Map<string, { at: number; reply: ChatReply }>();
/** Replies written by the AI that passed every check (offline fallbacks are never cached). */
const fullAnswers = new WeakSet<ChatReply>();

export async function askCosmo(history: History, mode: ChatMode = "guide"): Promise<ChatReply> {
  const question = history[history.length - 1].text;
  const cacheKey = history.length === 1 ? `${mode}:${question.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()}` : "";
  const hit = cacheKey ? firstAnswers.get(cacheKey) : undefined;
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.reply;
  const reply = await answer(history, question, mode);
  // Cache only full AI answers that passed every check.
  if (cacheKey && fullAnswers.has(reply)) {
    if (firstAnswers.size > 200) firstAnswers.clear();
    firstAnswers.set(cacheKey, { at: Date.now(), reply });
  }
  return reply;
}

async function answer(history: History, question: string, mode: ChatMode): Promise<ChatReply> {

  const quick = screenQuestion(question);
  if (quick !== "ok") return SAFE_REPLIES[quick];

  if (!hasGroqKey()) return mockReply(question);

  // For follow-ups, the kid's previous question says what "it" means. (Not Cosmo's reply: a long
  // answer mentions many things and could pull the next question back to the same topic.)
  const context = history.slice(0, -1).filter((m) => m.role === "user").slice(-1).map((m) => m.text).join(" ");
  const topics = findTopics(question, context);
  const kidText = history.filter((m) => m.role === "user").map((m) => m.text).join(" ");

  try {
    // If the trick check itself is busy, carry on: the regex screen, the model's own safety label
    // and the answer filter still protect the kid.
    const guard = isTrickAttempt(question).catch((e) => {
      console.warn("Prompt Guard unavailable:", e instanceof Error ? e.message : e);
      return false;
    });
    const [trick, first] = await Promise.all([guard, writeAnswer(history, topics, mode)]);
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
    fullAnswers.add(draft.reply);
    if (mode === "story") draft.reply.story = true;
    return draft.reply;
  } catch (err) {
    // Log only the error, never the kid's message.
    console.error("Cosmo brain error:", err instanceof Error ? err.message : err);
    return mockReply(question, true);
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

  // Try each model in order. Move on if Groq is busy (429). If the model's reply wasn't valid JSON
  // (Groq answers 400 "json_validate_failed"), ask again without strict JSON mode and read the
  // JSON object out of the reply ourselves.
  let lastError: unknown;
  const tried: string[] = [];
  const models = await chatModels();
  for (const model of models) {
    for (const strict of [true, false]) {
      try {
        const raw = await withShortWait(() => groqChat(
          {
            model,
            messages,
            ...(strict ? { response_format: { type: "json_object" } } : {}),
            temperature: 0.4,
            // Only reasoning models accept this setting.
            ...(model.includes("gpt-oss") ? { reasoning_effort: "low" } : {}),
            // Groq counts this whole budget against the per-minute limit, so keep it tight.
            max_completion_tokens: 600,
          },
          LIMITS.timeoutMs,
        ));
        return parseAnswer(readJson(raw), topics);
      } catch (err) {
        lastError = err;
        tried.push(`${model}${strict ? "" : " (loose)"}: ${err instanceof GroqError ? `${err.status} ${err.code}` : err instanceof Error ? err.name : "error"}`);
        const badJson = (err instanceof GroqError && err.status === 400) || err instanceof SyntaxError;
        if (strict && badJson) continue; // retry this model without strict JSON
        // Busy (429), retired or unknown model (400/404), server trouble (5xx), bad JSON: next model.
        // Only a bad API key (401/403) stops here.
        if (err instanceof GroqError && (err.status === 401 || err.status === 403)) throw err;
        break;
      }
    }
  }
  // One log line that shows what every model said (never the kid's message).
  throw new Error(`All models failed. ${tried.join(" | ") || String(lastError)}`);
}

/** If Groq says "busy, try again in a moment" (up to 4 s), wait once and retry. */
async function withShortWait<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (err) {
    if (err instanceof GroqError && err.status === 429 && err.retryAfter > 0 && err.retryAfter <= 4) {
      await new Promise((r) => setTimeout(r, err.retryAfter * 1000));
      return call();
    }
    throw err;
  }
}

/** Preferred models that exist right now, then any other good chat model on the account. */
async function chatModels(): Promise<string[]> {
  const live = await availableModels();
  if (!live.length) return [...MODELS.chat]; // couldn't ask Groq: try the list as written
  const preferred: string[] = MODELS.chat.filter((m) => live.includes(m));
  const extra = live.filter((m) => !preferred.includes(m) && MODELS.chatFamilies.test(m) && !MODELS.notChat.test(m));
  return [...preferred, ...extra].slice(0, 6);
}

/** Parse the model's reply, tolerating extra text around the JSON object. */
function readJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) throw new SyntaxError("No JSON object in reply");
    return JSON.parse(raw.slice(start, end + 1));
  }
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

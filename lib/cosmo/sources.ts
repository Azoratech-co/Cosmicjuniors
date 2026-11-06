import type { Topic } from "./knowledge";
import type { Reference, Source } from "../types";

const words = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9]+/g) ?? []);

/** How much of a fact the answer already says (0 = nothing new is repeated, 1 = all of it). */
function overlap(fact: string, answer: Set<string>) {
  const w = [...words(fact)].filter((x) => x.length > 3);
  return w.length ? w.filter((x) => answer.has(x)).length / w.length : 1;
}

export function toReference(topic: Topic): Reference {
  return { id: topic.id, title: topic.title, publisher: topic.publisher, url: topic.url, kind: topic.kind ?? "nasa" };
}

/** Turn a knowledge-base topic into the source card shown under an answer. */
export function toSource(topic: Topic, factIndex: number | null, answer: string): Source {
  const said = words(answer);
  // Prefer the fact the model picked, unless the answer already covers most of it.
  let i = typeof factIndex === "number" && topic.facts[factIndex] && overlap(topic.facts[factIndex], said) < 0.5 ? factIndex : -1;
  if (i < 0) {
    const scores = topic.facts.map((f) => overlap(f, said));
    i = scores.indexOf(Math.min(...scores));
  }
  return { ...toReference(topic), fact: topic.facts[i], image: topic.image, whereNow: topic.whereNow };
}

// ---------------------------------------------------------------------------------------------
// Fact-check: every number Cosmo writes must appear in the notes it was given (or in the kid's
// own messages). This catches the most common AI mistake, a wrong or made-up number or date.
// ---------------------------------------------------------------------------------------------

const numbers = (s: string) => (s.match(/\d+(?:[.,]\d+)*/g) ?? []).map((n) => n.replace(/,/g, "").replace(/\.$/, ""));

/** Numbers in `answer` that no note (or the kid) mentioned. Empty means the answer passed. */
export function unsupportedNumbers(answer: string, topics: Topic[], kidText = ""): string[] {
  const allowed = new Set(numbers([kidText, ...topics.flatMap((t) => [t.title, ...t.facts, t.whereNow?.status ?? "", t.whereNow?.place ?? ""])].join(" ")));
  return [...new Set(numbers(answer))].filter((n) => !allowed.has(n));
}

/**
 * Which notes the answer actually drew on: the ones the model listed, plus any note whose fact
 * the answer clearly repeats (most of its words) or whose number only that note contains.
 */
export function usedTopics(answer: string, topics: Topic[], listed: Topic[]): Topic[] {
  const said = words(answer);
  const nums = new Set(numbers(answer));
  const uniqueNum = (t: Topic) =>
    numbers(t.facts.join(" ")).some((n) => n.length > 1 && nums.has(n) && !topics.some((o) => o !== t && numbers(o.facts.join(" ")).includes(n)));
  const repeats = (t: Topic) =>
    t.facts.some((f) => {
      const w = [...words(f)].filter((x) => x.length > 3);
      return w.length >= 3 && w.filter((x) => said.has(x)).length / w.length >= 0.6;
    });
  // A distinctive word (7+ letters) that only this note uses, like "airbags".
  const vocab = (t: Topic) => new Set([...words(t.facts.join(" "))].filter((x) => x.length >= 7));
  const uniqueWord = (t: Topic) =>
    [...vocab(t)].some((w) => said.has(w) && !topics.some((o) => o !== t && vocab(o).has(w)));
  const extra = topics.filter((t) => !listed.includes(t) && (uniqueNum(t) || repeats(t) || uniqueWord(t)));
  // Drop any listed note the answer doesn't actually draw on (no shared facts, names or numbers).
  const relevant = (t: Topic) => {
    if (uniqueNum(t) || repeats(t) || uniqueWord(t)) return true;
    const vocab = new Set([...words([t.title, ...t.facts, ...t.keywords].join(" "))].filter((x) => x.length > 4));
    return [...said].filter((w) => w.length > 4 && vocab.has(w)).length >= 3;
  };
  return [...listed.filter(relevant), ...extra];
}

// ---------------------------------------------------------------------------------------------
// Claim check: "the first ...", "the largest ...", "the only ..." must be in the notes, and keep
// any qualifier the notes use ("America's first woman in space" is not "the first woman in space").
// ---------------------------------------------------------------------------------------------

const SUPERLATIVE = /\b(?:the|was|became|is)\s+(first|last|largest|biggest|smallest|only|longest|farthest|furthest|fastest|highest|tallest|deepest|hottest|coldest|oldest|most)\s+([a-z.'-]+(?:\s+[a-z.'-]+)?)/gi;
const QUALIFIERS = ["america's", "american", "us", "successful", "nasa's", "powered"];

const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/\bu\.s\.?/g, "us")
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Superlative claims in `answer` that the notes don't support. Empty means the answer passed. */
export function unsupportedClaims(answer: string, topics: Topic[]): string[] {
  const notes = tokens(topics.flatMap((t) => t.facts).join(" "));
  const said = tokens(answer);
  const bad: string[] = [];
  for (const m of answer.matchAll(SUPERLATIVE)) {
    const claim = tokens(`${m[1]} ${m[2]}`);
    // Every place the notes make this claim, and the two words right before it there.
    const before: string[][] = [];
    for (let i = 0; i + claim.length <= notes.length; i++) {
      if (claim.every((w, j) => notes[i + j] === w)) before.push(notes.slice(Math.max(0, i - 2), i));
    }
    if (!before.length) {
      bad.push(m[0].trim());
      continue;
    }
    // If every note phrasing is qualified, the answer must keep a qualifier too.
    const qualified = before.every((b) => b.some((w) => QUALIFIERS.includes(w)));
    if (qualified) {
      const at = said.findIndex((w, i) => claim.every((c, j) => said[i + j] === c));
      const answerBefore = at >= 0 ? said.slice(Math.max(0, at - 3), at) : [];
      if (!answerBefore.some((w) => QUALIFIERS.includes(w))) bad.push(m[0].trim());
    }
  }
  return [...new Set(bad)];
}

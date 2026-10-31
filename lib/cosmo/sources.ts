import type { Topic } from "./knowledge";
import type { Source } from "../types";

const words = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9]+/g) ?? []);

/** How much of a fact the answer already says (0 = nothing new is repeated, 1 = all of it). */
function overlap(fact: string, answer: Set<string>) {
  const w = [...words(fact)].filter((x) => x.length > 3);
  return w.length ? w.filter((x) => answer.has(x)).length / w.length : 1;
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
  return {
    id: topic.id,
    title: topic.title,
    publisher: topic.publisher,
    url: topic.url,
    fact: topic.facts[i],
    image: topic.image,
  };
}

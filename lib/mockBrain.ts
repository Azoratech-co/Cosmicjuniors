import { findTopics } from "./cosmo/knowledge";
import { toReference, toSource } from "./cosmo/sources";
import type { ChatReply } from "./types";
import { CREATOR } from "./cosmo/config";

// Offline answers built straight from the verified NASA notes. Used when there is no
// API key, or when the AI service is busy or down, so the app always works.

const NEXT: Record<string, string[]> = {
  pathfinder: ["How big was Sojourner?", "Which rovers came after it?"],
  viking: ["What did Viking's first photo show?", "Did Viking find life?"],
  spirit: ["How did Spirit get stuck?", "What did Spirit discover?"],
  opportunity: ["How far did Opportunity drive?", "What ended its mission?"],
  insight: ["What is a marsquake?", "When did InSight stop?"],
  ingenuity: ["How many times did it fly?", "How high did it fly?"],
  apollo11: ["What does the plaque say?", "Is the Apollo 11 flag still up?"],
  "apollo11-tps": ["Is the Moon moving away?", "Can we see the footprints?"],
  surveyor3: ["Why did they take its camera?", "What did Surveyor 3 do?"],
  flags: ["Why did the Apollo 11 flag fall?", "What color are the flags now?"],
  "fallen-astronaut": ["Who placed the memorial?", "What else did Apollo 15 leave?"],
  grail: ["Why crash on purpose?", "Who was Sally Ride?"],
  lcross: ["Is there water on the Moon?", "Where is Cabeus crater?"],
  "lunar-artifacts": ["Why protect Moon artifacts?", "What is left on Mars?"],
  "space-trash-tps": ["Is it junk or history?", "Who protects the Apollo sites?"],
  "heritage-rules": ["Is there a law about it?", "What did Apollo 11 leave?"],
  "one-small-step": ["Why protect Apollo sites?", "What did Apollo 17 leave?"],
  phoenix: ["What did Phoenix find?", "What is on Mars today?"],
  "mars-missions-tps": ["Why do Mars missions fail?", "What did Viking see first?"],
  "pathfinder-tps": ["How did the airbags work?", "Who was Carl Sagan?"],
  curiosity: ["How big is Curiosity?", "Is Curiosity still working?"],
  "perseverance-debris": ["Why photograph the parachute?", "What did Ingenuity do?"],
  lrv: ["How far did they drive?", "How heavy was the rover?"],
  retroreflector: ["How do the mirrors work?", "Are they still used?"],
  mars: ["How tall is Olympus Mons?", "How long is a day on Mars?"],
  perseverance: ["What did Ingenuity do?", "Has it found signs of life?"],
  moon: ["Why does the Moon have phases?", "Who flew on Artemis II?"],
  artemis: ["When will people land again?", "What is Orion?"],
  saturn: ["What are the rings made of?", "Would Saturn float?"],
  jupiter: ["How big is the Great Red Spot?", "How many moons does it have?"],
  sun: ["How hot is the Sun?", "How old is the Sun?"],
  iss: ["How fast is the space station?", "How long have people lived there?"],
  blackholes: ["Where is the nearest black hole?", "How do black holes form?"],
  webb: ["Where is Webb?", "Why does Webb use infrared?"],
};

const words = (s: string) => new Set((s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 3));

/** Offline answer. `busy` = the AI service was unavailable, so we say so honestly. */
const WHO_MADE = /\bwho\s+(made|built|created|designed|programmed|coded)\s+(you|cosmo)\b|\bwho\s+is\s+your\s+(creator|maker)\b|\byour\s+(creator|maker)\b/i;

export function mockReply(question: string, busy = false): ChatReply {
  if (WHO_MADE.test(question)) {
    return {
      text: `${CREATOR.line} My job is to tell the stories of the machines NASA left on Mars and the Moon.`,
      suggestions: ["Where is Sojourner now?", "What did astronauts leave on the Moon?"],
    };
  }
  const [topic] = findTopics(question);
  // Pick the facts that share the most words with the question, not just the first ones.
  // Ignore the topic's own name ("mars", "sojourner"): every fact in the note shares it.
  const common = topic ? words([topic.title, ...topic.keywords].join(" ")) : new Set<string>();
  const q = new Set([...words(question)].filter((w) => !common.has(w)));
  const ranked = topic
    ? topic.facts
        .map((f, i) => ({ f, i, s: [...words(f)].filter((w) => q.has(w)).length }))
        .sort((a, b) => b.s - a.s || a.i - b.i)
    : [];
  if (busy && (!topic || ranked[0].s === 0)) {
    return {
      text: "Lots of explorers are asking me questions right now, so I need a moment. Please ask that again in a few seconds.",
      suggestions: [question.slice(0, 48)],
      busy: true,
    };
  }
  if (!topic) {
    return {
      text: "I don't have a NASA source for that one yet. I can tell you the stories of the machines NASA left on Mars and the Moon, like Sojourner, Viking, Spirit, Opportunity, Phoenix, Curiosity, Ingenuity, the Apollo landing sites and the spacecraft that crashed into the Moon on purpose.",
      suggestions: ["Where is Sojourner now?", "How far did Opportunity drive?", "What did Apollo leave on the Moon?"],
    };
  }
  const lead = busy ? "I'm a bit busy right now, but here's what my NASA notes say: " : "";
  // When busy, show only facts that match the question; otherwise the note's opening facts.
  const picked = busy ? ranked.filter((x) => x.s > 0).slice(0, 2) : ranked.slice(0, 2);
  const text = lead + picked.sort((a, b) => a.i - b.i).map((x) => x.f).join(" ");
  // Built word for word from the notes, so every number is checked by definition.
  return { text, source: toSource(topic, 2, text), references: [toReference(topic)], checked: true, suggestions: NEXT[topic.id], ...(busy ? { busy: true } : {}) };
}

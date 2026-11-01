import { findTopics } from "./cosmo/knowledge";
import { toSource } from "./cosmo/sources";
import type { ChatReply } from "./types";

// Offline answers built straight from the verified NASA notes. Used when there is no
// API key, or when the AI service is busy or down, so the app always works.

const NEXT: Record<string, string[]> = {
  pathfinder: ["How big was Sojourner?", "Which rovers came after it?"],
  viking: ["What did Viking's first photo show?", "Did Viking find life?"],
  spirit: ["How did Spirit get stuck?", "What did Spirit discover?"],
  opportunity: ["How far did Opportunity drive?", "What ended its mission?"],
  insight: ["What is a marsquake?", "When did InSight stop?"],
  ingenuity: ["How many times did it fly?", "How high did it fly?"],
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

export function mockReply(question: string): ChatReply {
  const [topic] = findTopics(question);
  if (!topic) {
    return {
      text: "I don't have a NASA source for that one yet. I can tell you the stories of the machines NASA left on Mars and the Moon, like Sojourner, Viking, Spirit, Opportunity, InSight, Ingenuity and the Apollo moon rovers.",
      suggestions: ["Where is Sojourner now?", "How far did Opportunity drive?", "What did Apollo leave on the Moon?"],
    };
  }
  const text = topic.facts.slice(0, 2).join(" ");
  return { text, source: toSource(topic, 2, text), suggestions: NEXT[topic.id] };
}

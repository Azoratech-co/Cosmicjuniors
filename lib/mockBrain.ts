import { findTopics } from "./sojourner/knowledge";
import { toSource } from "./sojourner/sources";
import type { ChatReply } from "./types";

// Offline answers built straight from the verified NASA notes. Used when there is no
// API key, or when the AI service is busy or down, so the app always works.

const NEXT: Record<string, string[]> = {
  pathfinder: ["How big was Sojourner?", "Which rovers came after it?"],
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
      text: "I don't have a NASA source for that one yet. I can tell you about Mars and its rovers, the Moon and Artemis, the planets, the Sun, the space station, black holes or the Webb telescope.",
      suggestions: ["What did the first Mars rover do?", "Who flew on Artemis II?", "Why does Saturn have rings?"],
    };
  }
  const text = topic.facts.slice(0, 2).join(" ");
  return { text, source: toSource(topic, 2, text), suggestions: NEXT[topic.id] };
}

import { getStars } from "./stars";

// Explorer progression, read from what this browser has already saved (no accounts).

export const STARS_PER_LEVEL = 10;
export const PUZZLE_KEY = "cj-puzzle";

export interface Badge {
  id: string;
  name: string;
  hint: string;
  earned: boolean;
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function getProgress() {
  const stars = getStars();
  const level = Math.floor(stars / STARS_PER_LEVEL) + 1;
  const into = stars % STARS_PER_LEVEL;
  const puzzle = read<{ solved?: number }>(PUZZLE_KEY, {});
  const journey = read<{ unlocked?: number; found?: Record<string, number[]> }>("cj-journey", {});
  const landing = read<{ best?: Record<string, number> }>("cj-landing", {});
  const facts = Object.values(journey.found ?? {}).reduce((n, f) => n + f.length, 0);
  const landed = Object.keys(landing.best ?? {}).length;

  const badges: Badge[] = [
    { id: "first", name: "First contact", hint: "Ask Cosmo a question", earned: stars >= 1 },
    { id: "puzzle", name: "Rover rebuilder", hint: "Finish the Sojourner Puzzle", earned: (puzzle.solved ?? 0) > 0 },
    { id: "mars", name: "Reached Mars", hint: "Finish a Journey to Mars chapter", earned: (journey.unlocked ?? 0) >= 1 },
    { id: "facts", name: "Data collector", hint: "Catch 5 data capsules", earned: facts >= 5 },
    { id: "landing", name: "Safe landing", hint: "Complete a Mars Landing mission", earned: landed >= 1 },
    { id: "stars", name: "Star captain", hint: "Collect 50 stars", earned: stars >= 50 },
  ];
  return { stars, level, into, toNext: STARS_PER_LEVEL - into, badges };
}

// Stars are the reward kids earn by asking Cosmo questions and winning games.
// They are kept in this browser only (no accounts yet).

export const STARS_KEY = "cj-stars";
/** Fired on window whenever the star count changes, so every screen stays in sync. */
export const STARS_EVENT = "cj-stars-changed";

export function getStars(): number {
  try {
    return Number(localStorage.getItem(STARS_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function addStars(n: number): number {
  const next = getStars() + n;
  try {
    localStorage.setItem(STARS_KEY, String(next));
  } catch {}
  window.dispatchEvent(new Event(STARS_EVENT));
  return next;
}

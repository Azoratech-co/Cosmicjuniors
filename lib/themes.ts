// All live designs. Each id matches a block in app/themes.css. Ink & Sand is the main design.
export const THEMES = [
  { id: "ink-sand", name: "Ink & Sand", note: "Sand paper, midnight-navy ink, terracotta. Editorial and confident.", swatch: ["#e8dcc8", "#1e2633", "#c0674a", "#f3ebdd"] },
  { id: "juniors", name: "Juniors", note: "The team's Figma design: deep navy, plum cards, pink accents, playful titles.", swatch: ["#06152f", "#172944", "#812d51", "#6ab7ff"] },
  { id: "cosmic", name: "Cosmic", note: "Polished dark navy with cyan and purple. The design brief.", swatch: ["#080d22", "#172045", "#7c5cff", "#5bd4f5"] },
  { id: "beige", name: "Beige", note: "Warm paper with a star-chart dot grid and Mars rust.", swatch: ["#f4efe6", "#1f1b16", "#c2502a", "#fbf8f2"] },
  { id: "mission", name: "Mission control", note: "Flat near-black with one rust accent.", swatch: ["#0e1116", "#1c212a", "#d9542e", "#e6e8eb"] },
  { id: "original", name: "Original", note: "The first purple and cyan Cosmic Juniors look.", swatch: ["#1a1245", "#0b1026", "#7b5cff", "#3dd6f5"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "ink-sand";
export const THEME_KEY = "cj-design";

/** Runs in <head> before the page paints, so there's no flash of the wrong design. */
export const THEME_SCRIPT = `(function(){try{var ids=${JSON.stringify(
  THEMES.map((t) => t.id),
)};var q=new URLSearchParams(location.search).get("theme");var t=null;if(q&&ids.indexOf(q)>-1){t=q;localStorage.setItem("${THEME_KEY}",q)}else{var s=localStorage.getItem("${THEME_KEY}");if(s&&ids.indexOf(s)>-1)t=s}document.documentElement.setAttribute("data-theme",t||"${DEFAULT_THEME}")}catch(e){document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}")}})();`;

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {}
  window.dispatchEvent(new Event("cj-theme-changed"));
}

export function currentTheme(): ThemeId {
  const t = document.documentElement.getAttribute("data-theme");
  return (THEMES.find((x) => x.id === t)?.id ?? DEFAULT_THEME) as ThemeId;
}

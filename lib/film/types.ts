/** One step of a story film. `kind` picks the animated scene; the rest are its settings. */
export interface Scene {
  kind:
    | "title" | "chapter" | "pad" | "inside" | "ascent" | "cruise" | "approach" | "entry" | "parachute"
    | "airbags" | "bounce" | "kenburns" | "transmission" | "signal" | "crawl" | "days" | "silence" | "end";
  chapter: number;
  /** Narration and caption. */
  text: string;
  /** Chapter title (chapter cards). */
  title?: string;
  /** A question for Cosmo about this scene. */
  ask?: string;
  /** Photo scenes. */
  image?: string;
  credit?: string;
  stamp?: string;
  gray?: boolean;
  /** Ken Burns camera: [zoom, x focus 0..1, y focus 0..1] at the start and end. */
  from?: [number, number, number];
  to?: [number, number, number];
  /** Extra effects on photo scenes. */
  glow?: boolean;
  dust?: boolean;
  water?: boolean;
  measure?: boolean;
  listen?: boolean;
  wide?: boolean;
  /** Radio signal scenes. */
  dir?: "toMars" | "relay" | "both";
  label?: string;
}

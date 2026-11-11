/** One step of the scrolling story. Chapter cards have `card`; scenes have a picture (or video) and a line of the story. */
export interface StoryScene {
  chapter: number;
  card?: boolean;
  text?: string;
  /** Picture shown in the frame (also the video's poster). */
  image?: string;
  /** Video clip for this scene (in the same folder as the pictures), when the team has made one. */
  video?: string;
  credit?: string;
  /** cover (default): fill the frame · contain: whole picture on a blurred copy · pan: slide across a wide panorama. */
  fit?: "cover" | "contain" | "pan";
  /** Zoom at the start and end of the scene (default 1 → 1.08). */
  zoom?: [number, number];
  /** Where a panorama starts (0 = left edge). */
  panFrom?: number;
  gray?: boolean;
  /** A question for Cosmo about this scene. */
  ask?: string;
}

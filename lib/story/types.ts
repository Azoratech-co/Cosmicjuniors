import type { StorySoundPreset } from "@/lib/storySound";

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
  /** Which part of the picture to keep when the frame crops it (CSS object-position), e.g. "75% 50%". */
  focus?: string;
  /** A date or mission time shown in the frame's corner (only real, checked dates). */
  stamp?: string;
  /** Narration for this scene (an audio file in the story folder), when the team has recorded it. */
  audio?: string;
  /** Background sound and arrival sound for this scene (see lib/storySound.ts). */
  sound?: StorySoundPreset;
  /** A question for Cosmo about this scene. */
  ask?: string;
}

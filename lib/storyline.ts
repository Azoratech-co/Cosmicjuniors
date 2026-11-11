import stories from "@/content/stories.json";
import { STORY_TOPICS } from "./cosmo/stories";

// The team's stories, as readers see them (content/stories.json is built from the manuscripts,
// with facts and typos corrected). Chapter photos come from Cosmo's story notes.

export interface StoryChapter {
  n: number;
  title: string;
  paragraphs: string[];
  image?: { src: string; alt: string; credit: string };
}
export interface Story {
  id: "sojourner" | "spirit";
  title: string;
  status: string;
  chapters: StoryChapter[];
}

/** Sign language videos per chapter, e.g. { sojourner: { 1: "/sign/sojourner-1.mp4" } }. Add files to public/sign/. */
export const SIGN_VIDEOS: Record<string, Record<number, string>> = {};

export const STORY_IDS = ["sojourner", "spirit"] as const;

export function getStory(id: string): Story | undefined {
  const s = (stories as Record<string, Story>)[id];
  if (!s) return undefined;
  return {
    ...s,
    chapters: s.chapters.map((c) => {
      const t = STORY_TOPICS.find((x) => x.id === `story-${id}-${c.n}`);
      return { ...c, image: t ? { src: t.image.src, alt: t.image.alt, credit: t.image.credit } : undefined };
    }),
  };
}

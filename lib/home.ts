// Homepage content the team can edit.

/** YouTube video ids for the two group videos. Leave empty until the videos are uploaded. `cover` is the picture shown before play. */
export const GROUP_VIDEOS: { title: string; youtubeId: string; cover?: string }[] = [
  { title: "Video 01 — Sojourner", youtubeId: "Mnco84l18qs", cover: "/home/video-cover.webp" },
  { title: "Video 02 — Mars Rovers", youtubeId: "" },
];

/** About us text (a first draft; the team can rewrite it). */
export const ABOUT_US =
  "We're Cosmic Juniors, a team from Beirut. For the 2026 NASA Space Apps Challenge, we tell the stories of the machines NASA left on Mars and the Moon, so they are never forgotten. Read our stories, meet the explorers, ask Cosmo anything, and play our mission games.";

/** YouTube video id for the podcast episode shown on /podcast. */
export const PODCAST_YOUTUBE_ID = "vHGVErnfwQw";

/** Picture shown on the podcast card and before the podcast plays. */
export const PODCAST_COVER = "/home/podcast-card.webp";

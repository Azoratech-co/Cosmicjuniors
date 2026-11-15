import type { StoryScene } from "./types";
import type { StorySoundPreset } from "@/lib/storySound";

// The Sojourner story as one continuous scroll: a framed clip in the middle of a starry stage,
// with the story's lines appearing over it. Every line comes from content/stories.json (already
// checked against NASA), shortened. Each clip is the team's AI illustration, painted from the real
// NASA/JPL photo named in its credit. Stamps are only real dates from the story.
//
// Narration: when the recorded lines are ready, put them in public/story/sojourner/audio/ as
// 01.mp3 … 27.mp3 and set NARRATION to true. The "Narration" button then appears in the story.

const S = "/story/sojourner/";
const NARRATION = false;

// the sound under each scene, 1-27 (made in the browser, see lib/storySound.ts)
const SOUNDS: StorySoundPreset[] = [
  "cleanroom", "cleanroom", "launch", "space", "space",
  "entry", "chute", "airbags", "bounce", "mars",
  "mars", "radio", "rover",
  "rover", "rover", "radio",
  "mars", "rover", "mars",
  "radio", "mars", "sunset", "sunset", "listening",
  "space", "legacy", "night",
];

type Base = Omit<StoryScene, "chapter" | "image" | "video">;
const clip = (n: number, chapter: number, scene: Base): StoryScene => {
  const nn = String(n).padStart(2, "0");
  return {
    chapter,
    image: `${S}v${nn}.jpg`,
    // scene 4 is a still painting (the clip's later frames were not clean enough)
    video: n === 4 ? undefined : `v${nn}.mp4`,
    zoom: n === 4 ? [1, 1.1] : [1, 1.035],
    sound: SOUNDS[n - 1],
    audio: NARRATION ? `audio/${nn}.mp3` : undefined,
    ...scene,
  };
};

const AI = "AI illustration based on: ";

export const SOJOURNER_SCENES: StoryScene[] = [
  { chapter: 0, card: true },

  { chapter: 1, card: true },
  clip(1, 1, {
    signVideo: {
      src: "/sign/sojourner/Chapter_01_Sentence_01.mp4",
      cues: [
        { start: 0, text: "Beyond the blue skies of Earth, a powerful rocket stood ready for one of humanity's most ambitious journeys." },
      ],
    },
    credit: AI + "Workers take a final look at Mars Pathfinder before it is sealed in the rocket · NASA",
    text: "Beyond the blue skies of Earth, a powerful rocket stood ready for one of humanity's most ambitious journeys.",
    ask: "What rocket launched Mars Pathfinder?",
  }),
  clip(2, 1, {
    signVideo: {
      src: "/sign/sojourner/scene-02.mp4",
      cues: [
        { start: 0, text: "At the top of the rocket rested a spacecraft carrying a small but remarkable explorer: Sojourner." },
        { start: 3.75, text: "The rover was folded safely inside the Mars Pathfinder lander." },
      ],
    },
    credit: AI + "The Mars Pathfinder spacecraft at Kennedy Space Center, 1996 · NASA",
    text: "At its top rested a spacecraft carrying a small but remarkable explorer: Sojourner, folded safely inside the Mars Pathfinder lander.",
    ask: "How did Sojourner fit inside the Pathfinder lander?",
  }),
  clip(3, 1, {
    signVideo: {
      src: "/sign/sojourner/Chapter_01_Sentence_04.mp4",
      cues: [
        { start: 0, text: "On December 4, 1996, flames roared beneath the rocket as it lifted away from Earth." },
      ],
    },
    credit: AI + "The launch of Mars Pathfinder, Cape Canaveral, Dec. 4, 1996 · NASA/JPL",
    stamp: "December 4, 1996",
    text: "On December 4, 1996, flames roared beneath the rocket as it lifted away from Earth.",
    ask: "When did Mars Pathfinder launch?",
  }),
  clip(4, 1, {
    signVideo: {
      src: "/sign/sojourner/scene-04.mp4",
      cues: [
        { start: 0, text: "Within moments, the blue sky gave way to the deep, endless blackness of space." },
        { start: 3.509, text: "Earth became a blue sphere wrapped in white clouds." },
      ],
    },
    credit: AI + "Earth from space, photographed by the Apollo 17 crew · NASA",
    text: "Within moments, the blue sky gave way to the deep, endless blackness of space, and Earth became a blue sphere wrapped in white clouds.",
  }),
  clip(5, 1, {
    signVideo: {
      src: "/sign/sojourner/scene-05.mp4",
      cues: [
        { start: 0, text: "For nearly seven months the spacecraft travelled through space." },
        { start: 3.359, text: "As months passed, Mars grew closer." },
      ],
    },
    model: "mars",
    credit: "3D Mars made from the Viking colour mosaic · NASA/JPL/USGS",
    text: "For nearly seven months the spacecraft travelled through space. As months passed, Mars grew closer.",
    ask: "How long did it take Pathfinder to fly to Mars?",
  }),

  { chapter: 2, card: true },
  clip(6, 2, {
    signVideo: {
      src: "/sign/sojourner/Chapter_02_Sentence_01.mp4",
      cues: [
        { start: 0, text: "On July 4, 1997, Mars Pathfinder plunged into the thin Martian air at tremendous speed, protected by its heat shield." },
      ],
    },
    credit: AI + "Mars from space · NASA/JPL",
    stamp: "July 4, 1997",
    text: "On July 4, 1997, Mars Pathfinder plunged into the thin Martian air at tremendous speed, protected by its heat shield.",
    ask: "Why did Pathfinder need a heat shield?",
  }),
  clip(7, 2, {
    signVideo: {
      src: "/sign/sojourner/scene-07.mp4",
      cues: [
        { start: 0, text: "Then came the parachute." },
        { start: 3.848, text: "The heat shield was released, and the lander hung below the spacecraft’s backshell on a tether." },
      ],
    },
    credit: AI + "A Mars parachute being tested on Earth · NASA/JPL",
    stamp: "July 4, 1997",
    text: "Then came the parachute. The heat shield was released, and the lander hung beneath it on a tether.",
  }),
  clip(8, 2, {
    signVideo: {
      src: "/sign/sojourner/Chapter_02_Sentence_04.mp4",
      cues: [
        { start: 0, text: "As the ground rushed closer, enormous airbags inflated around the lander to absorb the force of impact." },
      ],
    },
    credit: AI + "Engineers test Pathfinder's multi-lobed airbags on Earth · NASA",
    stamp: "July 4, 1997",
    text: "As the ground rushed closer, enormous airbags inflated around the lander to absorb the force of impact.",
    ask: "How did Pathfinder's airbags work?",
  }),
  clip(9, 2, {
    signVideo: {
      src: "/sign/sojourner/scene-09.mp4",
      cues: [
        { start: 0, text: "It struck the surface and bounced." },
        { start: 3.73, text: "Once, twice, and again and again: about fifteen times." },
      ],
    },
    credit: AI + "Pathfinder on Mars, July 4, 1997, with Sojourner still on its petal · NASA/JPL",
    stamp: "July 4, 1997",
    text: "It struck the surface and bounced. Once, twice, and again and again: about fifteen times.",
  }),
  clip(10, 2, {
    signVideo: {
      src: "/sign/sojourner/Chapter_02_Sentence_07.mp4",
      cues: [
        { start: 0, text: "And for a moment, the landscape seemed untouched by time: reddish dust, scattered rocks, and a pale, hazy sky." },
      ],
    },
    credit: AI + "The first 360° panorama of the landing site · NASA/JPL",
    text: "And for a moment, the landscape seemed untouched by time: reddish dust, scattered rocks, and a pale, hazy sky.",
    ask: "Why did NASA land Pathfinder in Ares Vallis?",
  }),

  { chapter: 3, card: true },
  clip(11, 3, {
    signVideo: {
      src: "/sign/sojourner/scene-11.mp4",
      cues: [
        { start: 0, text: "The lander's petals unfolded, but the landing had not gone perfectly." },
        { start: 3.586, text: "One airbag had not pulled back completely, and it blocked Sojourner's ramp." },
      ],
    },
    credit: AI + "Sojourner on the lander's petal, with an airbag beside it · NASA/JPL",
    text: "The lander's petals unfolded, but the landing had not gone perfectly: one airbag had not pulled back completely, and it blocked Sojourner's ramp.",
  }),
  clip(12, 3, {
    signVideo: {
      src: "/sign/sojourner/scene-12.mp4",
      cues: [
        { start: 0, text: "Engineers on Earth studied the pictures and worked toward a solution." },
        { start: 3.521, text: "Every command had to travel the enormous distance to Mars." },
      ],
    },
    credit: AI + "A JPL test of the lander with open petals and deflated airbags · NASA/JPL",
    text: "Engineers on Earth studied the pictures and worked toward a solution. Every command had to travel the enormous distance to Mars.",
  }),
  clip(13, 3, {
    signVideo: {
      src: "/sign/sojourner/scene-13.mp4",
      cues: [
        { start: 0, text: "On the night of July 5, 1997, Sojourner rolled down the ramp." },
        { start: 3.821, text: "For the first time, a wheeled robot was exploring another planet." },
      ],
    },
    credit: AI + "Sojourner's own wheel tracks in the Martian soil · NASA/JPL",
    stamp: "July 5, 1997",
    text: "On the night of July 5, 1997, Sojourner rolled down the ramp. For the first time, a wheeled robot was exploring another planet.",
    ask: "When did Sojourner roll onto Mars?",
  }),

  { chapter: 4, card: true },
  clip(14, 4, {
    signVideo: {
      src: "/sign/sojourner/Chapter_04_Sentence_01.mp4",
      cues: [
        { start: 0, text: "Sojourner stood only about thirty centimetres tall and weighed about 10.6 kilograms." },
      ],
    },
    model: "sojourner",
    credit: "3D Sojourner built by the team from NASA/JPL measurements · Ares Vallis panorama: NASA/JPL",
    text: "Sojourner stood only about thirty centimetres tall and weighed about 10.6 kilograms.",
    ask: "How big was Sojourner?",
  }),
  clip(15, 4, {
    signVideo: {
      src: "/sign/sojourner/scene-15.mp4",
      cues: [
        { start: 0, text: "It moved slowly, about one centimetre per second." },
        { start: 6.641, text: "One small mistake on an unfamiliar world could create a serious problem." },
      ],
    },
    credit: AI + "Sojourner near the \"Rock Garden\" · NASA/JPL",
    text: "It moved slowly, about one centimetre per second. One small mistake on an unfamiliar world could create a serious problem.",
  }),
  clip(16, 4, {
    signVideo: {
      src: "/sign/sojourner/scene-16.mp4",
      cues: [
        { start: 0, text: "Sojourner could not send messages to Earth directly." },
        { start: 4.987, text: "The lander relayed its messages to the large radio antennas back on Earth." },
      ],
    },
    credit: AI + "A NASA Deep Space Network antenna at Goldstone, California · NASA/JPL",
    text: "Sojourner could not talk to Earth directly. The lander relayed its messages to the large radio antennas back home.",
    ask: "How did Sojourner send messages to Earth?",
  }),

  { chapter: 5, card: true },
  clip(17, 5, {
    signVideo: {
      src: "/sign/sojourner/Chapter_05_Sentence_01.mp4",
      cues: [
        { start: 0, text: "Every rock could hold clues about the history of Mars." },
      ],
    },
    credit: AI + "Sojourner, still on the lander, and the terrain of Ares Vallis · NASA/JPL",
    text: "Every rock could hold clues about the history of Mars.",
  }),
  clip(18, 5, {
    signVideo: {
      src: "/sign/sojourner/Chapter_05_Sentence_02.mp4",
      cues: [
        { start: 0, text: "Sojourner pressed its APXS instrument against rocks with names like Barnacle Bill, Yogi, Scooby Doo and Chimp, to find out what they were made of." },
      ],
    },
    credit: AI + "Sojourner next to the rock named Yogi · NASA/JPL",
    text: "Sojourner pressed its APXS instrument against rocks with names like Barnacle Bill, Yogi, Scooby Doo and Chimp, to find out what they were made of.",
    ask: "What did Sojourner's APXS instrument do?",
  }),
  clip(19, 5, {
    signVideo: {
      src: "/sign/sojourner/Chapter_05_Sentence_03.mp4",
      cues: [
        { start: 0, text: "Rounded pebbles suggested that, long ago, water had moved through this part of Mars." },
      ],
    },
    credit: AI + "Large boulders at the landing site, a dry flood channel · NASA/JPL",
    text: "Rounded pebbles suggested that, long ago, water had once moved through this part of Mars.",
    ask: "Did water once flow at Ares Vallis?",
  }),

  { chapter: 6, card: true },
  clip(20, 6, {
    signVideo: {
      src: "/sign/sojourner/Chapter_06_Sentence_01.mp4",
      cues: [
        { start: 0, text: "A radio signal could take several minutes to travel between Earth and Mars, so every drive had to be planned in advance." },
      ],
    },
    credit: AI + "Yogi, seen through Sojourner's own camera · NASA/JPL",
    text: "A radio signal could take several minutes to travel between Earth and Mars, so every drive had to be planned in advance.",
    ask: "How long does a radio signal take between Earth and Mars?",
  }),

  { chapter: 7, card: true },
  clip(21, 7, {
    signVideo: {
      src: "/sign/sojourner/scene-21.mp4",
      cues: [
        { start: 0, text: "Sojourner was built for a seven-day mission." },
        { start: 3.834, text: "It kept exploring for eighty-three days." },
      ],
    },
    credit: AI + "Ares Vallis, from the Pathfinder lander · NASA/JPL",
    stamp: "83 days on Mars",
    focus: "82% 50%",
    text: "Sojourner was built for a seven-day mission. It kept exploring for eighty-three days.",
    ask: "How long did Sojourner's mission last?",
  }),

  { chapter: 8, card: true },
  clip(22, 8, {
    signVideo: {
      src: "/sign/sojourner/scene-22.mp4",
      cues: [
        { start: 0, text: "On September 27, 1997, the last data arrived from Pathfinder." },
        { start: 4.006, text: "Sojourner had just studied a rock named Chimp." },
      ],
    },
    credit: AI + "A Martian sunset photographed by Pathfinder · NASA/JPL",
    stamp: "September 27, 1997",
    text: "On September 27, 1997, the last data arrived from Pathfinder. Sojourner had just studied a rock named Chimp.",
  }),
  clip(23, 8, {
    signVideo: {
      src: "/sign/sojourner/Chapter_08_Sentence_03.mp4",
      cues: [
        { start: 0, text: "On October 7, Earth received a final signal from Pathfinder, but it contained no spacecraft data." },
      ],
    },
    credit: AI + "Sunset over the Twin Peaks, from Pathfinder · NASA/JPL",
    stamp: "October 7, 1997",
    text: "On October 7, Earth heard from Pathfinder for the last time.",
  }),

  { chapter: 9, card: true },
  clip(24, 9, {
    signVideo: {
      src: "/sign/sojourner/scene-24.mp4",
      cues: [
        { start: 0, text: "Engineers kept trying for months." },
        { start: 3.385, text: "On March 10, 1998, NASA listened one last time." },
        { start: 6.91, text: "No signal came." },
      ],
    },
    credit: "AI illustration: the mission team listens for a signal from Pathfinder",
    stamp: "March 10, 1998",
    text: "Engineers kept trying for months. On March 10, 1998, NASA listened one last time. No signal came.",
    ask: "What happened to Sojourner after contact was lost?",
  }),

  { chapter: 10, card: true },
  clip(25, 10, {
    signVideo: {
      src: "/sign/sojourner/scene-25.mp4",
      cues: [
        { start: 0, text: "Today, Sojourner remains at the Pathfinder landing site on Mars." },
        { start: 4.138, text: "No spacecraft ever came to bring it home." },
      ],
    },
    credit: AI + "The Pathfinder landing site and its surroundings, seen from orbit · NASA/JPL",
    text: "Today, Sojourner remains at the Pathfinder landing site on Mars. No spacecraft ever came to bring it home.",
    ask: "Where is Sojourner now?",
  }),
  clip(26, 10, {
    signVideo: {
      src: "/sign/sojourner/Chapter_10_Sentence_03.mp4",
      cues: [
        { start: 0, text: "Its journey prepared the way for the rovers that followed: Spirit, Opportunity, Curiosity and Perseverance." },
      ],
    },
    credit: AI + "The rovers that followed: Spirit, Opportunity, Curiosity and Perseverance · NASA/JPL",
    text: "Its journey prepared the way for the rovers that followed: Spirit, Opportunity, Curiosity and Perseverance.",
    ask: "Which rovers came after Sojourner?",
  }),
  clip(27, 10, {
    signVideo: {
      src: "/sign/sojourner/scene-27.mp4",
      cues: [
        { start: 0, text: "Somewhere on Mars, the little rover remains." },
        { start: 3.546, text: "Abandoned." },
        { start: 4.48, text: "But never forgotten." },
      ],
    },
    credit: AI + "Pathfinder and Sojourner at Ares Vallis · NASA/JPL, painted at night",
    text: "Somewhere on Mars, the little rover remains. Abandoned. But never forgotten.",
  }),
  { chapter: 10, activity: "story-quiz" },
];

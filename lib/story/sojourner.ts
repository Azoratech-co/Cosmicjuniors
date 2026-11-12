import type { StoryScene } from "./types";

// The Sojourner story as one continuous scroll: a framed clip in the middle of a starry stage,
// with the story's lines appearing over it. Every line comes from content/stories.json (already
// checked against NASA), shortened. Each clip is the team's AI illustration, painted from the real
// NASA/JPL photo named in its credit. Stamps are only real dates from the story.
//
// Narration: when the recorded lines are ready, put them in public/story/sojourner/audio/ as
// 01.mp3 … 27.mp3 and set NARRATION to true. The "Narration" button then appears in the story.

const S = "/story/sojourner/";
const NARRATION = false;

type Base = Omit<StoryScene, "chapter" | "image" | "video">;
const clip = (n: number, chapter: number, scene: Base): StoryScene => {
  const nn = String(n).padStart(2, "0");
  return {
    chapter,
    image: `${S}v${nn}.jpg`,
    // scene 4 is a still painting (the clip's later frames were not clean enough)
    video: n === 4 ? undefined : `v${nn}.mp4`,
    zoom: n === 4 ? [1, 1.1] : [1, 1.035],
    audio: NARRATION ? `audio/${nn}.mp3` : undefined,
    ...scene,
  };
};

const AI = "AI illustration based on: ";

export const SOJOURNER_SCENES: StoryScene[] = [
  { chapter: 0, card: true },

  { chapter: 1, card: true },
  clip(1, 1, {
    credit: AI + "Workers take a final look at Mars Pathfinder before it is sealed in the rocket · NASA",
    text: "Beyond the blue skies of Earth, a powerful rocket stood ready for one of humanity's most ambitious journeys.",
    ask: "What rocket launched Mars Pathfinder?",
  }),
  clip(2, 1, {
    credit: AI + "The Mars Pathfinder spacecraft at Kennedy Space Center, 1996 · NASA",
    text: "At its top rested a spacecraft carrying a small but remarkable explorer: Sojourner, folded safely inside the Mars Pathfinder lander.",
    ask: "How did Sojourner fit inside the Pathfinder lander?",
  }),
  clip(3, 1, {
    credit: AI + "The launch of Mars Pathfinder, Cape Canaveral, Dec. 4, 1996 · NASA/JPL",
    stamp: "December 4, 1996",
    text: "On December 4, 1996, flames roared beneath the rocket as it lifted away from Earth.",
    ask: "When did Mars Pathfinder launch?",
  }),
  clip(4, 1, {
    credit: AI + "Earth from space, photographed by the Apollo 17 crew · NASA",
    text: "Within moments, the blue sky gave way to the deep, endless blackness of space, and Earth became a blue sphere wrapped in white clouds.",
  }),
  clip(5, 1, {
    credit: AI + "Mars in color, from Viking orbiter images · NASA/JPL",
    text: "For nearly seven months the spacecraft travelled through space. As months passed, Mars grew closer.",
    ask: "How long did it take Pathfinder to fly to Mars?",
  }),

  { chapter: 2, card: true },
  clip(6, 2, {
    credit: AI + "Mars from space · NASA/JPL",
    stamp: "July 4, 1997",
    text: "On July 4, 1997, Mars Pathfinder plunged into the thin Martian air at tremendous speed, protected by its heat shield.",
    ask: "Why did Pathfinder need a heat shield?",
  }),
  clip(7, 2, {
    credit: AI + "A Mars parachute being tested on Earth · NASA/JPL",
    stamp: "July 4, 1997",
    text: "Then came the parachute. The heat shield was released, and the lander hung beneath it on a tether.",
  }),
  clip(8, 2, {
    credit: AI + "Engineers test Pathfinder's multi-lobed airbags on Earth · NASA",
    stamp: "July 4, 1997",
    text: "As the ground rushed closer, enormous airbags inflated around the lander to absorb the force of impact.",
    ask: "How did Pathfinder's airbags work?",
  }),
  clip(9, 2, {
    credit: AI + "Pathfinder on Mars, July 4, 1997, with Sojourner still on its petal · NASA/JPL",
    stamp: "July 4, 1997",
    text: "It struck the surface and bounced. Once, twice, and again and again: about fifteen times.",
  }),
  clip(10, 2, {
    credit: AI + "The first 360° panorama of the landing site · NASA/JPL",
    text: "And for a moment, the landscape seemed untouched by time: reddish dust, scattered rocks, and a pale, hazy sky.",
    ask: "Why did NASA land Pathfinder in Ares Vallis?",
  }),

  { chapter: 3, card: true },
  clip(11, 3, {
    credit: AI + "Sojourner on the lander's petal, with an airbag beside it · NASA/JPL",
    text: "The lander's petals unfolded, but the landing had not gone perfectly: one airbag had not pulled back completely, and it blocked Sojourner's ramp.",
  }),
  clip(12, 3, {
    credit: AI + "A JPL test of the lander with open petals and deflated airbags · NASA/JPL",
    text: "Engineers on Earth studied the pictures and worked toward a solution. Every command had to travel the enormous distance to Mars.",
  }),
  clip(13, 3, {
    credit: AI + "Sojourner's own wheel tracks in the Martian soil · NASA/JPL",
    stamp: "July 5, 1997",
    text: "On the night of July 5, 1997, Sojourner rolled down the ramp. For the first time, a wheeled robot was exploring another planet.",
    ask: "When did Sojourner roll onto Mars?",
  }),

  { chapter: 4, card: true },
  clip(14, 4, {
    credit: AI + "Sojourner on Mars · Cosmic Juniors illustration and NASA/JPL",
    text: "Sojourner stood only about thirty centimetres tall and weighed about 10.6 kilograms.",
    ask: "How big was Sojourner?",
  }),
  clip(15, 4, {
    credit: AI + "Sojourner near the \"Rock Garden\" · NASA/JPL",
    text: "It moved slowly, about one centimetre per second. One small mistake on an unfamiliar world could create a serious problem.",
  }),
  clip(16, 4, {
    credit: AI + "A NASA Deep Space Network antenna at Goldstone, California · NASA/JPL",
    text: "Sojourner could not talk to Earth directly. The lander relayed its messages to the large radio antennas back home.",
    ask: "How did Sojourner send messages to Earth?",
  }),

  { chapter: 5, card: true },
  clip(17, 5, {
    credit: AI + "Sojourner, still on the lander, and the terrain of Ares Vallis · NASA/JPL",
    text: "Every rock could hold clues about the history of Mars.",
  }),
  clip(18, 5, {
    credit: AI + "Sojourner next to the rock named Yogi · NASA/JPL",
    text: "Sojourner pressed its APXS instrument against rocks with names like Barnacle Bill, Yogi, Scooby Doo and Chimp, to find out what they were made of.",
    ask: "What did Sojourner's APXS instrument do?",
  }),
  clip(19, 5, {
    credit: AI + "Large boulders at the landing site, a dry flood channel · NASA/JPL",
    text: "Rounded pebbles suggested that, long ago, water had once moved through this part of Mars.",
    ask: "Did water once flow at Ares Vallis?",
  }),

  { chapter: 6, card: true },
  clip(20, 6, {
    credit: AI + "Yogi, seen through Sojourner's own camera · NASA/JPL",
    text: "A radio signal could take several minutes to travel between Earth and Mars, so every drive had to be planned in advance.",
    ask: "How long does a radio signal take between Earth and Mars?",
  }),

  { chapter: 7, card: true },
  clip(21, 7, {
    credit: AI + "Ares Vallis, from the Pathfinder lander · NASA/JPL",
    stamp: "83 days on Mars",
    focus: "82% 50%",
    text: "Sojourner was built for a seven-day mission. It kept exploring for eighty-three days.",
    ask: "How long did Sojourner's mission last?",
  }),

  { chapter: 8, card: true },
  clip(22, 8, {
    credit: AI + "A Martian sunset photographed by Pathfinder · NASA/JPL",
    stamp: "September 27, 1997",
    text: "On September 27, 1997, the last data arrived from Pathfinder. Sojourner had just studied a rock named Chimp.",
  }),
  clip(23, 8, {
    credit: AI + "Sunset over the Twin Peaks, from Pathfinder · NASA/JPL",
    stamp: "October 7, 1997",
    text: "On October 7, Earth heard from Pathfinder for the last time.",
  }),

  { chapter: 9, card: true },
  clip(24, 9, {
    credit: "AI illustration: the mission team listens for a signal from Pathfinder",
    stamp: "March 10, 1998",
    text: "Engineers kept trying for months. On March 10, 1998, NASA listened one last time. No signal came.",
    ask: "What happened to Sojourner after contact was lost?",
  }),

  { chapter: 10, card: true },
  clip(25, 10, {
    credit: AI + "The Pathfinder landing site and its surroundings, seen from orbit · NASA/JPL",
    text: "Today, Sojourner remains at the Pathfinder landing site on Mars. No spacecraft ever came to bring it home.",
    ask: "Where is Sojourner now?",
  }),
  clip(26, 10, {
    credit: AI + "The rovers that followed: Spirit, Opportunity, Curiosity and Perseverance · NASA/JPL",
    text: "Its journey prepared the way for the rovers that followed: Spirit, Opportunity, Curiosity and Perseverance.",
    ask: "Which rovers came after Sojourner?",
  }),
  clip(27, 10, {
    credit: AI + "Pathfinder and Sojourner at Ares Vallis · NASA/JPL, painted at night",
    text: "Somewhere on Mars, the little rover remains. Abandoned. But never forgotten.",
  }),
];

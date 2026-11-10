import type { NasaImage, Topic } from "./knowledge";

// The Cosmic Juniors Storyline: the team's own stories, retold chapter by chapter so Cosmo can
// answer story questions. Sojourner merges Leah's and Lilian's manuscripts (Leah's chapters,
// Lilian's scenes and ending). Spirit is Lilian's second story, still being written.
// Facts were checked against NASA pages (Nov 2026) and corrected where the drafts differed.

const img = (nasaId: string, file: string, alt: string, credit: string): NasaImage => ({
  nasaId,
  src: `https://images-assets.nasa.gov/image/${nasaId}/${file}`,
  alt,
  credit,
});

const SOJOURNER = "Sojourner: The Journey Through the Stars";
const SPIRIT = "Spirit: A New Explorer";

interface Chapter {
  n: number;
  title: string;
  keywords: string[];
  facts: string[];
  image: NasaImage;
}

function storyTopics(story: { id: string; title: string; by: string; chapters: Chapter[] }): Topic[] {
  return story.chapters.map((c) => ({
    id: `story-${story.id}-${c.n}`,
    kind: "story",
    keywords: c.keywords,
    title: `${story.title} · Chapter ${c.n}: ${c.title}`,
    publisher: `Cosmic Juniors Storyline · by ${story.by}`,
    url: "",
    facts: c.facts,
    image: c.image,
  }));
}

const sojournerChapters: Chapter[] = [
  {
    n: 1,
    title: "The Journey Through the Stars",
    keywords: ["begin", "beginning", "start", "starts", "launch", "launched", "rocket", "journey", "space", "built", "why build", "small", "chapter 1", "first chapter"],
    facts: [
      "On Dec. 4, 1996, flames roared beneath a rocket as it lifted away from Earth, carrying the Mars Pathfinder spacecraft with Sojourner folded safely inside.",
      "Earth shrank behind it into a magnificent blue sphere wrapped in swirling white clouds, while distant stars shimmered like scattered diamonds.",
      "Sojourner could not feel excitement or fear like a human, but its cameras and sensors were ready to observe a world few machines had ever explored.",
      "Scientists built Sojourner small on purpose: a practical way to test whether a robot on wheels could travel and work on another planet. Earlier missions had taught them lessons, and they refused to give up.",
      "For nearly seven months the spacecraft travelled through space, while engineers on Earth made small changes to keep it on the right path to Mars.",
    ],
    image: img("PIA04754", "PIA04754~small.jpg", "The Delta rocket launching Mars Pathfinder", "NASA"),
  },
  {
    n: 2,
    title: "The Red Planet Awakens",
    keywords: ["land", "landed", "landing", "arrive", "arrived", "parachute", "airbags", "airbag", "bounce", "bounced", "ares vallis", "flood", "chapter 2", "second chapter"],
    facts: [
      "Mars emerged from the darkness like a forgotten world awakening beneath a distant sun. The spacecraft was heading for Ares Vallis, where scientists believed enormous floods of water had once flowed.",
      "On July 4, 1997, Pathfinder plunged into the Martian air. A heat shield protected it from the heat of entry, then a parachute opened to slow it down.",
      "Giant airbags inflated around the lander. It struck the ground and bounced about 15 times before rolling to a stop.",
      "The landscape seemed untouched by time: reddish dust, scattered rocks, a pale hazy sky, and two hills on the horizon, the Twin Peaks, like guards at the entrance to a forgotten kingdom.",
    ],
    image: img("PIA00612", "PIA00612~orig.jpg", "The Martian surface and Pathfinder's airbags on its first day", "NASA/JPL"),
  },
  {
    n: 3,
    title: "A World Waiting to Be Explored",
    keywords: ["ramp", "blocked", "stuck airbag", "petals", "roll off", "rolled off", "first steps", "leave the lander", "left the lander", "drive off", "chapter 3", "third chapter"],
    facts: [
      "The lander opened its three petals, but one airbag had not pulled back all the way, and it blocked the ramp Sojourner needed.",
      "Engineers on Earth could not reach out and move it by hand. They studied the pictures and sent careful commands to clear the airbag out of the way.",
      "On the night of July 5, 1997 (July 6 in universal time), Sojourner rolled down the ramp. For the first time, a wheeled rover was operating on another planet.",
    ],
    image: img("PIA00611", "PIA00611~small.jpg", "Sojourner, the lander's airbags and the Martian terrain", "NASA/JPL"),
  },
  {
    n: 4,
    title: "First Steps Across Mars",
    keywords: ["drive", "drove", "speed", "fast", "slow", "wheels", "rocker", "commands", "control", "modem", "talk to earth", "relay", "how big", "size", "chapter 4", "fourth chapter"],
    facts: [
      "Sojourner stood about 30 cm tall and weighed 10.6 kg, but it carried six rugged wheels, a rocker-bogie suspension to stay steady over rocks, cameras and a science instrument.",
      "It moved slowly, about 1 cm per second, because one mistake on unfamiliar ground could cause serious trouble.",
      "Engineers on Earth sent its commands. It could spot some obstacles on its own, but it could not explore with human-like understanding.",
      "Sojourner could not talk to Earth directly. The Pathfinder lander relayed its messages, like a bridge between two worlds. Early on, a problem with the lander's modem was found and fixed.",
      "As its wheels turned, they pressed delicate patterns into soil as fine as powdered rust, while the lander stood nearby like a metallic visitor from another world.",
    ],
    image: img("PIA04318", "PIA04318~orig.jpg", "Sojourner rover next to rocks on Mars", "NASA/JPL"),
  },
  {
    n: 5,
    title: "The Secrets Hidden in the Rocks",
    keywords: ["rock", "rocks", "barnacle bill", "yogi", "scooby doo", "scooby", "chimp", "souffle", "apxs", "water", "discover", "discovered", "chapter 5", "fifth chapter"],
    facts: [
      "Sojourner carried the APXS, an instrument that finds out which chemical elements are inside rocks and soil. One detailed measurement could take about ten hours.",
      "Every rock had a personality. Barnacle Bill, one of the first targets, had a rough, uneven surface. Yogi was large and rounded, one of the most famous rocks of the mission.",
      "Souffle was full of tiny holes, as if bubbles had once been trapped inside. Scooby Doo and Chimp were also on Sojourner's list.",
      "The rocks were not all the same inside, which pointed to different origins.",
      "Rounded pebbles and rocks that looked cemented together suggested that ancient water had once rushed through this valley, then disappeared.",
    ],
    image: img("PIA01136", "PIA01136~orig.jpg", "Sojourner's view of the bubbly-looking rock Souffle", "NASA/JPL"),
  },
  {
    n: 6,
    title: "The Challenges of an Unfamiliar World",
    keywords: ["challenge", "challenges", "hard", "danger", "problem", "obstacle", "laser", "minutes", "signal", "delay", "chapter 6", "sixth chapter"],
    facts: [
      "The ground was uneven and full of rocks, so every drive had to be planned. Engineers used Sojourner's pictures to choose routes and science targets.",
      "A laser system helped the rover notice objects in its way.",
      "Radio signals took several minutes to travel between Earth and Mars, so engineers could not steer in real time. They planned, sent instructions and waited.",
      "The mission depended on a chain: the rover needed power, the lander needed power to relay messages, and the radio had to keep working.",
    ],
    image: img("PIA00609", "PIA00609~orig.jpg", "Large boulders at the Ares Vallis landing site", "NASA/JPL"),
  },
  {
    n: 7,
    title: "A Mission That Outlived Its Expectations",
    keywords: ["how long", "seven days", "83", "expected", "longer", "pictures", "photos", "chapter 7", "seventh chapter"],
    facts: [
      "Sojourner was planned to work for only seven days. Instead it explored for 83 days, about 12 times longer than planned.",
      "Sojourner took 550 pictures of its own, and the lander took more than 16,500.",
      "It proved that a small mobile robot could explore another planet, a lesson every rover after it would build on.",
    ],
    image: img("PIA01551", "PIA01551~orig.jpg", "Sojourner on the Martian surface, seen by the lander", "NASA/JPL"),
  },
  {
    n: 8,
    title: "The Silence Begins",
    keywords: ["silence", "lost contact", "stopped", "last message", "last data", "battery", "batteries", "cold", "what happened", "chapter 8", "eighth chapter"],
    facts: [
      "By September 1997, Sojourner had done far more than planned. One of the last rocks it studied was Chimp.",
      "On Sept. 27, 1997, the last data from Pathfinder arrived on Earth.",
      "Engineers think the lander's batteries ran down and it grew too cold for its electronics, and without the lander, Sojourner had no way to talk to Earth.",
    ],
    image: img("PIA00609", "PIA00609~orig.jpg", "The rocky Ares Vallis landing site", "NASA/JPL"),
  },
  {
    n: 9,
    title: "The Explorer Without a Voice",
    keywords: ["voice", "last moves", "circle", "waiting", "never heard", "tried", "contact", "unknown", "chapter 9", "ninth chapter"],
    facts: [
      "Sojourner never sent a goodbye. No final photo shows where it stopped.",
      "Its backup plan said it might circle the lander or wait in place for instructions, but nobody knows which it did.",
      "Engineers kept trying to reach the spacecraft for months, but the signals never brought it back.",
    ],
    image: img("PIA00612", "PIA00612~orig.jpg", "The silent Ares Vallis landscape and the lander's airbags", "NASA/JPL"),
  },
  {
    n: 10,
    title: "Abandoned, But Never Forgotten",
    keywords: ["end", "ending", "ends", "last chapter", "final chapter", "today", "now", "where is", "remains", "abandoned", "forgotten", "legacy", "chapter 10", "tenth chapter"],
    facts: [
      "Today Sojourner rests in Ares Vallis, near the lander that carried it, with the Twin Peaks still in the distance. Its wheels are still and its instruments are silent.",
      "Its exact condition today is unknown. It was never designed to come back to Earth.",
      "It paved the way for bigger rovers that followed: Spirit, Opportunity, Curiosity and Perseverance.",
      "The story ends: \"Somewhere on Mars, the little rover remains, alone at the edge of a universe, abandoned. But never forgotten.\"",
    ],
    image: img("PIA04318", "PIA04318~orig.jpg", "Sojourner beside a rock in Ares Vallis", "NASA/JPL"),
  },
];

const spiritChapters: Chapter[] = [
  {
    n: 1,
    title: "A New Explorer",
    keywords: ["begin", "beginning", "start", "starts", "about", "second story", "2nd story", "next story", "chapter 1", "first chapter"],
    facts: [
      "After Sojourner opened the door to exploring Mars, a new explorer was getting ready: Spirit.",
      "Mars was a world of breathtaking beauty and overwhelming silence, with no birds, no rivers and no footsteps, but secrets buried under its rusty dust.",
      "People wondered: had water once flowed through its valleys? Had Mars once been warmer and wetter?",
      "Mars would not be welcoming: freezing nights, dust storms and rough ground would test every part of the little explorer.",
    ],
    image: img("PIA04413", "PIA04413~small.jpg", "Artist's concept of a Mars Exploration Rover like Spirit", "NASA/JPL"),
  },
  {
    n: 2,
    title: "Landing in Gusev Crater",
    keywords: ["land", "landed", "landing", "arrive", "arrived", "gusev", "airbags", "parachute", "rolled off", "chapter 2", "second chapter"],
    facts: [
      "On Jan. 3, 2004 (Jan. 4 in universal time), Spirit reached Mars and dove toward Gusev crater.",
      "Its heat shield took the fiery heat of entry, a parachute opened, airbags inflated, and rockets fired to slow it down. It bounced and rolled across the ground again and again until it stopped.",
      "Then came silence: not the silence of failure, but the silence of arrival.",
      "On Jan. 15, 2004, Spirit rolled off its lander and left its first tracks on Mars.",
    ],
    image: img("PIA05124", "PIA05124~small.jpg", "Gusev crater seen from orbit during Spirit's landing", "NASA/JPL/Malin Space Science Systems"),
  },
  {
    n: 3,
    title: "The Silence Within",
    keywords: ["wrong", "went wrong", "problem", "trouble", "broke", "broken", "computer", "flash memory", "memory", "fix", "fixed", "silence", "chapter 3", "third chapter"],
    facts: [
      "On Jan. 21, 2004, Spirit ran into a serious problem with its flash memory, and NASA lost normal contact with it.",
      "The danger came not from Mars, but from inside the machine itself.",
      "Engineers on Earth could not fix it by hand. They reformatted its flash memory and sent software fixes across space.",
      "On Feb. 5, 2004, normal operations resumed. Spirit's journey had almost ended before it truly began.",
    ],
    image: img("PIA04413", "PIA04413~small.jpg", "Artist's concept of a Mars Exploration Rover", "NASA/JPL"),
  },
  {
    n: 4,
    title: "The Columbia Hills",
    keywords: ["columbia hills", "hills", "climb", "goethite", "sulfate", "sulfates", "water", "find", "found", "discover", "discovered", "minerals", "next", "end", "ending", "chapter 4", "fourth chapter", "last chapter"],
    facts: [
      "Beyond the plains of Gusev rose the Columbia Hills, like enormous waves frozen in an ancient ocean.",
      "Scientists hoped the hills held evidence of ancient water, so Spirit began to climb over loose soil and scattered stones.",
      "Spirit found minerals such as goethite and hydrated sulfate salts, clues that water had once changed these rocks.",
      "The plains told a story of volcanoes. The hills revealed another chapter, where water played a big role.",
      "The team is still writing what happens next in Spirit's story.",
    ],
    image: img("PIA09491", "PIA09491~small.jpg", "Silica-rich soil found by the Spirit rover", "NASA/JPL-Caltech/Cornell"),
  },
];

export const STORY_TOPICS: Topic[] = [
  ...storyTopics({ id: "sojourner", title: SOJOURNER, by: "Leah & Lilian", chapters: sojournerChapters }),
  ...storyTopics({ id: "spirit", title: SPIRIT, by: "Lilian", chapters: spiritChapters }),
];

/** The table of contents, always given to Cosmo in Storyline mode so it knows the whole arc. */
export const STORY_OUTLINE = [
  `"${SOJOURNER}" by Leah & Lilian (finished): ${sojournerChapters.map((c) => `${c.n}. ${c.title}`).join("; ")}.`,
  `"${SPIRIT}" by Lilian (still being written): ${spiritChapters.map((c) => `${c.n}. ${c.title}`).join("; ")}.`,
].join("\n");

const esc = (k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const WORD_NUM: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, last: 10 };

/** Pick the chapters a story question is about (chapter numbers, names, events). */
export function findStoryChapters(question: string, context = "", limit = 3): Topic[] {
  const q = ` ${question.toLowerCase()} `;
  const c = ` ${context.toLowerCase()} `;
  const spirit = /\bspirit\b/.test(q) || (!/\bsojourner\b/.test(q) && /\bspirit\b/.test(c));
  const pool = STORY_TOPICS.filter((t) => t.id.startsWith(spirit ? "story-spirit" : "story-sojourner"));

  // "chapter 3", "chapter three", "the third chapter"
  const num = q.match(/chapter\s+(\d+)/)?.[1] ?? Object.entries(WORD_NUM).find(([w]) => new RegExp(`\\b${w}\\s+chapter\\b|chapter\\s+${w}\\b`).test(q))?.[1];
  if (num) {
    const hit = pool.find((t) => t.id.endsWith(`-${num}`));
    if (hit) return [hit];
  }

  const scored = pool
    .map((t) => {
      let s = 0;
      for (const k of t.keywords) {
        const re = new RegExp(`\\b${esc(k)}\\b`);
        if (re.test(q)) s += 3 + k.split(" ").length;
        else if (re.test(c)) s += 1;
      }
      return { t, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  if (scored.length) return scored.slice(0, limit).map((x) => x.t);
  // No clear match: start of the story plus the ending, so Cosmo can still answer about the whole arc.
  return [pool[0], pool[pool.length - 1]];
}

/** Does a question in Explain mode ask about the team's stories? */
export const ASKS_ABOUT_STORY = /\b(story|stories|storyline|chapter|novel|leah|lilian)\b/i;

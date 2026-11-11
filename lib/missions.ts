// Real NASA missions used by the games. Every fact here comes from the NASA mission pages
// linked below (the same sources Cosmo uses, checked Nov 2026). Dates are used to compute cruise lengths.

export interface Mission {
  id: string;
  name: string;
  craft: string;
  year: number;
  site: string;
  kind: "rover" | "lander";
  source: { title: string; url: string };
  photo: { src: string; credit: string; alt: string };
  /** Facts collected in Journey to Mars (science data). */
  facts: string[];
  /** What the science task reveals in Mars Landing. */
  discovery: string;
  /** Where the hardware rests now: the "Abandoned but not Forgotten" ending. */
  epilogue: string;
}

const img = (id: string, file: string) => `https://images-assets.nasa.gov/image/${id}/${file}`;

export const MISSIONS: Record<string, Mission> = {
  viking1: {
    id: "viking1",
    name: "Viking 1",
    craft: "Viking 1 lander",
    year: 1976,
    site: "Chryse Planitia",
    kind: "lander",
    source: { title: "Viking", url: "https://science.nasa.gov/mission/viking/" },
    photo: { src: img("PIA00381", "PIA00381~orig.jpg"), credit: "NASA/JPL · PIA00381", alt: "The first photograph taken on the surface of Mars" },
    facts: [
      "Viking 1 landed on July 20, 1976, at Chryse Planitia, the first successful U.S. lander on Mars.",
      "On the day it landed, it took the first photograph ever taken from the surface of Mars.",
      "It was planned to work for 90 days and kept going for more than six years.",
    ],
    discovery:
      "You scooped Martian soil for the biology lab. Viking's experiments found unexpected chemical activity in the soil, but no clear evidence of living microbes.",
    epilogue: "Viking 1 made its final transmission on Nov. 11, 1982. The lander is still at Chryse Planitia.",
  },
  pathfinder: {
    id: "pathfinder",
    name: "Mars Pathfinder",
    craft: "Pathfinder lander + Sojourner rover",
    year: 1997,
    site: "Ares Vallis",
    kind: "rover",
    source: { title: "Mars Pathfinder", url: "https://science.nasa.gov/mission/mars-pathfinder/" },
    photo: { src: img("PIA04318", "PIA04318~orig.jpg"), credit: "NASA/JPL · PIA04318", alt: "Sojourner rover next to rocks on Mars" },
    facts: [
      "Mars Pathfinder launched on Dec. 4, 1996, and landed on July 4, 1997, in Ares Vallis, an ancient flood plain.",
      "It carried Sojourner, the first rover to drive on another planet.",
      "Sojourner weighed 10.6 kg and stood about 30 cm tall.",
      "The rover was named after Sojourner Truth, the American civil-rights crusader.",
      "The lander took more than 16,500 pictures. Sojourner took 550 of its own.",
    ],
    discovery: "Sojourner reached the rock! The mission made more than 15 chemical analyses of Martian rocks and soil.",
    epilogue: "The last data from Pathfinder arrived on Sept. 27, 1997. The lander and Sojourner are still in Ares Vallis.",
  },
  spirit: {
    id: "spirit",
    name: "Spirit",
    craft: "Spirit rover",
    year: 2004,
    site: "Gusev crater",
    kind: "rover",
    source: { title: "Spirit", url: "https://science.nasa.gov/mission/mer-spirit/" },
    photo: { src: img("PIA04413", "PIA04413~small.jpg"), credit: "NASA/JPL · PIA04413 (artist's concept)", alt: "Artist's concept of a Mars Exploration Rover" },
    facts: [
      "Spirit launched on June 10, 2003, and landed inside Gusev crater on Jan. 3, 2004.",
      "It was planned to work for 90 Martian days but lasted more than six years.",
      "Spirit drove about 7.73 km (4.8 miles) across Mars.",
      "In May 2009, Spirit got stuck in soft soil, and NASA turned it into a stationary science station.",
      "In 2005, passing dust devils swept dust off Spirit's solar panels and gave it more power. It also filmed dust devils moving.",
    ],
    discovery:
      "Spirit reached the rock! It found nearly pure silica, a clue that Mars once had hot springs or steam vents and was much wetter.",
    epilogue: "NASA last heard from Spirit on March 22, 2010, probably because extreme cold stopped its heaters. It rests in Gusev crater.",
  },
  insight: {
    id: "insight",
    name: "InSight",
    craft: "InSight lander",
    year: 2018,
    site: "Elysium Planitia",
    kind: "lander",
    source: { title: "InSight", url: "https://science.nasa.gov/mission/insight/" },
    photo: { src: img("PIA25287", "PIA25287~small.jpg"), credit: "NASA/JPL-Caltech · PIA25287", alt: "InSight lander's final selfie, covered in dust" },
    facts: [
      "InSight landed on Nov. 26, 2018, on a flat plain called Elysium Planitia, near the equator.",
      "Its job was to study the deep inside of Mars: its pulse, temperature and reflexes.",
    ],
    discovery: "You placed the seismometer. InSight listened for marsquakes, which helped scientists learn what the inside of Mars is made of.",
    epilogue: "InSight's mission ended on Dec. 15, 2022. Its final selfie shows it covered in Martian dust at Elysium Planitia.",
  },
  perseverance: {
    id: "perseverance",
    name: "Perseverance",
    craft: "Perseverance rover + Ingenuity",
    year: 2021,
    site: "Jezero Crater",
    kind: "rover",
    source: { title: "Mars 2020: Perseverance", url: "https://science.nasa.gov/mission/mars-2020-perseverance/" },
    photo: { src: img("PIA24542", "PIA24542~small.jpg"), credit: "NASA/JPL-Caltech/MSSS · PIA24542", alt: "Perseverance selfie with the Ingenuity helicopter" },
    facts: [
      "Perseverance launched on July 30, 2020, and landed in Jezero Crater on Feb. 18, 2021.",
      "Its job is to look for signs of ancient microbial life and collect rock samples.",
      "It carried Ingenuity, the first aircraft to make a powered, controlled flight on another planet.",
      "Ingenuity was designed for up to five test flights. It flew 72 times.",
      "An instrument called MOXIE made oxygen from the carbon dioxide in Mars' air.",
    ],
    discovery:
      "Perseverance reached the rock! A sample nicknamed \"Cheyava Falls\" contains potential signs of past life, but scientists say more study is needed.",
    epilogue:
      "Perseverance is still exploring. Ingenuity's mission ended on Jan. 25, 2024, after 72 flights, and it rests in Jezero Crater.",
  },
};

/** Days between two ISO dates (used for real cruise lengths). */
export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

/** Journey to Mars chapters: real launch and landing dates and rockets (all launched from Cape Canaveral). */
export const CRUISES = [
  { mission: MISSIONS.pathfinder, launch: "1996-12-04", land: "1997-07-04", difficulty: 0, rocket: "delta" as const, rocketName: "Delta II" },
  { mission: MISSIONS.spirit, launch: "2003-06-10", land: "2004-01-03", difficulty: 1, rocket: "delta" as const, rocketName: "Delta II" },
  { mission: MISSIONS.perseverance, launch: "2020-07-30", land: "2021-02-18", difficulty: 2, rocket: "atlas" as const, rocketName: "Atlas V" },
].map((c) => ({ ...c, days: daysBetween(c.launch, c.land) }));

/** Small, safe localStorage helpers for saving campaign progress in this browser. */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

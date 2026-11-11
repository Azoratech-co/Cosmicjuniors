import { getTopic, type Topic } from "./cosmo/knowledge";

// The machines on the Explorers pages. Every sentence here comes from Cosmo's verified notes
// (lib/cosmo/knowledge.ts) or a NASA page checked in Nov 2026 (launch and landing dates).

export type World = "mars" | "moon";

export interface Explorer {
  id: string;
  name: string;
  /** Big playful title on the explorer page. */
  title: string;
  tagline: string;
  kind: "Rover" | "Lander" | "Landing site";
  world: World;
  /** Short line on the explorers list. */
  cardLine: string;
  badge: string;
  meet: string;
  dates: { label: string; value: string }[];
  job: string;
  /** [topic id, fact index] picks shown as numbered discoveries. */
  facts: [string, number][];
  /** Topic used for the photo and "where it is now". */
  main: string;
  storyId?: "sojourner" | "spirit";
}

export const EXPLORERS: Explorer[] = [
  {
    id: "sojourner",
    name: "Sojourner",
    title: "Sojourner Rover",
    tagline: "The little explorer who made history on Mars",
    kind: "Rover",
    world: "mars",
    cardLine: "1997 • First rover on Mars",
    badge: "Hello from Mars!",
    meet: "Meet Sojourner! It rode to Mars inside the Mars Pathfinder lander, which landed on July 4, 1997, in Ares Vallis, an ancient flood plain. Sojourner was the first rover to drive on another planet.",
    dates: [
      { label: "Launch", value: "Dec. 4, 1996" },
      { label: "Landing", value: "July 4, 1997" },
    ],
    job: "Drive across Mars, take pictures, and study rocks and soil. The mission made more than 15 chemical analyses of Martian rocks and soil.",
    facts: [["pathfinder", 2], ["pathfinder", 3], ["pathfinder-tps", 1], ["pathfinder", 4], ["pathfinder-tps", 0]],
    main: "pathfinder",
    storyId: "sojourner",
  },
  {
    id: "spirit",
    name: "Spirit",
    title: "Spirit Rover",
    tagline: "The rover that kept going for six years",
    kind: "Rover",
    world: "mars",
    cardLine: "2004 • Explored Gusev crater",
    badge: "Hello from Gusev!",
    meet: "Meet Spirit! It landed inside Gusev crater on Jan. 3, 2004. It was planned to work for 90 Martian days, but it lasted more than six years.",
    dates: [
      { label: "Launch", value: "June 10, 2003" },
      { label: "Landing", value: "Jan. 3, 2004" },
    ],
    job: "Explore Gusev crater and study its rocks and soil. Spirit found nearly pure silica, a clue that Mars once had hot springs or steam vents and was much wetter.",
    facts: [["spirit", 2], ["spirit", 3], ["spirit", 4]],
    main: "spirit",
    storyId: "spirit",
  },
  {
    id: "opportunity",
    name: "Opportunity",
    title: "Opportunity Rover",
    tagline: "The marathon runner of Mars",
    kind: "Rover",
    world: "mars",
    cardLine: "2004 • Drove more than a marathon",
    badge: "Hello from Meridiani!",
    meet: "Meet Opportunity! It landed in Meridiani Planum, inside Eagle crater, in January 2004. It was planned to last 90 Martian days, but it worked for almost 15 years.",
    dates: [
      { label: "Launch", value: "July 7, 2003" },
      { label: "Landing", value: "Jan. 24, 2004" },
    ],
    job: "Explore Meridiani Planum and study its rocks. Opportunity found evidence that Mars may once have been able to support microbial life.",
    facts: [["opportunity", 2], ["opportunity", 3], ["opportunity", 4], ["perseverance", 2]],
    main: "opportunity",
  },
  {
    id: "insight",
    name: "InSight",
    title: "InSight",
    tagline: "The Marsquake Listener",
    kind: "Lander",
    world: "mars",
    cardLine: "The Marsquake Listener",
    badge: "Listening to Mars",
    meet: "Meet InSight! It landed on Nov. 26, 2018, on a flat plain called Elysium Planitia, near the equator.",
    dates: [
      { label: "Launch", value: "May 5, 2018" },
      { label: "Landing", value: "Nov. 26, 2018" },
    ],
    job: "Study the deep inside of Mars, checking the planet's \"vital signs\": its pulse, temperature and reflexes.",
    facts: [["insight", 2], ["insight", 3]],
    main: "insight",
  },
  {
    id: "phoenix",
    name: "Phoenix",
    title: "Phoenix",
    tagline: "The Ice Detective",
    kind: "Lander",
    world: "mars",
    cardLine: "The Ice Detective",
    badge: "Hello from the far north!",
    meet: "Meet Phoenix! It landed on May 25, 2008, in a place called the Green Valley of Vastitas Borealis, in Mars' far north.",
    dates: [
      { label: "Launch", value: "Aug. 4, 2007" },
      { label: "Landing", value: "May 25, 2008" },
    ],
    job: "Dig into the far north of Mars. Phoenix confirmed that there is water ice under the Martian surface.",
    facts: [["phoenix", 3], ["phoenix", 4], ["mars-missions-tps", 2]],
    main: "phoenix",
  },
  {
    id: "lunar-rover",
    name: "Lunar Roving Vehicle",
    title: "Lunar Rover",
    tagline: "The car astronauts drove on the Moon",
    kind: "Rover",
    world: "moon",
    cardLine: "Driven on Apollo 15, 16 and 17",
    badge: "Parked on the Moon",
    meet: "Meet the Lunar Roving Vehicle! Three of these rovers were driven on the Moon: on Apollo 15, Apollo 16 and Apollo 17.",
    dates: [{ label: "Missions", value: "Apollo 15, 16 and 17" }],
    job: "Carry astronauts, tools and samples across the Moon.",
    facts: [["lrv", 1], ["lrv", 2], ["lrv", 3], ["lrv", 4]],
    main: "lrv",
  },
  {
    id: "surveyor-3",
    name: "Surveyor 3",
    title: "Surveyor 3",
    tagline: "The robot that astronauts came back to visit",
    kind: "Lander",
    world: "moon",
    cardLine: "1967 • Visited by Apollo 12",
    badge: "Hello from the Moon!",
    meet: "Meet Surveyor 3! This robot lander with no crew landed on the Moon on April 20, 1967. It came to rest on a slope inside a small crater in the Ocean of Storms.",
    dates: [
      { label: "Launch", value: "April 17, 1967" },
      { label: "Landing", value: "April 20, 1967" },
    ],
    job: "Test the Moon's ground and take pictures. Surveyor 3 dug trenches up to 18 cm deep, and its TV camera sent back 6,326 pictures.",
    facts: [["surveyor3", 3], ["surveyor3", 4], ["surveyor3", 5]],
    main: "surveyor3",
  },
  {
    id: "tranquility-base",
    name: "Apollo 11 site",
    title: "Tranquility Base",
    tagline: "Where people first set foot on the Moon",
    kind: "Landing site",
    world: "moon",
    cardLine: "1969 • The Apollo 11 landing site",
    badge: "We came in peace",
    meet: "Meet Tranquility Base! The Apollo 11 lunar module Eagle landed here on July 20, 1969, in the Sea of Tranquility.",
    dates: [
      { label: "Launch", value: "July 16, 1969" },
      { label: "Landing", value: "July 20, 1969" },
    ],
    job: "The astronauts set up experiments, including a passive seismometer to measure moonquakes, a lunar dust detector and laser mirrors.",
    facts: [["apollo11", 4], ["apollo11-tps", 0], ["apollo11-tps", 2], ["flags", 1], ["apollo11-tps", 3]],
    main: "apollo11",
  },
];

export const getExplorer = (id: string) => EXPLORERS.find((e) => e.id === id);

/** The numbered discoveries, each with the page it came from. */
export function explorerFacts(e: Explorer) {
  return e.facts.map(([tid, i]) => {
    const t = getTopic(tid) as Topic;
    return { text: t.facts[i], source: t.title, publisher: t.publisher, url: t.url };
  });
}

/** Every page this explorer's facts came from (for the "Official sources" box). */
export function explorerSources(e: Explorer) {
  const ids = [e.main, ...e.facts.map(([t]) => t)];
  const seen = new Set<string>();
  return ids
    .map((id) => getTopic(id) as Topic)
    .filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
    .map((t) => ({ title: t.title, publisher: t.publisher, url: t.url }));
}

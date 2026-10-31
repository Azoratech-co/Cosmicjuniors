// Verified NASA reference notes. Every fact below was taken from the linked NASA page
// (checked October 2026). Sojourner answers from these notes and cites the page, so kids
// always see where a fact comes from. To add a topic: copy the facts from a NASA page,
// add the page URL, and pick a public-domain image from https://images.nasa.gov.

export interface NasaImage {
  src: string;
  alt: string;
  credit: string;
  nasaId: string;
}

export interface Topic {
  id: string;
  /** Lowercase words or phrases that point to this topic. */
  keywords: string[];
  title: string;
  publisher: string;
  url: string;
  facts: string[];
  image: NasaImage;
}

const img = (nasaId: string, file: string, alt: string, credit: string): NasaImage => ({
  nasaId,
  src: `https://images-assets.nasa.gov/image/${nasaId}/${file}`,
  alt,
  credit,
});

export const TOPICS: Topic[] = [
  {
    id: "pathfinder",
    keywords: ["sojourner", "pathfinder", "first rover", "first mars rover", "ares vallis", "1997"],
    title: "Mars Pathfinder",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/mars-pathfinder/",
    facts: [
      "Mars Pathfinder launched on Dec. 4, 1996, and landed on Mars on July 4, 1997, in Ares Vallis, an ancient flood plain.",
      "It carried Sojourner, the first rover to drive on another planet.",
      "Sojourner weighed 10.6 kilograms (23 pounds) and stood about 30 centimeters (1 foot) tall.",
      "The rover was named after Sojourner Truth, the American civil-rights crusader. The lander was named the Carl Sagan Memorial Station.",
      "The Pathfinder lander took more than 16,500 pictures. The Sojourner rover took 550 pictures of its own.",
      "The mission made more than 15 chemical analyses of Martian rocks and soil.",
      "The last data from the mission arrived on Sept. 27, 1997.",
    ],
    image: img("PIA04318", "PIA04318~orig.jpg", "Sojourner rover next to rocks on Mars", "NASA/JPL"),
  },
  {
    id: "mars",
    keywords: ["mars", "red planet", "martian", "olympus mons", "phobos", "deimos", "sol"],
    title: "Mars: Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mars/facts/",
    facts: [
      "Mars looks red because iron minerals in its dirt oxidize, or rust.",
      "Mars is about half the size of Earth, with a radius of 3,390 km (2,106 miles).",
      "A day on Mars (called a sol) lasts 24.6 hours. A Mars year lasts 687 Earth days.",
      "Mars is on average 228 million km (142 million miles) from the Sun. Sunlight takes about 13 minutes to get there.",
      "Mars has two small moons, Phobos and Deimos, which may be captured asteroids.",
      "Olympus Mons on Mars is the largest volcano in the solar system: more than 40 km (25 miles) tall, with a base about the size of Arizona.",
      "Temperatures on Mars range from about 20°C (70°F) down to about -153°C (-225°F).",
    ],
    image: img("PIA00407", "PIA00407~small.jpg", "Mars seen from orbit by Viking", "NASA/JPL"),
  },
  {
    id: "perseverance",
    keywords: ["perseverance", "ingenuity", "helicopter", "jezero", "rover today", "still driving", "rovers", "moxie", "sample", "life on mars"],
    title: "Mars 2020: Perseverance Rover",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/mars-2020-perseverance/",
    facts: [
      "Perseverance launched on July 30, 2020, and landed in Jezero Crater on Feb. 18, 2021.",
      "Its job is to look for signs of ancient microbial life and collect rock samples that could one day come back to Earth.",
      "As of Oct. 11, 2026, Perseverance had driven 45.22 km (28.10 miles), beating the off-world driving record held by NASA's Opportunity rover.",
      "A rock sample nicknamed \"Cheyava Falls\" contains potential signs of past life, but scientists say more study is needed before drawing any conclusion.",
      "The Ingenuity helicopter flew 72 times and was the first aircraft to make a powered, controlled flight on another planet.",
      "An instrument called MOXIE made oxygen from the carbon dioxide in Mars' air.",
    ],
    image: img("PIA24542", "PIA24542~small.jpg", "Perseverance rover selfie with the Ingenuity helicopter", "NASA/JPL-Caltech/MSSS"),
  },
  {
    id: "moon",
    keywords: ["moon", "lunar", "phases", "crescent", "full moon", "apollo", "tides", "moonwalk"],
    title: "Earth's Moon: Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/moon/facts/",
    facts: [
      "The Moon is on average 384,400 km (238,855 miles) from Earth.",
      "The Moon's radius is about 1,740 km (1,080 miles), less than a third of Earth's width.",
      "Moon phases happen because, as the Moon orbits Earth, we see different amounts of its sunlit side.",
      "The same side of the Moon always faces Earth, because it spins once for every trip around us.",
      "Gravity on the Moon's surface is one-sixth of Earth's.",
      "The Moon is the only place beyond Earth that humans have visited so far.",
    ],
    image: img("as11-40-5903", "as11-40-5903~small.jpg", "Buzz Aldrin on the Moon during Apollo 11", "NASA"),
  },
  {
    id: "artemis",
    keywords: ["artemis", "orion", "sls", "back to the moon", "south pole", "moon base", "astronauts to the moon", "wiseman", "koch", "glover", "hansen"],
    title: "Artemis",
    publisher: "NASA",
    url: "https://www.nasa.gov/humans-in-space/artemis/",
    facts: [
      "Artemis I was an uncrewed test flight of the SLS rocket and Orion spacecraft in November 2022.",
      "Artemis II launched in April 2026: a nearly 10-day crewed flight around the Moon, the first with astronauts aboard Orion.",
      "The Artemis II crew was Reid Wiseman, Victor Glover and Christina Koch of NASA, and Jeremy Hansen of the Canadian Space Agency.",
      "NASA plans its first crewed Moon landing under Artemis for 2028, on Artemis IV.",
      "NASA plans a first lunar outpost near the Moon's South Pole.",
      "Artemis is also a step toward the first crewed missions to Mars.",
    ],
    image: img("art002e021278", "art002e021278~small.jpg", "Earth setting behind the Moon, photographed from Orion on Artemis II", "NASA"),
  },
  {
    id: "saturn",
    keywords: ["saturn", "rings", "ring", "titan", "enceladus", "cassini"],
    title: "Saturn: Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/saturn/facts/",
    facts: [
      "Saturn's rings are made of billions of chunks of ice and rock, from tiny grains to pieces as big as houses.",
      "The rings stretch up to 282,000 km (175,000 miles) from the planet, but the main rings are only about 10 meters (30 feet) thick.",
      "Saturn is the only planet less dense than water, so it would float in a big enough bathtub.",
      "Saturn has 274 confirmed moons, more than any other planet (as of March 2025).",
      "A day on Saturn lasts 10.7 hours. A year lasts about 29.4 Earth years.",
      "Saturn is about 9 times wider than Earth.",
    ],
    image: img("PIA06193", "PIA06193~small.jpg", "Saturn and its rings photographed by Cassini", "NASA/JPL/Space Science Institute"),
  },
  {
    id: "jupiter",
    keywords: ["jupiter", "great red spot", "europa", "io", "ganymede", "callisto", "juno", "biggest planet", "largest planet"],
    title: "Jupiter: Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/jupiter/facts/",
    facts: [
      "Jupiter is 11 times wider than Earth, the largest planet in our solar system.",
      "Jupiter has the shortest day of any planet: 9.9 hours. A year there is about 12 Earth years.",
      "The Great Red Spot is a storm about twice as wide as Earth, watched for more than 300 years.",
      "Jupiter has 115 officially recognized moons. The four biggest are Io, Europa, Ganymede and Callisto.",
      "Like the Sun, Jupiter is made mostly of hydrogen and helium.",
    ],
    image: img("PIA22965", "PIA22965~small.jpg", "Jupiter's clouds photographed by the Juno spacecraft", "NASA/JPL-Caltech/SwRI/MSSS"),
  },
  {
    id: "sun",
    keywords: ["sun", "solar", "star", "sunlight", "hot", "sunspot"],
    title: "The Sun: Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/sun/facts/",
    facts: [
      "The Sun is a yellow dwarf star, a huge ball of hydrogen and helium held together by its own gravity.",
      "The Sun is about 4.6 billion years old.",
      "The Sun is about 100 times wider than Earth and more than 330,000 times as massive.",
      "The Sun is about 150 million km (93 million miles) from Earth.",
      "The Sun's core is about 15 million °C (27 million °F). The surface we see is about 5,500 °C (10,000 °F).",
    ],
    image: img("PIA26681", "PIA26681~small.jpg", "The Sun seen by NASA's Solar Dynamics Observatory", "NASA/SDO"),
  },
  {
    id: "iss",
    keywords: ["space station", "iss", "astronaut", "astronauts", "orbit earth", "sunrise", "sunrises", "live in space", "eat in space", "sleep in space"],
    title: "Space Station Facts and Figures",
    publisher: "NASA",
    url: "https://www.nasa.gov/international-space-station/space-station-facts-and-figures/",
    facts: [
      "The International Space Station travels about 8 km (5 miles) every second.",
      "It circles Earth about every 90 minutes: 16 orbits a day.",
      "That means astronauts on board see 16 sunrises and 16 sunsets every day.",
      "The station is 109 meters (356 feet) end to end.",
      "People have lived on the station without a break since November 2000.",
    ],
    image: img("s118e09341", "s118e09341~small.jpg", "The International Space Station above Earth's horizon", "NASA"),
  },
  {
    id: "blackholes",
    keywords: ["black hole", "black holes", "sagittarius", "event horizon", "gravity"],
    title: "Black Holes",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/black-holes/",
    facts: [
      "A black hole is a huge amount of matter packed into a very small space. Its gravity is so strong that not even light can escape.",
      "Some black holes form when very massive stars run out of fuel and explode as supernovae.",
      "The black hole at the center of our galaxy, Sagittarius A*, has about 4 million times the Sun's mass.",
      "The nearest known black hole, Gaia BH1, is about 1,500 light-years away.",
      "Black holes don't suck things in like a vacuum. From far away, their gravity works like any other object with the same mass.",
    ],
    image: img("PIA23122", "PIA23122~small.jpg", "Galaxy Messier 87, home of a giant black hole, seen by Spitzer", "NASA/JPL-Caltech"),
  },
  {
    id: "webb",
    keywords: ["webb", "jwst", "telescope", "galaxy", "galaxies", "nebula", "infrared", "deep space", "universe"],
    title: "James Webb Space Telescope",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/webb/",
    facts: [
      "The James Webb Space Telescope launched on Dec. 25, 2021.",
      "Webb orbits the Sun about 1.5 million km (1 million miles) from Earth, at a spot called L2.",
      "Webb sees in infrared light, which lets it look through dust and see very distant galaxies.",
      "A five-layer sunshield keeps Webb cold, with protection NASA compares to \"SPF 1 million\".",
      "Webb's first science images were released in July 2022.",
    ],
    image: img("carina_nebula", "carina_nebula~small.jpg", "The Cosmic Cliffs in the Carina Nebula, seen by Webb", "NASA, ESA, CSA, STScI"),
  },
];

const byId = new Map(TOPICS.map((t) => [t.id, t]));

export function getTopic(id: string): Topic | undefined {
  return byId.get(id);
}

/** Pick the topics most related to the conversation (latest question counts most). */
export function findTopics(question: string, context = "", limit = 2): Topic[] {
  const q = ` ${question.toLowerCase()} `;
  const c = ` ${context.toLowerCase()} `;
  const scored = TOPICS.map((t) => {
    let score = 0;
    for (const k of t.keywords) {
      const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (re.test(q)) score += 3 + k.split(" ").length;
      else if (re.test(c)) score += 1;
    }
    return { t, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.t);
}

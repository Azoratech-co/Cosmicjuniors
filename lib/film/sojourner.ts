import type { Scene } from "./types";

// The Sojourner film: the team's story ("Sojourner: The Journey Through the Stars"), cut into short
// scenes for the scrolling player. Every narration line comes from content/stories.json (already
// checked against NASA), shortened for reading aloud. Photos are real NASA/JPL images; `credit`
// is shown on screen.
//
// Narration audio: drop files named 01.mp3, 02.mp3 … (scene number, two digits) into
// public/film/sojourner/audio/. Any scene without a file is read by the browser's voice.

const P = "/film/sojourner/";

export const SOJOURNER_FILM: Scene[] = [
  { kind: "title", chapter: 0, text: "Sojourner: The Journey Through the Stars." },

  { kind: "chapter", chapter: 1, title: "The Journey Through the Stars", text: "Chapter one. The Journey Through the Stars." },
  {
    kind: "pad", chapter: 1,
    text: "Beyond the blue skies of Earth, a powerful rocket stood ready for one of humanity's most ambitious journeys.",
    ask: "What rocket launched Mars Pathfinder?",
  },
  {
    kind: "inside", chapter: 1,
    text: "At its top rested a spacecraft carrying a small but remarkable explorer: Sojourner, folded safely inside the Mars Pathfinder lander.",
    ask: "How did Sojourner fit inside the Pathfinder lander?",
  },
  {
    kind: "kenburns", chapter: 1, image: P + "pia04754.jpg", from: [1.05, 0.5, 0.75], to: [1.25, 0.5, 0.35], glow: true,
    credit: "The real launch · Cape Canaveral, Dec. 4, 1996 · NASA/JPL PIA04754",
    text: "On December 4, 1996, flames roared beneath the rocket as it lifted away from Earth.",
    ask: "When did Mars Pathfinder launch?",
  },
  { kind: "ascent", chapter: 1, text: "Within moments, the blue sky gave way to the deep, endless blackness of space." },
  {
    kind: "cruise", chapter: 1,
    text: "For nearly seven months the spacecraft travelled through space, while engineers on Earth kept it on the right path to Mars.",
    ask: "How long did it take Pathfinder to fly to Mars?",
  },
  { kind: "approach", chapter: 1, text: "As months passed, Mars grew closer: no longer a distant point, but a world waiting to be explored." },

  { kind: "chapter", chapter: 2, title: "The Red Planet Awakens", text: "Chapter two. The Red Planet Awakens." },
  {
    kind: "entry", chapter: 2,
    text: "On July 4, 1997, Mars Pathfinder plunged into the thin Martian air at tremendous speed, protected by its heat shield.",
    ask: "Why did Pathfinder need a heat shield?",
  },
  { kind: "parachute", chapter: 2, text: "Then came the parachute. The heat shield was released, and the lander hung beneath it on a tether." },
  {
    kind: "airbags", chapter: 2,
    text: "As the ground rushed closer, enormous airbags inflated around the lander to absorb the force of impact.",
    ask: "How did Pathfinder's airbags work?",
  },
  { kind: "bounce", chapter: 2, text: "It struck the surface and bounced. Once, twice, and again and again: about fifteen times." },
  {
    kind: "kenburns", chapter: 2, image: P + "pia00621.jpg", from: [1.15, 0.15, 0.5], to: [1.15, 0.85, 0.5], dust: true,
    credit: "Ares Vallis, photographed by the Pathfinder lander · NASA/JPL PIA00621",
    text: "And for a moment, the landscape seemed untouched by time: reddish dust, scattered rocks, and a pale, hazy sky.",
    ask: "Why did NASA land Pathfinder in Ares Vallis?",
  },

  { kind: "chapter", chapter: 3, title: "A World Waiting to Be Explored", text: "Chapter three. A World Waiting to Be Explored." },
  {
    kind: "transmission", chapter: 3, image: P + "pia00611.jpg", stamp: "Mars Pathfinder · July 1997",
    credit: "Sojourner on the lander's petal, with an airbag beside it · NASA/JPL PIA00611",
    text: "The lander's petals unfolded, but the landing had not gone perfectly: one airbag had not pulled back completely, and it blocked Sojourner's ramp.",
  },
  {
    kind: "signal", chapter: 3, dir: "toMars", label: "Commands from Earth",
    text: "Engineers on Earth studied the pictures and worked toward a solution. Every command had to travel the enormous distance to Mars.",
  },
  {
    kind: "transmission", chapter: 3, image: P + "pia00633.jpg", stamp: "Sojourner camera · Sol 3", gray: true,
    credit: "Sojourner's own wheel tracks in the Martian soil · NASA/JPL PIA00633",
    text: "On the night of July 5, 1997, Sojourner rolled down the ramp. For the first time, a wheeled robot was exploring another planet.",
    ask: "When did Sojourner roll onto Mars?",
  },

  { kind: "chapter", chapter: 4, title: "First Steps Across Mars", text: "Chapter four. First Steps Across Mars." },
  {
    kind: "kenburns", chapter: 4, image: "/figma/home-storyline.png", from: [1.0, 0.5, 0.5], to: [1.18, 0.42, 0.55], measure: true,
    credit: "Illustration by the Cosmic Juniors team",
    text: "Sojourner stood only about thirty centimetres tall and weighed about 10.6 kilograms.",
    ask: "How big was Sojourner?",
  },
  {
    kind: "crawl", chapter: 4,
    text: "It moved slowly, about one centimetre per second. One small mistake on an unfamiliar world could create a serious problem.",
  },
  {
    kind: "signal", chapter: 4, dir: "relay", label: "Rover → lander → Earth",
    text: "Sojourner could not talk to Earth directly. The lander relayed its messages to the large radio antennas back home.",
    ask: "How did Sojourner send messages to Earth?",
  },

  { kind: "chapter", chapter: 5, title: "The Secrets Hidden in the Rocks", text: "Chapter five. The Secrets Hidden in the Rocks." },
  {
    kind: "transmission", chapter: 5, image: P + "pia04318.jpg", stamp: "Ares Vallis · the Rock Garden", gray: true,
    credit: "Sojourner near the \"Rock Garden\" · NASA/JPL PIA04318",
    text: "Every rock could hold clues about the history of Mars.",
  },
  {
    kind: "transmission", chapter: 5, image: P + "pia00766.jpg", stamp: "Mars Pathfinder · Sojourner and Yogi",
    credit: "Sojourner next to the rock named Yogi · NASA/JPL PIA00766",
    text: "Sojourner pressed its APXS instrument against rocks with names like Barnacle Bill, Yogi, Scooby Doo and Chimp, to find out what they were made of.",
    ask: "What did Sojourner's APXS instrument do?",
  },
  {
    kind: "kenburns", chapter: 5, image: P + "pia00621.jpg", from: [1.3, 0.7, 0.55], to: [1.12, 0.4, 0.5], water: true,
    credit: "Ares Vallis · NASA/JPL PIA00621",
    text: "Rounded pebbles suggested that, long ago, water had once moved through this part of Mars.",
    ask: "Did water once flow at Ares Vallis?",
  },

  { kind: "chapter", chapter: 6, title: "The Challenges of an Unfamiliar World", text: "Chapter six. The Challenges of an Unfamiliar World." },
  {
    kind: "signal", chapter: 6, dir: "both", label: "Several minutes each way",
    text: "A radio signal could take several minutes to travel between Earth and Mars, so every drive had to be planned in advance.",
    ask: "How long does a radio signal take between Earth and Mars?",
  },

  { kind: "chapter", chapter: 7, title: "A Mission That Outlived Its Expectations", text: "Chapter seven. A Mission That Outlived Its Expectations." },
  {
    kind: "days", chapter: 7,
    text: "Sojourner was built for a seven-day mission. It kept exploring for eighty-three days.",
    ask: "How long did Sojourner's mission last?",
  },

  { kind: "chapter", chapter: 8, title: "The Silence Begins", text: "Chapter eight. The Silence Begins." },
  {
    kind: "kenburns", chapter: 8, image: P + "pia07453.jpg", from: [1.0, 0.0, 0.5], to: [1.0, 1.0, 0.5], wide: true,
    credit: "A Martian sunset photographed by Pathfinder · NASA/JPL PIA07453",
    text: "On September 27, 1997, the last data arrived from Pathfinder. Sojourner had just studied a rock named Chimp.",
  },
  { kind: "silence", chapter: 8, text: "On October 7, Earth heard from Pathfinder for the last time." },

  { kind: "chapter", chapter: 9, title: "The Explorer Without a Voice", text: "Chapter nine. The Explorer Without a Voice." },
  {
    kind: "kenburns", chapter: 9, image: P + "pia26718.jpg", from: [1.05, 0.5, 0.75], to: [1.2, 0.5, 0.6], listen: true,
    credit: "A NASA Deep Space Network antenna at Goldstone, California · NASA/JPL PIA26718",
    text: "Engineers kept trying for months. On March 10, 1998, NASA listened one last time. No signal came.",
    ask: "What happened to Sojourner after contact was lost?",
  },

  { kind: "chapter", chapter: 10, title: "What Remains on Mars", text: "Chapter ten. What Remains on Mars." },
  {
    kind: "kenburns", chapter: 10, image: P + "pia09105.jpg", from: [1.0, 0.5, 0.5], to: [1.6, 0.5, 0.5], gray: true,
    credit: "The Pathfinder landing site and its surroundings, seen from orbit · NASA/JPL PIA09105",
    text: "Today, Sojourner remains at the Pathfinder landing site on Mars. No spacecraft ever came to bring it home.",
    ask: "Where is Sojourner now?",
  },
  {
    kind: "kenburns", chapter: 10, image: "/figma/home-wiki.png", from: [1.0, 0.5, 0.5], to: [1.15, 0.5, 0.45],
    credit: "Illustration by the Cosmic Juniors team",
    text: "Its journey prepared the way for the rovers that followed: Spirit, Opportunity, Curiosity and Perseverance.",
    ask: "Which rovers came after Sojourner?",
  },
  { kind: "end", chapter: 10, text: "Somewhere on Mars, the little rover remains. Abandoned. But never forgotten." },
];

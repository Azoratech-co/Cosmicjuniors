import type { StoryScene } from "./types";

// The Sojourner story as one continuous scroll: a framed picture (or video) in the middle of a
// starry background, with the story's lines scrolling through it. Every line comes from
// content/stories.json (already checked against NASA), shortened. Pictures are real NASA/JPL
// images unless marked as the team's illustrations.
//
// Videos: when the team's clip for a scene is ready, put it in public/story/sojourner/ and set
// `video` (e.g. video: "05.mp4"). The picture stays as the poster until the clip plays.

const S = "/story/sojourner/";

export const SOJOURNER_SCENES: StoryScene[] = [
  { chapter: 0, card: true },

  { chapter: 1, card: true },
  {
    chapter: 1, image: S + "prep.jpg", fit: "contain", credit: "Workers take a final look at Mars Pathfinder before it is sealed in the rocket · NASA",
    text: "Beyond the blue skies of Earth, a powerful rocket stood ready for one of humanity's most ambitious journeys.",
    ask: "What rocket launched Mars Pathfinder?",
  },
  {
    chapter: 1, image: S + "spacecraft.jpg", fit: "contain", credit: "The Mars Pathfinder spacecraft at Kennedy Space Center, 1996 · NASA",
    text: "At its top rested a spacecraft carrying a small but remarkable explorer: Sojourner, folded safely inside the Mars Pathfinder lander.",
    ask: "How did Sojourner fit inside the Pathfinder lander?",
  },
  {
    chapter: 1, image: S + "launch.jpg", fit: "contain", credit: "The real launch, Cape Canaveral, Dec. 4, 1996 · NASA/JPL",
    text: "On December 4, 1996, flames roared beneath the rocket as it lifted away from Earth.",
    ask: "When did Mars Pathfinder launch?",
  },
  {
    chapter: 1, image: S + "earth.jpg", fit: "contain", credit: "Earth from space, photographed by the Apollo 17 crew · NASA",
    text: "Within moments, the blue sky gave way to the deep, endless blackness of space, and Earth became a blue sphere wrapped in white clouds.",
  },
  {
    chapter: 1, image: S + "mars.jpg", fit: "contain", zoom: [0.55, 0.8], credit: "Mars in color, from Viking orbiter images · NASA/JPL",
    text: "For nearly seven months the spacecraft travelled through space. As months passed, Mars grew closer.",
    ask: "How long did it take Pathfinder to fly to Mars?",
  },

  { chapter: 2, card: true },
  {
    chapter: 2, image: S + "mars-canyon.jpg", fit: "contain", zoom: [0.9, 1.25], credit: "Mars from space · NASA/JPL",
    text: "On July 4, 1997, Mars Pathfinder plunged into the thin Martian air at tremendous speed, protected by its heat shield.",
    ask: "Why did Pathfinder need a heat shield?",
  },
  {
    chapter: 2, image: S + "parachute-test.jpg", credit: "A Mars parachute being tested on Earth · NASA/JPL",
    text: "Then came the parachute. The heat shield was released, and the lander hung beneath it on a tether.",
  },
  {
    chapter: 2, image: S + "airbags-test.jpg", credit: "Engineers test Pathfinder's multi-lobed airbags on Earth · NASA",
    text: "As the ground rushed closer, enormous airbags inflated around the lander to absorb the force of impact.",
    ask: "How did Pathfinder's airbags work?",
  },
  {
    chapter: 2, image: S + "landed.jpg", credit: "Pathfinder on Mars, July 4, 1997, with Sojourner still on its petal · NASA/JPL",
    text: "It struck the surface and bounced. Once, twice, and again and again: about fifteen times.",
  },
  {
    chapter: 2, image: S + "panorama.jpg", fit: "pan", credit: "The first 360° panorama of the landing site · NASA/JPL",
    text: "And for a moment, the landscape seemed untouched by time: reddish dust, scattered rocks, and a pale, hazy sky.",
    ask: "Why did NASA land Pathfinder in Ares Vallis?",
  },

  { chapter: 3, card: true },
  {
    chapter: 3, image: S + "lander-airbags.jpg", credit: "Sojourner on the lander's petal, with an airbag beside it · NASA/JPL",
    text: "The lander's petals unfolded, but the landing had not gone perfectly: one airbag had not pulled back completely, and it blocked Sojourner's ramp.",
  },
  {
    chapter: 3, image: S + "petals-test.jpg", credit: "A JPL test of the lander with open petals and deflated airbags · NASA/JPL",
    text: "Engineers on Earth studied the pictures and worked toward a solution. Every command had to travel the enormous distance to Mars.",
  },
  {
    chapter: 3, image: S + "tracks.jpg", fit: "contain", gray: true, credit: "Sojourner's own wheel tracks in the Martian soil, Sol 3 · NASA/JPL",
    text: "On the night of July 5, 1997, Sojourner rolled down the ramp. For the first time, a wheeled robot was exploring another planet.",
    ask: "When did Sojourner roll onto Mars?",
  },

  { chapter: 4, card: true },
  {
    chapter: 4, image: "/figma/home-storyline.png", credit: "Illustration by the Cosmic Juniors team",
    text: "Sojourner stood only about thirty centimetres tall and weighed about 10.6 kilograms.",
    ask: "How big was Sojourner?",
  },
  {
    chapter: 4, image: S + "rock-garden.jpg", fit: "contain", gray: true, credit: "Sojourner near the \"Rock Garden\" · NASA/JPL",
    text: "It moved slowly, about one centimetre per second. One small mistake on an unfamiliar world could create a serious problem.",
  },
  {
    chapter: 4, image: S + "dsn.jpg", fit: "contain", credit: "A NASA Deep Space Network antenna at Goldstone, California · NASA/JPL",
    text: "Sojourner could not talk to Earth directly. The lander relayed its messages to the large radio antennas back home.",
    ask: "How did Sojourner send messages to Earth?",
  },

  { chapter: 5, card: true },
  {
    chapter: 5, image: S + "mosaic.jpg", credit: "Sojourner, still on the lander, and the terrain of Ares Vallis on Sol 1 · NASA/JPL",
    text: "Every rock could hold clues about the history of Mars.",
  },
  {
    chapter: 5, image: S + "yogi.jpg", credit: "Sojourner next to the rock named Yogi · NASA/JPL",
    text: "Sojourner pressed its APXS instrument against rocks with names like Barnacle Bill, Yogi, Scooby Doo and Chimp, to find out what they were made of.",
    ask: "What did Sojourner's APXS instrument do?",
  },
  {
    chapter: 5, image: S + "twin-peaks.jpg", credit: "Large boulders at the landing site, a dry flood channel · NASA/JPL",
    text: "Rounded pebbles suggested that, long ago, water had once moved through this part of Mars.",
    ask: "Did water once flow at Ares Vallis?",
  },

  { chapter: 6, card: true },
  {
    chapter: 6, image: S + "yogi-view.jpg", fit: "contain", gray: true, credit: "Yogi, seen through Sojourner's own camera · NASA/JPL",
    text: "A radio signal could take several minutes to travel between Earth and Mars, so every drive had to be planned in advance.",
    ask: "How long does a radio signal take between Earth and Mars?",
  },

  { chapter: 7, card: true },
  {
    chapter: 7, image: S + "panorama.jpg", fit: "pan", panFrom: 0.55, credit: "Ares Vallis, from the Pathfinder lander · NASA/JPL",
    text: "Sojourner was built for a seven-day mission. It kept exploring for eighty-three days.",
    ask: "How long did Sojourner's mission last?",
  },

  { chapter: 8, card: true },
  {
    chapter: 8, image: S + "sunset.jpg", fit: "pan", credit: "A Martian sunset photographed by Pathfinder · NASA/JPL",
    text: "On September 27, 1997, the last data arrived from Pathfinder. Sojourner had just studied a rock named Chimp.",
  },
  {
    chapter: 8, image: S + "sunset-peaks.jpg", fit: "pan", credit: "Sunset over the Twin Peaks, from Pathfinder · NASA/JPL",
    text: "On October 7, Earth heard from Pathfinder for the last time.",
  },

  { chapter: 9, card: true },
  {
    chapter: 9, image: S + "dsn.jpg", fit: "contain", zoom: [1.1, 1.3], credit: "NASA's Deep Space Network listening at night · NASA/JPL",
    text: "Engineers kept trying for months. On March 10, 1998, NASA listened one last time. No signal came.",
    ask: "What happened to Sojourner after contact was lost?",
  },

  { chapter: 10, card: true },
  {
    chapter: 10, image: S + "orbit.jpg", gray: true, zoom: [1, 1.35], credit: "The Pathfinder landing site and its surroundings, seen from orbit · NASA/JPL",
    text: "Today, Sojourner remains at the Pathfinder landing site on Mars. No spacecraft ever came to bring it home.",
    ask: "Where is Sojourner now?",
  },
  {
    chapter: 10, image: "/figma/home-wiki.png", credit: "Illustration by the Cosmic Juniors team",
    text: "Its journey prepared the way for the rovers that followed: Spirit, Opportunity, Curiosity and Perseverance.",
    ask: "Which rovers came after Sojourner?",
  },
  {
    chapter: 10, image: S + "landed.jpg", zoom: [1.15, 1.0], credit: "Pathfinder and Sojourner at Ares Vallis · NASA/JPL",
    text: "Somewhere on Mars, the little rover remains. Abandoned. But never forgotten.",
  },
];

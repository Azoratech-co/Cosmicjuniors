// Verified reference notes. Every fact below was taken from the linked page (checked October and
// November 2026): NASA first, plus a few trusted partners (The Planetary Society, the U.S. law text).
// Cosmo answers only from these notes and cites each page it used, so kids always see where a fact
// comes from. To add a topic: copy the facts from one page, add that page's URL, and pick a
// public-domain image from https://images.nasa.gov. One topic = one source page.

export interface NasaImage {
  src: string;
  alt: string;
  credit: string;
  nasaId: string;
}

export type SourceKind = "nasa" | "partner" | "law";

export interface Topic {
  id: string;
  /** Who published the page: NASA, a trusted partner (.org), or official U.S. law. Default "nasa". */
  kind?: SourceKind;
  /** For machines left on the Moon or Mars: where they are today and their status. */
  whereNow?: { place: string; status: string };
  /** For Story mode: the machine that tells this story in first person. */
  voice?: string;
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
    id: "viking",
    keywords: ["viking", "viking 1", "viking 2", "first lander", "first photo", "first picture", "chryse", "utopia planitia", "1976"],
    title: "Viking 1 & 2",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/viking/",
    facts: [
      "Viking 1 landed on Mars on July 20, 1976, at Chryse Planitia. It was the first successful U.S. lander on Mars.",
      "On the day it landed, Viking 1 took the first photograph ever taken from the surface of Mars.",
      "Viking 2 landed on Sept. 3, 1976, at Utopia Planitia, and took the first color picture from the surface.",
      "Viking 1 was planned to work for 90 days but kept going for more than six years. Its last transmission came on Nov. 11, 1982.",
      "Viking 2's last data reached Earth on April 11, 1980.",
      "The Viking landers tested Martian soil for life. They found unexpected chemical activity, but no clear evidence of living microbes.",
    ],
    image: img("PIA00381", "PIA00381~orig.jpg", "The first photograph taken on the surface of Mars, by Viking 1", "NASA/JPL"),
  },
  {
    id: "spirit",
    keywords: ["spirit", "gusev", "home plate", "stuck", "spirit rover", "twin rovers"],
    title: "Spirit Rover",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/mer-spirit/",
    facts: [
      "Spirit landed inside Gusev crater on Jan. 3, 2004.",
      "Spirit was planned to work for 90 Martian days, but it lasted more than six years, over 25 times longer than planned.",
      "Spirit drove about 7.73 km (4.8 miles) across Mars.",
      "In May 2009, Spirit got stuck in soft soil and couldn't free its wheels. NASA turned it into a stationary science station.",
      "NASA last heard from Spirit on March 22, 2010, probably because extreme cold stopped its heaters from working.",
      "Spirit found nearly pure silica, a clue that Mars once had hot springs or steam vents and was much wetter.",
    ],
    image: img("PIA04413", "PIA04413~small.jpg", "Artist's concept of a Mars Exploration Rover like Spirit on Mars", "NASA/JPL"),
  },
  {
    id: "opportunity",
    keywords: ["opportunity", "oppy", "meridiani", "marathon", "eagle crater", "dust storm", "twin rovers", "farthest", "furthest", "drove the most", "longest drive", "driving record", "distance record"],
    title: "Opportunity Rover",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/mer-opportunity/",
    facts: [
      "Opportunity landed in Meridiani Planum, inside Eagle crater, in January 2004.",
      "Opportunity was planned to last 90 Martian days but worked for almost 15 years, about 60 times longer than expected.",
      "In 2015, Opportunity became the first to travel more than a marathon (42.195 km) on another world.",
      "Opportunity drove 45.16 km (28.06 miles) in total.",
      "A huge dust storm in 2018 blocked sunlight from its solar panels. NASA last heard from it on June 10, 2018, and ended the mission on Feb. 13, 2019.",
      "Opportunity found evidence that Mars may once have been able to support microbial life.",
    ],
    image: img("PIA17759", "PIA17759~small.jpg", "Self-portrait taken by the Opportunity rover in January 2014", "NASA/JPL-Caltech/Cornell Univ./Arizona State Univ."),
  },
  {
    id: "insight",
    keywords: ["insight", "marsquake", "marsquakes", "inside of mars", "elysium"],
    title: "InSight Lander",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/insight/",
    facts: [
      "InSight landed on Mars on Nov. 26, 2018, in a flat area called Elysium Planitia, near the equator.",
      "InSight's job was to study the deep inside of Mars, checking the planet's \"vital signs\": its pulse, temperature and reflexes.",
      "InSight listened for marsquakes, which helped scientists learn what the inside of Mars is made of.",
      "InSight's mission ended on Dec. 15, 2022.",
    ],
    image: img("PIA25287", "PIA25287~small.jpg", "InSight lander's final selfie, covered in Martian dust", "NASA/JPL-Caltech"),
  },
  {
    id: "ingenuity",
    keywords: ["ingenuity", "helicopter", "fly on mars", "flight on mars", "drone"],
    title: "Ingenuity Mars Helicopter",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/",
    facts: [
      "On April 19, 2021, Ingenuity made the first powered, controlled flight on another planet.",
      "Ingenuity was designed for up to five test flights in 30 days. It flew 72 times.",
      "Ingenuity flew about 17 km (10.5 miles) in total, for about 128.8 minutes of flight time.",
      "Its highest flight reached 24 meters (78.7 feet), and its top speed was 10 meters per second (22.4 mph).",
      "Ingenuity's last flight was on Jan. 18, 2024, and the mission ended on Jan. 25, 2024, after nearly three years on Mars.",
    ],
    image: img("PIA25970", "PIA25970~small.jpg", "Ingenuity helicopter in flight, seen by the Perseverance rover", "NASA/JPL-Caltech/ASU/MSSS"),
  },
  {
    id: "lrv",
    keywords: ["lunar rover", "lunar roving", "moon car", "moon buggy", "rover on the moon", "drive on the moon", "apollo 15", "apollo 16", "apollo 17", "left on the moon", "leave on the moon", "astronauts left", "astronauts leave"],
    title: "The Apollo Lunar Roving Vehicle",
    publisher: "NASA Space Science Data Coordinated Archive",
    url: "https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html",
    facts: [
      "Three Lunar Roving Vehicles were driven on the Moon: on Apollo 15, Apollo 16 and Apollo 17.",
      "Each rover had a mass of 210 kg and could carry another 490 kg of astronauts, tools and samples.",
      "On Apollo 15, astronauts drove the rover 27.8 km in total.",
      "On Apollo 17, astronauts drove 35.9 km, and their longest trip was 20.1 km.",
      "Four rovers were built: one each for Apollo 15, 16 and 17, and one used for spare parts after later Apollo missions were cancelled.",
    ],
    image: img("as15-86-11603", "as15-86-11603~small.jpg", "Astronaut James Irwin with the Lunar Roving Vehicle on Apollo 15", "NASA"),
  },
  {
    id: "retroreflector",
    keywords: ["retroreflector", "retroreflectors", "mirror on the moon", "mirrors", "laser", "lasers", "apollo 11", "experiment still working", "still working", "left on the moon", "leave on the moon", "astronauts left", "astronauts leave"],
    title: "Retroreflectors: From Apollo to Mars",
    publisher: "NASA",
    url: "https://www.nasa.gov/image-article/retroreflectors-from-apollo-mars/",
    facts: [
      "Apollo 11 astronauts left small arrays of mirrors, called retroreflectors, on the Moon.",
      "Scientists on Earth aim lasers at the mirrors and time how long the light takes to bounce back.",
      "Those measurements gave very precise data about the Moon's orbit and shape.",
      "Scientists are still using the Apollo-era mirrors for research today.",
    ],
    image: img("as11-40-5948", "as11-40-5948~small.jpg", "Buzz Aldrin next to experiments set up on the Moon during Apollo 11", "NASA"),
  },
  // ---------------------------------------------------------------------------------------
  // Left on the Moon: Apollo sites, crash sites and heritage
  // ---------------------------------------------------------------------------------------
  {
    id: "apollo11",
    keywords: ["apollo 11", "tranquility", "tranquility base", "sea of tranquility", "eagle", "armstrong", "aldrin", "first moon landing", "plaque", "seismometer", "1969"],
    title: "Apollo 11 Lunar Module",
    publisher: "NASA Space Science Data Coordinated Archive",
    url: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C",
    whereNow: { place: "Tranquility Base, Sea of Tranquility, Moon", status: "Descent stage, experiments and plaque still there" },
    voice: "the Apollo 11 lunar module Eagle",
    facts: [
      "The Apollo 11 lunar module Eagle landed on July 20, 1969, in the Sea of Tranquility (Mare Tranquilitatis).",
      "The astronauts set up experiments about 17 meters south of the lunar module, including a passive seismometer to measure moonquakes and a lunar dust detector.",
      "They also left a laser ranging retroreflector, about 5 meters from the other experiments.",
      "The astronauts put up an American flag and unveiled a plaque mounted on a strut behind the lander's ladder.",
      "The plaque says: \"Here men from the planet Earth first set foot on the Moon July 1969, A.D. We came in peace for all mankind.\"",
      "The Eagle's landing spot is at 0.67416 degrees north latitude, 23.47314 degrees east longitude.",
    ],
    image: img("as11-40-5874", "as11-40-5874~small.jpg", "Buzz Aldrin beside the flag at Tranquility Base, July 20, 1969", "NASA"),
  },
  {
    id: "apollo11-tps",
    kind: "partner",
    keywords: ["apollo 11", "tranquility base", "moon rocks", "samples", "moon moving away", "moving away", "footprints", "footpaths"],
    title: "Apollo 11",
    publisher: "The Planetary Society",
    url: "https://www.planetary.org/space-missions/apollo-11",
    facts: [
      "Apollo 11 brought 20 kilograms of Moon rock and soil back to Earth.",
      "Apollo 11's seismometer stopped working after 21 days, but its early data was still useful.",
      "Lasers aimed at the Apollo 11 mirrors showed that the Moon moves away from Earth by 3.8 centimeters per year.",
      "NASA's Lunar Reconnaissance Orbiter photographed the Apollo 11 site from 24 kilometers up, showing the astronauts' footpaths, the mirror and the seismometer.",
    ],
    image: img("as11-40-5903", "as11-40-5903~small.jpg", "Buzz Aldrin walking near the leg of the lunar module Eagle", "NASA"),
  },
  {
    id: "surveyor3",
    keywords: ["surveyor", "surveyor 3", "apollo 12", "ocean of storms", "procellarum", "visited", "camera brought back", "conrad", "bean"],
    title: "Surveyor 3",
    publisher: "NASA Space Science Data Coordinated Archive",
    url: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A",
    whereNow: { place: "Ocean of Storms, Moon", status: "Visited by Apollo 12 astronauts in 1969" },
    voice: "the Surveyor 3 lander",
    facts: [
      "Surveyor 3, a robot lander with no crew, launched on April 17, 1967, and landed on the Moon on April 20, 1967.",
      "It came to rest on a slope inside a small crater in the Ocean of Storms (Oceanus Procellarum).",
      "Surveyor 3 dug trenches up to 18 cm deep, and its TV camera sent back 6,326 pictures.",
      "On Nov. 19, 1969, the Apollo 12 lunar module landed about 180 meters from Surveyor 3.",
      "On Nov. 20, 1969, astronauts Pete Conrad and Alan Bean walked over to Surveyor 3 and removed about 10 kg of parts, including its TV camera, to study back on Earth.",
    ],
    image: img("as12-48-7136", "as12-48-7136~small.jpg", "Pete Conrad examines Surveyor 3, with the Apollo 12 lunar module in the background", "NASA"),
  },
  {
    id: "flags",
    keywords: ["flag", "flags", "still standing", "faded", "white", "bleached"],
    title: "Six Flags on the Moon: What Is Their Current Condition?",
    publisher: "NASA Apollo Lunar Surface Journal",
    url: "https://www.nasa.gov/wp-content/uploads/static/history/alsj/ApolloFlags-Condition.html",
    whereNow: { place: "The six Apollo landing sites, Moon", status: "Most still standing, probably faded" },
    voice: "an Apollo flag",
    facts: [
      "Photos from NASA's Lunar Reconnaissance Orbiter show shadows from the flags at the Apollo 12, 16 and 17 sites, which means those flags are still standing on their poles.",
      "There is no flag shadow at the Apollo 11 site. The flag fell over when the lunar module blasted off to leave: Buzz Aldrin wrote, \"I looked up long enough to see the flag fall over.\"",
      "The photos of the Apollo 14 and 15 sites show no clear flag shadow.",
      "Lunar scientist Paul Spudis wrote that the flags have been bleached white by the strong ultraviolet sunlight on the Moon.",
    ],
    image: img("as17-134-20382", "as17-134-20382~small.jpg", "Harrison Schmitt next to the flag at the Apollo 17 site, Dec. 13, 1972", "NASA"),
  },
  {
    id: "fallen-astronaut",
    keywords: ["memorial", "fallen astronaut", "statue", "statuette", "figurine", "apollo 15", "hadley", "remember", "astronauts who died"],
    title: "Memorial to Fallen Astronauts on the Moon",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/resource/memorial-to-fallen-astronauts-on-the-moon/",
    whereNow: { place: "Hadley-Apennine landing site, Moon", status: "Placed on Aug. 2, 1971" },
    voice: "the small memorial figure at Hadley-Apennine",
    facts: [
      "During Apollo 15, astronauts David Scott and James Irwin left a memorial at the Hadley-Apennine landing site.",
      "The memorial is a tiny figurine and a plaque that remember astronauts and cosmonauts who had died.",
      "The plaque lists 14 names in alphabetical order.",
      "NASA dates the memorial to Aug. 2, 1971.",
    ],
    image: img("as15-88-11894", "as15-88-11894~small.jpg", "The memorial plaque and figurine left on the Moon by Apollo 15", "NASA"),
  },
  {
    id: "grail",
    keywords: ["grail", "ebb", "flow", "sally ride", "crash into the moon", "crashed into the moon", "impact", "moonkam", "students"],
    title: "GRAIL Lunar Impact Site Named for Astronaut Sally Ride",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/solar-system/moon/grail-lunar-impact-site-named-for-astronaut-sally-ride/",
    whereNow: { place: "Sally K. Ride Impact Site, Moon", status: "Ended on purpose, Dec. 17, 2012" },
    voice: "the GRAIL twin spacecraft",
    facts: [
      "NASA's two GRAIL spacecraft flew together around the Moon and ended their mission by hitting the Moon on purpose on Dec. 17, 2012.",
      "They hit the Moon at 3,760 mph (1.7 kilometers per second).",
      "The crash site is on a mountain about 1.5 miles (2.5 kilometers) tall, near a crater named Goldschmidt.",
      "NASA named it the Sally K. Ride Impact Site, after America's first woman in space.",
      "Sally Ride led GRAIL's MoonKAM program, where middle school students across the country picked places for the spacecraft cameras to photograph.",
    ],
    image: img("PIA16493", "PIA16493~small.jpg", "Artist's concept of GRAIL's twin spacecraft in their final moments", "NASA/JPL-Caltech"),
  },
  {
    id: "lcross",
    keywords: ["lcross", "cabeus", "centaur", "water on the moon", "ice on the moon", "moon water", "south pole crater"],
    title: "LCROSS",
    publisher: "NASA Space Science Data Coordinated Archive",
    url: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2009-031B",
    whereNow: { place: "Cabeus crater, near the Moon's south pole", status: "Impacted on Oct. 9, 2009" },
    voice: "the LCROSS spacecraft",
    facts: [
      "LCROSS was designed to search for water ice on the Moon.",
      "On Oct. 9, 2009, its empty Centaur rocket stage was steered into Cabeus, a crater near the Moon's south pole.",
      "The LCROSS spacecraft itself followed and hit the Moon a few minutes later.",
      "NASA reported that the LCROSS impact data showed water on the Moon.",
    ],
    image: img("KSC-2009-2914", "KSC-2009-2914~small.jpg", "The Centaur rocket stage for LRO and LCROSS being moved at Cape Canaveral in 2009", "NASA/KSC"),
  },
  {
    id: "lunar-artifacts",
    keywords: ["left on the moon", "leave on the moon", "left behind on the moon", "abandoned on the moon", "astronauts left", "astronauts leave", "artifact", "artifacts", "catalogue", "catalog", "how many things", "objects on the moon", "lunar module", "ascent stage", "snoopy", "lander", "landers", "apollo 10", "apollo 12", "apollo 14", "apollo 15", "apollo 16", "apollo 17"],
    title: "Human Artifacts on the Moon",
    publisher: "NASA History Office",
    url: "https://www.nasa.gov/wp-content/uploads/static/history/humanartifacts.html",
    facts: [
      "NASA's History Office says it is increasingly important to protect lunar artifacts for both their historical and scientific value.",
      "The first step in protecting them is establishing exactly what is there and where it is, so NASA made a catalogue and maps of human artifacts on the Moon.",
      "The lunar module ascent stages of Apollo 12, 14, 15 and 17 were crashed into the Moon on purpose.",
      "The ascent stages of Apollo 11 and Apollo 16 were left in orbit around the Moon.",
      "The descent stage of Apollo 10's lunar module, nicknamed Snoopy, was also left in lunar orbit.",
    ],
    image: img("as17-134-20382", "as17-134-20382~small.jpg", "The Apollo 17 lunar module, rover and flag on the Moon", "NASA"),
  },
  {
    id: "space-trash-tps",
    kind: "partner",
    keywords: ["trash", "junk", "space junk", "garbage", "litter", "golf", "golf balls", "poop", "waste", "archaeology", "looting", "left on the moon", "left behind", "leave behind", "abandoned"],
    title: "Are we trashing space?",
    publisher: "The Planetary Society",
    url: "https://www.planetary.org/articles/space-trash",
    facts: [
      "There are hundreds of human-made objects on the Moon, from crashed spacecraft and lunar rovers to TV cameras and golf balls.",
      "There are also almost 100 bags of human waste from the astronauts on the Moon.",
      "Some experts call these objects space archaeology, not just space junk, and say the Moon already needs rules to manage its heritage.",
      "One researcher worries the Apollo landing sites could one day be looted.",
      "In 2022, the article noted that the first human-made objects to reach the surface of Mars had been there for 50 years.",
    ],
    image: img("as11-40-5903", "as11-40-5903~small.jpg", "Buzz Aldrin near the lunar module Eagle, July 1969", "NASA"),
  },
  {
    id: "heritage-rules",
    keywords: ["protect", "protected", "protecting", "preserve", "heritage", "keep out", "rules", "guidelines", "visit the apollo", "land near", "historic site", "historic sites", "why keep", "should we clean"],
    title: "NASA's Recommendations to Space-Faring Entities: How to Protect and Preserve the Historic and Scientific Value of U.S. Government Lunar Artifacts",
    publisher: "NASA",
    url: "https://www.nasa.gov/pdf/617743main_NASA-USG_LUNAR_HISTORIC_SITES_RevA-508.pdf",
    facts: [
      "NASA released recommendations on July 20, 2011, on how to protect the historic and scientific value of U.S. hardware on the Moon.",
      "They ask future spacecraft not to fly their landing path within 2.0 km of historic lander sites like Apollo and Surveyor.",
      "Around the Apollo 11 site, the recommended no-go zone extends 75 meters from the lunar module.",
      "Around the Apollo 17 site, the recommended no-go zone extends 225 meters from the lunar module.",
      "At each site, the protected area covers the hardware left there, such as the descent stage, the flag and the science experiments. Only the Apollo 15, 16 and 17 sites also have a lunar rover.",
    ],
    image: img("as11-40-5874", "as11-40-5874~small.jpg", "The Apollo 11 site, July 20, 1969", "NASA"),
  },
  {
    id: "one-small-step",
    kind: "law",
    keywords: ["law", "laws", "act", "one small step", "congress", "legal", "protect", "protected", "heritage"],
    title: "One Small Step to Protect Human Heritage in Space Act",
    publisher: "U.S. Government Publishing Office",
    url: "https://www.govinfo.gov/content/pkg/PLAW-116publ275/html/PLAW-116publ275.htm",
    facts: [
      "The One Small Step to Protect Human Heritage in Space Act became U.S. law (Public Law 116-275) on Dec. 31, 2020.",
      "It requires NASA to make its recommendations for protecting the Apollo landing sites a condition of its contracts, grants and agreements for lunar activities.",
      "It also covers any newer guidelines NASA writes on the same subject.",
      "NASA must share these recommendations with other U.S. agencies and encourage them to follow the same practices.",
    ],
    image: img("as11-40-5874", "as11-40-5874~small.jpg", "The Apollo 11 site, July 20, 1969", "NASA"),
  },
  // ---------------------------------------------------------------------------------------
  // Left on Mars
  // ---------------------------------------------------------------------------------------
  {
    id: "phoenix",
    keywords: ["phoenix", "north pole of mars", "polar", "ice on mars", "water ice", "perchlorate", "vastitas"],
    title: "Phoenix Mars Lander",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/phoenix/",
    whereNow: { place: "Green Valley, Vastitas Borealis, Mars", status: "Mission ended Nov. 2, 2008" },
    voice: "the Phoenix lander",
    facts: [
      "Phoenix launched on Aug. 4, 2007, and landed on Mars on May 25, 2008.",
      "It landed in a place called the Green Valley of Vastitas Borealis, in Mars' far north.",
      "Phoenix confirmed that there is water ice under the Martian surface.",
      "It also found perchlorate, a chemical that could be an energy source for microbes.",
      "Phoenix's mission ended on Nov. 2, 2008.",
    ],
    image: img("PIA09344", "PIA09344~small.jpg", "Artist's concept of the Phoenix lander on Mars", "NASA/JPL"),
  },
  {
    id: "mars-missions-tps",
    kind: "partner",
    keywords: ["every mission", "all missions", "how many missions", "failed", "failures", "crash on mars", "crashed", "mars polar lander", "microphone", "visions of mars", "dvd", "library"],
    title: "Every mission to Mars ever",
    publisher: "The Planetary Society",
    url: "https://www.planetary.org/space-missions/every-mars-mission",
    facts: [
      "Roughly half of all missions to Mars have failed, though success has improved in recent years.",
      "NASA's Mars Polar Lander crash-landed, carrying The Planetary Society's Mars Microphone, the first crowdfunded science instrument to fly to another planet.",
      "NASA's Phoenix carried The Planetary Society's Visions of Mars DVD to Mars.",
      "No one knew what the surface of Mars looked like up close until Viking 1 landed there in 1976.",
    ],
    image: img("PIA09344", "PIA09344~small.jpg", "Artist's concept of the Phoenix lander on Mars", "NASA/JPL"),
  },
  {
    id: "pathfinder-tps",
    kind: "partner",
    keywords: ["sojourner", "pathfinder", "named", "name", "contest", "airbags", "airbag", "carl sagan", "names on mars"],
    title: "Mars Pathfinder",
    publisher: "The Planetary Society",
    url: "https://www.planetary.org/space-missions/pathfinder",
    facts: [
      "Sojourner got its name in a naming contest run by The Planetary Society.",
      "Pathfinder showed a new way to land on Mars: bouncing down inside protective airbags.",
      "The lander carried the names of over 100,000 Planetary Society members on a microchip.",
      "The lander and rover each studied Mars for almost three months.",
      "The lander was named the Sagan Memorial Station in honor of Carl Sagan, a co-founder of The Planetary Society.",
    ],
    image: img("PIA04318", "PIA04318~orig.jpg", "Sojourner rover next to rocks on Mars", "NASA/JPL"),
  },
  {
    id: "curiosity",
    keywords: ["curiosity", "gale", "gale crater", "mount sharp", "msl", "organic", "organics", "suv"],
    title: "Mars Science Laboratory: Curiosity Rover",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/msl-curiosity/",
    whereNow: { place: "Gale Crater, Mars", status: "Still exploring" },
    voice: "the Curiosity rover",
    facts: [
      "Curiosity launched on Nov. 26, 2011, and landed in Gale Crater on Aug. 6, 2012.",
      "It is about the size of a small SUV: 10 feet long, 9 feet wide and 7 feet tall, not counting its arm.",
      "Curiosity weighs 899 kg on Earth, but only 337 kg in Mars' weaker gravity.",
      "Its main goal is to find out if Mars was ever able to support microbial life.",
      "Early in the mission, it found chemical and mineral evidence that parts of Mars were once habitable.",
      "In a rock called Cumberland, it found the largest organic molecules discovered on Mars so far.",
      "On Aug. 26, 2026, Curiosity reached 1 kilometer of climbing up Mount Sharp.",
    ],
    image: img("PIA19808", "PIA19808~small.jpg", "Curiosity rover's low-angle selfie on Mars", "NASA/JPL-Caltech/MSSS"),
  },
  {
    id: "perseverance-debris",
    keywords: ["parachute", "backshell", "debris", "wreckage", "trash on mars", "junk on mars", "left on mars", "leave on mars", "landing gear", "discarded", "left behind", "leave behind", "perseverance leave", "perseverance left"],
    title: "Debris Field for Perseverance Landing Gear Seen from Mars Helicopter",
    publisher: "NASA Jet Propulsion Laboratory",
    url: "https://www.jpl.nasa.gov/images/pia25218-debris-field-for-perseverance-landing-gear-seen-from-mars-helicopter",
    whereNow: { place: "Jezero Crater, Mars", status: "Photographed by Ingenuity on April 19, 2022" },
    voice: "Perseverance's parachute and backshell",
    facts: [
      "During Perseverance's landing on Feb. 18, 2021, its parachute and backshell were let go high above the ground.",
      "They hit the ground at about 78 mph (126 kph).",
      "On April 19, 2022, during its 26th flight, the Ingenuity helicopter photographed them from 26 feet (8 meters) up.",
      "Engineers for the Mars Sample Return program asked for the photos, to learn how the parts worked during the landing.",
    ],
    image: img("PIA25218", "PIA25218~small.jpg", "Perseverance's backshell and parachute on Mars, photographed by Ingenuity", "NASA/JPL-Caltech"),
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
    keywords: ["perseverance", "jezero", "rover today", "still driving", "rovers", "moxie", "sample", "life on mars", "farthest", "furthest", "drove the most", "longest drive", "driving record", "distance record"],
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

/** Where the older artifact topics are today (same NASA pages as their facts). */
const ARTIFACTS: Record<string, Pick<Topic, "whereNow" | "voice">> = {
  pathfinder: { whereNow: { place: "Ares Vallis, Mars", status: "Silent since Sept. 27, 1997" }, voice: "the Sojourner rover" },
  viking: { whereNow: { place: "Chryse Planitia and Utopia Planitia, Mars", status: "Silent since 1982 (Viking 1) and 1980 (Viking 2)" }, voice: "the Viking 1 lander" },
  spirit: { whereNow: { place: "Gusev crater, Mars", status: "Silent since March 22, 2010" }, voice: "the Spirit rover" },
  opportunity: { whereNow: { place: "Meridiani Planum, Mars", status: "Mission ended Feb. 13, 2019" }, voice: "the Opportunity rover" },
  insight: { whereNow: { place: "Elysium Planitia, Mars", status: "Mission ended Dec. 15, 2022" }, voice: "the InSight lander" },
  ingenuity: { whereNow: { place: "Jezero Crater, Mars", status: "Mission ended Jan. 25, 2024" }, voice: "the Ingenuity helicopter" },
  perseverance: { whereNow: { place: "Jezero Crater, Mars", status: "Still exploring" }, voice: "the Perseverance rover" },
  lrv: { whereNow: { place: "Apollo 15, 16 and 17 landing sites, Moon", status: "Parked where the astronauts left them" }, voice: "an Apollo lunar rover" },
  retroreflector: { whereNow: { place: "Apollo 11 landing site, Moon", status: "Still used by scientists today" }, voice: "the Apollo 11 laser mirrors" },
};
for (const t of TOPICS) Object.assign(t, ARTIFACTS[t.id] ?? {});

const byId = new Map(TOPICS.map((t) => [t.id, t]));

export function getTopic(id: string): Topic | undefined {
  return byId.get(id);
}

/** Pick the topics most related to the conversation (latest question counts most). */
export function findTopics(question: string, context = "", limit = 4): Topic[] {
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

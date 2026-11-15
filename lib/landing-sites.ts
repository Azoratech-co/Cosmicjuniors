export type MarsLandingSite = {
  name: string;
  latitude: number;
  longitude: number;
  color: string;
  source: string;
};

export type LandingSiteDetails = MarsLandingSite & {
  id: string;
  rover: string;
  agency: string;
  region: string;
  /** Touchdown/impact date in UTC, not launch date or rover deployment date. */
  arrivalDate: string;
  arrivalLabel?: "Impact";
  approximate: boolean;
  title: string;
  summary: string;
  highlight: { title: string; description: string };
  coordinateSource: string;
  coordinateSourceLabel?: string;
};

export type MarsRoverSite = LandingSiteDetails & {
  outcome: "explored" | "not-deployed";
  coordinateNote: string;
};

const mars24 = "https://www.giss.nasa.gov/tools/mars24/help/landers.html";
const sovietRovers = "https://www.nasa.gov/history/50-years-ago-mariner-9-launches-to-orbit-mars/";

export const opportunityLanding: MarsRoverSite = {
  id: "opportunity",
  rover: "Opportunity",
  agency: "NASA · USA",
  name: "Eagle Crater",
  region: "Meridiani Planum",
  latitude: -1.9483,
  longitude: 354.47417,
  color: "#ff293d",
  source: "https://science.nasa.gov/mission/mer-opportunity/",
  arrivalDate: "2004-01-25",
  outcome: "explored",
  approximate: false,
  title: "Exploring Eagle Crater",
  summary: "Opportunity began its journey on Mars here.",
  highlight: { title: "Signs of Water", description: "It found clues in rocks that water existed long ago." },
  coordinateSource: "https://science.nasa.gov/mission/mer-opportunity/",
  coordinateNote: "Touchdown coordinates published in NASA's mission history; not its final position at Endeavour Crater.",
};

/**
 * Rover arrivals only: six rovers that explored Mars, plus both 1971 PrOP-M
 * attempts. Stationary landers, helicopters and unlaunched missions are excluded.
 * North-positive latitude; east-positive longitude [0, 360). These are historical
 * arrival sites, NOT rover telemetry. NASA source precision is retained below.
 * Sources do not all state a reference frame: no survey/scoring accuracy is implied.
 */
export const marsRoverSites: readonly MarsRoverSite[] = [
  {
    id: "sojourner",
    rover: "Sojourner",
    agency: "NASA · USA",
    name: "Carl Sagan Memorial Station",
    region: "Ares Vallis",
    latitude: 19.47,
    longitude: 326.75,
    color: "#22d3ee",
    source: "https://science.nasa.gov/mission/mars-pathfinder/",
    arrivalDate: "1997-07-04",
    outcome: "explored",
    approximate: false,
    title: "Exploring Ares Vallis",
    summary: "Mars Pathfinder carried Sojourner to the Carl Sagan Memorial Station.",
    highlight: { title: "The First Mars Rover", description: "Sojourner was the first rover to drive on Mars and studied rocks near the lander." },
    coordinateSource: mars24,
    coordinateNote: "Pathfinder touchdown site, rounded to 0.01 degrees in NASA Mars24; Sojourner later drove away from the lander.",
  },
  {
    id: "spirit",
    rover: "Spirit",
    agency: "NASA · USA",
    name: "Columbia Memorial Station",
    region: "Gusev Crater",
    latitude: -14.5692,
    longitude: 175.4729,
    color: "#fbbf24",
    source: "https://science.nasa.gov/mission/mer-spirit/",
    arrivalDate: "2004-01-04",
    outcome: "explored",
    approximate: false,
    title: "Exploring Gusev Crater",
    summary: "Spirit landed at Columbia Memorial Station on the other side of Mars from Opportunity.",
    highlight: { title: "The Columbia Hills", description: "Spirit crossed the crater plains and explored the hills." },
    coordinateSource: "https://science.nasa.gov/mission/mer-spirit/",
    coordinateNote: "Touchdown coordinates published in NASA's mission history; not Spirit's final resting place.",
  },
  opportunityLanding,
  {
    id: "curiosity",
    rover: "Curiosity",
    agency: "NASA · USA",
    name: "Bradbury Landing",
    region: "Gale Crater",
    latitude: -4.5895,
    longitude: 137.4417,
    color: "#a78bfa",
    source: "https://science.nasa.gov/mission/msl-curiosity/",
    arrivalDate: "2012-08-06",
    outcome: "explored",
    approximate: false,
    title: "Exploring Gale Crater",
    summary: "Curiosity began its journey at Bradbury Landing.",
    highlight: { title: "Could Mars Support Life?", description: "Curiosity investigates whether ancient Mars had conditions that could support microbial life." },
    coordinateSource: "https://ntrs.nasa.gov/citations/20130010129",
    coordinateNote: "Actual landing site in NASA's Mars Science Laboratory entry, descent and landing assessment; not a current rover position.",
  },
  {
    id: "perseverance",
    rover: "Perseverance",
    agency: "NASA · USA",
    name: "Octavia E. Butler Landing",
    region: "Jezero Crater",
    latitude: 18.44463,
    longitude: 77.45088,
    color: "#4ade80",
    source: "https://science.nasa.gov/mission/mars-2020-perseverance/",
    arrivalDate: "2021-02-18",
    outcome: "explored",
    approximate: false,
    title: "Exploring Jezero Crater",
    summary: "Perseverance landed near an ancient river delta at Octavia E. Butler Landing.",
    highlight: { title: "Collecting Rock Samples", description: "Perseverance studies rocks and collects samples as it explores." },
    coordinateSource: "https://ntrs.nasa.gov/citations/20210024644",
    coordinateNote: "Actual touchdown coordinates in NASA's Mars 2020 entry, descent and landing assessment; not a current rover position.",
  },
  {
    id: "zhurong",
    rover: "Zhurong",
    agency: "CNSA · China",
    name: "Tianwen-1 landing site",
    region: "Southern Utopia Planitia",
    latitude: 25.07,
    longitude: 109.93,
    color: "#fb923c",
    source: mars24,
    arrivalDate: "2021-05-14",
    outcome: "explored",
    approximate: false,
    title: "Exploring Utopia Planitia",
    summary: "China’s Tianwen-1 mission delivered Zhurong to this plain.",
    highlight: { title: "First Drive", description: "Zhurong drove off the landing platform on May 22, 2021." },
    coordinateSource: mars24,
    coordinateNote: "Rounded to 0.01 degrees in NASA Mars24, which cites Liu et al. (2022). May 14 UTC was May 15 in China.",
  },
  {
    id: "mars-2-prop-m",
    rover: "PrOP-M · Mars 2",
    agency: "Soviet Union",
    name: "Approximate impact site",
    region: "Hellas Planitia",
    latitude: -45,
    longitude: 47,
    color: "#f472b6",
    source: sovietRovers,
    arrivalDate: "1971-11-27",
    arrivalLabel: "Impact",
    outcome: "not-deployed",
    approximate: true,
    title: "Mars 2 Impact",
    summary: "The lander crashed during descent near Hellas Planitia.",
    highlight: { title: "Rover Deployment", description: "Its PrOP-M rover never drove on Mars." },
    coordinateSource: mars24,
    coordinateNote: "Approximate lander impact location reported by NASA Mars24, not a confirmed rover location. No uncertainty radius is supplied.",
  },
  {
    id: "mars-3-prop-m",
    rover: "PrOP-M · Mars 3",
    agency: "Soviet Union",
    name: "Approximate landing site",
    region: "Ptolemaeus Crater, Terra Sirenum",
    latitude: -45,
    longitude: 202,
    color: "#e2e8f0",
    source: sovietRovers,
    arrivalDate: "1971-12-02",
    outcome: "not-deployed",
    approximate: true,
    title: "Mars 3 Landing",
    summary: "The lander touched down in the Terra Sirenum region.",
    highlight: { title: "A Brief Signal", description: "Mars 3 stopped transmitting after about 20 seconds, before the PrOP-M rover could deploy." },
    coordinateSource: mars24,
    coordinateNote: "Approximate lander location reported by NASA Mars24, not a confirmed rover location. No uncertainty radius is supplied.",
  },
];

type Coordinates = Pick<MarsLandingSite, "latitude" | "longitude">;

export function landingView(site: Coordinates) {
  return {
    pitch: site.latitude * Math.PI / 180,
    yaw: -(site.longitude + 90) * Math.PI / 180,
  };
}

/** Matches the world maps' -180-degree left edge on SphereGeometry. */
export function marsSurfacePosition(site: Coordinates): [number, number, number] {
  const latitude = site.latitude * Math.PI / 180;
  const longitude = site.longitude * Math.PI / 180;
  return [Math.cos(latitude) * Math.cos(longitude), Math.sin(latitude), -Math.cos(latitude) * Math.sin(longitude)];
}

export function formatLandingCoordinates(site: Coordinates, approximate = false) {
  const latitude = `${Math.abs(site.latitude).toFixed(approximate ? 0 : 2)}° ${site.latitude < 0 ? "S" : "N"}`;
  const east = ((site.longitude % 360) + 360) % 360;
  return `${approximate ? "Approx. " : ""}${latitude}, ${east.toFixed(approximate ? 0 : 2)}° E`;
}

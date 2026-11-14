// Where each explorer landed, for the 3D globe on its page. Coordinates are NASA's
// (planetocentric latitude, east longitude from -180 to 360). The globe maps come from NASA too.

export type World = "mars" | "moon";

export type LandingSite = {
  /** Short label for a button when a page shows more than one site, e.g. "Apollo 15". */
  label?: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  /** How the coordinates are written on the page. */
  coordinates: string;
  color: string;
};

export type LandingGlobeData = {
  world: World;
  title: string;
  sites: LandingSite[];
  source: { label: string; url: string };
};

export const GLOBE_MAPS: Record<World, { image: string; label: string; url: string }> = {
  mars: { image: "/models/mars/viking-global.jpg", label: "NASA Mars Trek imagery", url: "https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars" },
  moon: { image: "/models/moon/surface/color-2048.webp", label: "NASA LRO Moon map", url: "https://svs.gsfc.nasa.gov/4720" },
};

const RED = "#ff293d";
const nssdcMoon = "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html";

export const LANDING_GLOBES: Partial<Record<string, LandingGlobeData>> = {
  phoenix: {
    world: "mars",
    title: "Where Phoenix landed",
    sites: [{ name: "Green Valley", region: "Vastitas Borealis", latitude: 68.22, longitude: 234.25, coordinates: "68.22° N, 234.25° E", color: RED }],
    source: { label: "NASA mission", url: "https://science.nasa.gov/mission/phoenix/" },
  },
  insight: {
    world: "mars",
    title: "Where InSight landed",
    sites: [{ name: "Homestead Hollow", region: "Elysium Planitia", latitude: 4.502, longitude: 135.623, coordinates: "4.50° N, 135.62° E", color: RED }],
    source: { label: "NASA mission", url: "https://science.nasa.gov/mission/insight/" },
  },
  "tranquility-base": {
    world: "moon",
    title: "Where Apollo 11 landed",
    sites: [{ name: "Tranquility Base", region: "Sea of Tranquility", latitude: 0.67416, longitude: 23.47314, coordinates: "0.67° N, 23.47° E", color: RED }],
    source: { label: "NASA landing sites", url: nssdcMoon },
  },
  "surveyor-3": {
    world: "moon",
    title: "Where Surveyor 3 landed",
    sites: [{ name: "Surveyor Crater", region: "Ocean of Storms", latitude: -3.0162, longitude: 336.582, coordinates: "3.02° S, 336.58° E", color: RED }],
    source: { label: "NASA mission", url: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A" },
  },
  "lunar-rover": {
    world: "moon",
    title: "Where the Lunar Rovers were driven",
    sites: [
      { label: "Apollo 15", name: "Apollo 15", region: "Hadley–Apennine", latitude: 26.13239, longitude: 3.6333, coordinates: "26.13° N, 3.63° E", color: RED },
      { label: "Apollo 16", name: "Apollo 16", region: "Descartes Highlands", latitude: -8.9734, longitude: 15.5011, coordinates: "8.97° S, 15.50° E", color: "#ffb02e" },
      { label: "Apollo 17", name: "Apollo 17", region: "Taurus–Littrow", latitude: 20.1911, longitude: 30.7723, coordinates: "20.19° N, 30.77° E", color: "#5bd4f5" },
    ],
    source: { label: "NASA landing sites", url: nssdcMoon },
  },
};

export function landingView(site: Pick<LandingSite, "latitude" | "longitude">) {
  return {
    pitch: site.latitude * Math.PI / 180,
    yaw: -(site.longitude + 90) * Math.PI / 180,
  };
}

// Where each explorer landed, for the 3D globe on its page. Coordinates are NASA's
// (planetocentric latitude, east longitude from -180 to 360). The globe maps come from NASA too.

import { marsRoverSites, type LandingSiteDetails } from "./landing-sites";

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
};

const lunarCoordinates = {
  url: "https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf",
  label: "LROC landing coordinates",
};
const lunarSiteDefaults = {
  agency: "NASA · USA",
  approximate: false,
  coordinateSource: lunarCoordinates.url,
  coordinateSourceLabel: lunarCoordinates.label,
};
const moonSites: readonly LandingSiteDetails[] = [
  {
    ...lunarSiteDefaults,
    id: "surveyor-3",
    rover: "Surveyor 3",
    name: "Surveyor Crater",
    region: "Ocean of Storms",
    latitude: -3.0162,
    longitude: 336.582,
    color: "#a78bfa",
    arrivalDate: "1967-04-20",
    title: "Landing in Surveyor Crater",
    summary: "Surveyor 3 settled inside a small crater in the Moon’s Ocean of Storms.",
    highlight: { title: "A Visit from Apollo 12", description: "Astronauts walked to the lander and brought its camera and soil scoop back to Earth." },
    source: "https://science.nasa.gov/mission/surveyor-3/",
  },
  {
    ...lunarSiteDefaults,
    id: "tranquility-base",
    rover: "Apollo 11",
    name: "Tranquility Base",
    region: "Sea of Tranquility",
    latitude: 0.67416,
    longitude: 23.47314,
    color: "#4ade80",
    arrivalDate: "1969-07-20",
    title: "Landing at Tranquility Base",
    summary: "The lunar module Eagle touched down in the Sea of Tranquility.",
    highlight: { title: "First Footsteps on the Moon", description: "Neil Armstrong and Buzz Aldrin became the first people to walk on the Moon." },
    source: "https://www.nasa.gov/mission/apollo-11/",
  },
  {
    ...lunarSiteDefaults,
    id: "apollo-15",
    rover: "Apollo 15",
    name: "Hadley–Apennine",
    region: "Hadley–Apennine",
    latitude: 26.13239,
    longitude: 3.6333,
    color: "#ff293d",
    arrivalDate: "1971-07-30",
    title: "Exploring Hadley–Apennine",
    summary: "The lunar module Falcon landed near Hadley Rille and the Apennine Mountains.",
    highlight: { title: "The First Lunar Rover", description: "David Scott and James Irwin used the first Lunar Roving Vehicle to explore and collect samples." },
    source: "https://www.nasa.gov/missions/apollo/apollo-15-mission-details/",
  },
  {
    ...lunarSiteDefaults,
    id: "apollo-16",
    rover: "Apollo 16",
    name: "Descartes Highlands",
    region: "Descartes Highlands",
    latitude: -8.9734,
    longitude: 15.5011,
    color: "#ffb02e",
    arrivalDate: "1972-04-21",
    title: "Exploring the Descartes Highlands",
    summary: "The lunar module Orion landed in the bright, rugged lunar highlands.",
    highlight: { title: "A Drive to Stone Mountain", description: "John Young and Charles Duke drove up the slope of Stone Mountain and collected samples." },
    source: "https://svs.gsfc.nasa.gov/4989/",
  },
  {
    ...lunarSiteDefaults,
    id: "apollo-17",
    rover: "Apollo 17",
    name: "Taurus–Littrow",
    region: "Taurus–Littrow",
    latitude: 20.1911,
    longitude: 30.7723,
    color: "#5bd4f5",
    arrivalDate: "1972-12-11",
    title: "Exploring Taurus–Littrow Valley",
    summary: "The lunar module Challenger landed in a valley near the Sea of Serenity.",
    highlight: { title: "Orange Soil", description: "The crew found orange grains that formed in an ancient volcanic eruption." },
    source: "https://www.nasa.gov/missions/apollo/apollo-17-mission-details/",
  },
];

export type LandingExplorerConfig = {
  world: World;
  name: string;
  title: string;
  sites: readonly LandingSiteDetails[];
  initialSites?: Readonly<Partial<Record<string, string>>>;
  comparisonNote: string;
  coordinateReference: { label: string; url: string };
  surfaceJourneys?: true;
};

export const LANDING_EXPLORERS: Record<World, LandingExplorerConfig> = {
  mars: {
    world: "mars",
    name: "Mars",
    title: "Where the Mars rovers landed",
    sites: marsRoverSites,
    comparisonNote: "Dashed markers show approximate arrival sites for the two 1971 PrOP-M attempts.",
    coordinateReference: { label: "NASA Mars24 · landing locations", url: "https://www.giss.nasa.gov/tools/mars24/help/landers.html" },
    surfaceJourneys: true,
  },
  moon: {
    world: "moon",
    name: "Moon",
    title: "Where the Moon missions landed",
    sites: moonSites,
    initialSites: { "lunar-rover": "apollo-15" },
    comparisonNote: "Apollo markers show where the lunar modules touched down.",
    coordinateReference: lunarCoordinates,
  },
};

export function landingView(site: Pick<LandingSite, "latitude" | "longitude">) {
  return {
    pitch: site.latitude * Math.PI / 180,
    yaw: -(site.longitude + 90) * Math.PI / 180,
  };
}

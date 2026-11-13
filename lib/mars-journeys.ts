import snapshotIndex from "./data/mars-journey-index.json" with { type: "json" };

export type SurfacePoint = readonly [longitudeE: number, latitudeN: number, ...metadata: unknown[]];
export type JourneyStop = readonly [longitudeE: number, latitudeN: number, startSol: number, endSol: number, site: string, drive: string];
export type JourneyData = {
  schemaVersion: 1;
  roverId: string;
  snapshotDate: string;
  provider: string;
  frame: string;
  method: string;
  sources: { url: string; sha256: string; bytes: number }[];
  stops: JourneyStop[];
  segments: SurfacePoint[][];
};
export type RouteSnapshot = {
  file: string;
  snapshotDate: string;
  stopCount: number;
  segmentCount: number;
  coordinateCount: number;
  first: JourneyStop;
  last: JourneyStop;
  maxRecordedSol: number;
};
export type JourneyLandmark = { name: string; sol?: number; source: string; description: string };
export type JourneyDefinition = {
  kind: "mapped" | "imagery" | "not-deployed";
  source: string;
  coverage: string;
  endpointLabel: string;
  endpointArea: string;
  endpointNote: string;
  endpointSource: string;
  contact?: { label: string; date: string; source: string };
  landmarks: JourneyLandmark[];
  images?: { file: string; alt: string; caption: string; source: string; credit: string }[];
};

const notebook = "https://an.rsl.wustl.edu/mera/AN/pages/mer/mer_traverse.htm";
const sojournerMap = "https://science.nasa.gov/photojournal/mars-pathfinder-rover-traverse-image/";
const zhurongTracks = "https://www.uahirise.org/ESP_073225_2055";
const zhurongLast = "https://hirise.lpl.arizona.edu/ESP_077511_2055";
const snapshotLookup = snapshotIndex as unknown as Record<string, RouteSnapshot>;

export function getRouteSnapshot(id: string): RouteSnapshot | undefined {
  return Object.hasOwn(snapshotLookup, id) ? snapshotLookup[id] : undefined;
}
export const mappedRoverIds = Object.keys(snapshotLookup);

const definitions: Record<string, JourneyDefinition> = {
  opportunity: {
    kind: "mapped", source: notebook,
    coverage: "The published, corrected rover traverse is preserved, including repeated stationary localization records. Its last record spans sols 5076–5081; the file label advertises a later coverage bound.",
    endpointLabel: "Last mapped position", endpointArea: "Perseverance Valley, Endeavour Crater",
    endpointNote: "Expected resting area. This marker uses the final published localization, not a new measurement on the date of last contact. Map-frame landing positions can differ slightly from mission-history coordinates.",
    endpointSource: "https://science.nasa.gov/photojournal/opportunitys-final-traverse-map/",
    contact: { label: "Last radio contact", date: "2018-06-10", source: "https://science.nasa.gov/resource/opportunitys-last-message/" },
    landmarks: [
      { name: "Endurance Crater", sol: 95, source: "https://www.jpl.nasa.gov/images/pia05872-at-the-edge-of-endurance/", description: "Opportunity reached the crater rim and later explored its exposed rock layers." },
      { name: "Victoria Crater", sol: 951, source: "https://science.nasa.gov/photojournal/opportunity-traverse-map-eagle-to-victoria/", description: "After crossing the plains, Opportunity reached the rim of this much larger crater." },
      { name: "Santa Maria Crater", sol: 2450, source: "https://www.nasa.gov/image-article/opportunitys-view-of-santa-maria-crater-sol-2450/", description: "The rover stopped to examine Santa Maria during its journey toward Endeavour." },
      { name: "Endeavour Crater rim", sol: 2681, source: "https://science.nasa.gov/photojournal/west-rim-of-endeavour-crater-on-mars/", description: "Opportunity arrived at the western rim of Endeavour, beginning another major exploration area." },
      { name: "Perseverance Valley", sol: 4720, source: "https://science.nasa.gov/resource/from-tribulation-to-perseverance-on-mars/", description: "The rover reached the top of the valley and subsequently explored downslope. Its mission ended in this area." },
    ],
  },
  spirit: {
    kind: "mapped", source: notebook,
    coverage: "Corrected localization records cover sols 1–2209. The final stationary record starts at sol 2169, after the last extrication attempts.",
    endpointLabel: "Last mapped position", endpointArea: "Troy, west side of Home Plate",
    endpointNote: "Spirit became embedded at Troy. The terminal published position represents its expected resting area; the last mapped drive and last radio contact are separate events.",
    endpointSource: "https://science.nasa.gov/photojournal/spirits-view-from-troy/",
    contact: { label: "Last radio contact", date: "2010-03-22", source: "https://science.nasa.gov/mission/mer-spirit/" },
    landmarks: [
      { name: "Bonneville Crater", sol: 66, source: "https://science.nasa.gov/photojournal/bonneville-and-beyond/", description: "Spirit surveyed the crater and the rocky plains before heading toward the hills." },
      { name: "Columbia Hills", sol: 156, source: "https://nssdc.gsfc.nasa.gov/planetary/mars/mars_exploration_rovers/mera_images.html", description: "The rover arrived at the base of the Columbia Hills after crossing the Gusev plains." },
      { name: "Husband Hill summit", sol: 582, source: "https://science.nasa.gov/photojournal/postcard-above-tennessee-valley/", description: "Spirit completed its climb and looked across the surrounding hills and basin." },
      { name: "Home Plate", sol: 744, source: "https://ntrs.nasa.gov/citations/20080009717", description: "Spirit reached the layered plateau and later explored around it." },
      { name: "Troy", sol: 1891, source: "https://science.nasa.gov/photojournal/spirits-view-from-troy/", description: "The rover became embedded in soft soil west of Home Plate. Later attempts to free it produced very little movement." },
    ],
  },
  curiosity: {
    kind: "mapped", source: "https://science.nasa.gov/mission/msl-curiosity/location-map/",
    coverage: "NASA/JPL route lines and published waypoints are saved as a dated snapshot. Separate path segments and gaps are retained, rather than filled with invented connections.",
    endpointLabel: "Latest published waypoint", endpointArea: "Mount Sharp traverse, Gale Crater",
    endpointNote: "Latest entry in this snapshot, not a final resting place or live position. An active rover may have moved since the source was published.",
    endpointSource: "https://science.nasa.gov/mission/msl-curiosity/location-map/",
    landmarks: [
      { name: "Yellowknife Bay", sol: 125, source: "https://science.nasa.gov/resource/looking-back-at-entry-into-yellowknife-bay/", description: "Curiosity entered the shallow depression where it investigated ancient lakebed sediments." },
      { name: "Pahrump Hills approach", sol: 751, source: "https://science.nasa.gov/resource/curiosity-mars-rovers-approach-to-pahrump-hills/", description: "The rover approached the outcrop at the base of Mount Sharp. This is an approach waypoint, not the later drill-hole location." },
      { name: "Vera Rubin Ridge", sol: 1809, source: "https://science.nasa.gov/blog/sol-1809-thread-of-life-ledge-at-elevation-4202-meters/", description: "Curiosity climbed the ridge to study its rocks and mineral clues." },
      { name: "Glen Torridon", sol: 2316, source: "https://www.nasa.gov/image-article/curiosity-drives-over-new-kind-of-terrain/", description: "The rover investigated clay-bearing terrain after leaving Vera Rubin Ridge." },
    ],
  },
  perseverance: {
    kind: "mapped", source: "https://science.nasa.gov/mission/mars-2020-perseverance/location-map/",
    coverage: "NASA/JPL waypoints and traverse lines are stored as a dated snapshot. These are published localizations, not a continuous record of every wheel movement.",
    endpointLabel: "Latest published waypoint", endpointArea: "Jezero exploration region",
    endpointNote: "Latest entry in this snapshot, not a final resting place or live position. The coordinate is not a last-call claim for this active mission.",
    endpointSource: "https://science.nasa.gov/mission/mars-2020-perseverance/location-map/",
    landmarks: [
      { name: "Rochette", sol: 198, source: "https://science.nasa.gov/resource/perseverances-selfie-at-rochette/", description: "Perseverance took a selfie at the rock where it collected early rock-core samples." },
      { name: "Three Forks sample depot", sol: 690, source: "https://science.nasa.gov/resource/perseverances-three-forks-sample-depot-map/", description: "The rover finished placing ten sample tubes on the surface for a possible future collection mission." },
      { name: "Bright Angel", sol: 1178, source: "https://science.nasa.gov/photojournal/perseverance-captures-bright-angel-in-360-degrees/", description: "The rover imaged an area of rock outcrops associated with an ancient river environment." },
      { name: "Cheyava Falls", sol: 1212, source: "https://science.nasa.gov/resource/perseverance-finds-a-rock-with-leopard-spots/", description: "Perseverance examined an unusual rock in the Bright Angel region. This point locates the rover near the target, not the rock's surveyed center." },
      { name: "Lac de Charmes region", sol: 1797, source: "https://science.nasa.gov/photojournal/nasas-perseverance-rover-snaps-westernmost-selfie/", description: "The rover documented terrain west beyond Jezero Crater in a later mission selfie." },
    ],
  },
  sojourner: {
    kind: "imagery", source: sojournerMap,
    coverage: "NASA's published traverse image shows the 83-sol route around Pathfinder. It is a local projected panorama, not a georeferenced longitude/latitude table.",
    endpointLabel: "Last documented area", endpointArea: "South of Pathfinder, near Chimp",
    endpointNote: "NASA's traverse labels the final positions as sols 78–83. Exact global endpoint coordinates are not supplied here. A separate precise endpoint pin would imply accuracy this source does not provide.",
    endpointSource: sojournerMap,
    contact: { label: "Final data transmission (photojournal)", date: "1997-09-27", source: "https://science.nasa.gov/resource/sojourner-rover-behind-chimp-left-eye/" },
    landmarks: [
      { name: "Barnacle Bill", source: "https://science.nasa.gov/resource/sojourner-near-barnacle-bill/", description: "One of the first rocks investigated near the lander." },
      { name: "Yogi", source: "https://science.nasa.gov/resource/sojourner-barnacle-bill-yogi/", description: "Sojourner examined this larger rock using its camera and chemical instrument." },
      { name: "Chimp", sol: 80, source: "https://www.jpl.nasa.gov/images/pia00970-sojourners-apxs-at-chimp-left-eye/", description: "NASA documented Sojourner's chemical instrument against Chimp on sol 80, near the end of the mission." },
    ],
    images: [{ file: "/models/mars/routes/sojourner-map.jpg", alt: "NASA projected panorama with Sojourner's route labeled from sol 1 through sols 78–83 around Pathfinder", caption: "NASA's published 83-sol traverse. The projection is local; no global coordinates have been inferred from image pixels.", source: sojournerMap, credit: "NASA/JPL" }],
  },
  zhurong: {
    kind: "imagery", source: zhurongTracks,
    coverage: "NASA MRO/HiRISE imaged the wheel tracks and later compared the rover's location. A complete machine-readable NASA route or exact terminal rover coordinate was not verified for this update.",
    endpointLabel: "Position documented from orbit", endpointArea: "Southern Utopia Planitia",
    endpointNote: "HiRISE found no movement between September 8, 2022 and February 7, 2023. This dated observation does not establish the rover's position today. The image's published center coordinates are NOT the rover's coordinates, so they are not used as an endpoint pin.",
    endpointSource: zhurongLast,
    contact: { label: "HiRISE observation", date: "2023-02-07", source: zhurongLast },
    landmarks: [
      { name: "Landing platform", source: "https://www.giss.nasa.gov/tools/mars24/help/landers.html", description: "Zhurong drove off its Tianwen-1 landing platform on May 22, 2021." },
      { name: "Southward wheel-track corridor", source: zhurongTracks, description: "The March 11, 2022 HiRISE observation documented roughly 1.5 km of southward travel. This is partial coverage, not the whole mission route." },
      { name: "Stationary observation area", source: zhurongLast, description: "The September 2022 and February 2023 orbital views show the rover at the same place." },
    ],
    images: [
      { file: "/models/mars/routes/zhurong-tracks.jpg", alt: "NASA HiRISE image showing the Zhurong rover and wheel tracks in southern Utopia Planitia", caption: "Wheel tracks documented March 11, 2022. This image covers part of the journey; it is not a complete coordinate track.", source: zhurongTracks, credit: "NASA/JPL-Caltech/UArizona" },
      { file: "/models/mars/routes/zhurong-last.jpg", alt: "Three NASA HiRISE cutouts comparing Zhurong in March 2022, September 2022, and February 2023", caption: "No movement was seen between September 8, 2022 and February 7, 2023. These are observation dates, not radio-contact dates.", source: zhurongLast, credit: "NASA/JPL-Caltech/UArizona" },
    ],
  },
};
const noDrive: JourneyDefinition = {
  kind: "not-deployed", source: "https://www.nasa.gov/history/50-years-ago-mariner-9-launches-to-orbit-mars/",
  coverage: "This PrOP-M rover never deployed and never drove on Mars. There is no rover traverse to draw.",
  endpointLabel: "No rover journey", endpointArea: "Approximate lander arrival area",
  endpointNote: "Keep the existing approximate lander marker; do not invent a rover route or a separate last-drive position.",
  endpointSource: "https://www.giss.nasa.gov/tools/mars24/help/landers.html", landmarks: [],
};
export function getJourneyDefinition(id: string): JourneyDefinition {
  return Object.hasOwn(definitions, id) ? definitions[id] : noDrive;
}
export function solRange(stop: JourneyStop) {
  return stop[2] === stop[3] ? `Sol ${stop[2]}` : `Sols ${stop[2]}–${stop[3]}`;
}
export function closestStopIndex(stops: readonly JourneyStop[], sol: number) {
  let selected = 0, best = Infinity;
  stops.forEach((stop, index) => {
    const score = sol < stop[2] ? stop[2] - sol : sol > stop[3] ? sol - stop[3] : 0;
    if (score <= best) { best = score; selected = index; }
  });
  return selected;
}
/** Surface plot only; north-up local equirectangular meters on a Mars sphere.
 * Longitude differences are wrapped so an antimeridian route cannot span a world.
 */
export function regionalPoint(point: SurfacePoint, origin: SurfacePoint): readonly [number, number] {
  const degree = Math.PI / 180, radius = 3396190;
  const delta = ((point[0] - origin[0] + 540) % 360) - 180;
  return [radius * delta * degree * Math.cos(origin[1] * degree), radius * (point[1] - origin[1]) * degree];
}
export function routeCoordinates(point: SurfacePoint) { return { longitude: point[0], latitude: point[1] }; }
export function detailedCoordinates(point: SurfacePoint) {
  return `${Math.abs(point[1]).toFixed(5)}° ${point[1] < 0 ? "S" : "N"}, ${((point[0] % 360 + 360) % 360).toFixed(5)}° E`;
}

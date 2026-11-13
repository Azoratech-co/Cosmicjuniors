import { lunarRover } from "./lunar-rover";
import { apolloLander, insightLander } from "./lander-models";
import { sojournerModel } from "./sojourner-model";

type Point = readonly [number, number, number];

export type HighlightRegion = {
  materials?: readonly string[];
  nodePrefix?: string;
  bounds?: { min: Point; max: Point };
  cylinders?: readonly { center: Point; halfWidth: number; radius: number }[];
  outsideCylinders?: boolean;
};

export type RoverPart = {
  id: string;
  name: string;
  description: string;
  source: string;
  diagram: readonly [number, number];
  target: readonly [number, number, number];
  view: { azimuth: number; polar: number };
  highlight: readonly HighlightRegion[];
};

export type RoverModel = {
  name: string;
  kind?: "lander";
  model: string;
  poster: string;
  description: string;
  modelNote?: string;
  view: { azimuth: number; polar: number };
  modelCredit: { label: string; url: string; license?: { label: string; url: string } };
  background: { image: string; credit: string; url: string };
  partsGuide?: {
    diagram: { image: string; width: number; height: number };
    parts: readonly RoverPart[];
  };
};

const merAssets = "/models/mars-exploration-rovers";
const basics = "https://science.nasa.gov/planetary-science/programs/mars-exploration/rover-basics/";
const instruments = "https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-instruments/";

const merTires = [
  [-0.531, -0.606], [-0.475, 0.106], [-0.530, 0.606],
  [0.531, -0.606], [0.475, 0.106], [0.530, 0.606],
].map(([x, z]) => ({ center: [x, 0.128, z] as const, halfWidth: 0.082, radius: 0.133 }));

const opportunity: RoverModel = {
    name: "Opportunity",
    model: merAssets + "/nasa-mer.glb",
    poster: merAssets + "/poster.webp",
    description: "Opportunity has six wheels, broad solar panels, a tall camera mast, and a robotic arm.",
    view: { azimuth: 142, polar: 61 },
    partsGuide: {
      diagram: { image: merAssets + "/diagram.png", width: 310, height: 219 },
      parts: [
        {
          id: "solar",
          highlight: [{ materials: ["tex_panels_n", "tex_panels2_n"] }],
          name: "Solar panels",
          description: "Solar panels turned sunlight into electricity. Rechargeable batteries stored energy for later.",
          source: basics,
          diagram: [50, 78],
          target: [0.695, 0.69, 0.23],
          view: { azimuth: 135, polar: 32 },
        },
        {
          id: "pancam",
          highlight: [{ materials: ["tex_mast", "foil_silver"] }],
          name: "Panoramic cameras",
          description: "Two cameras on the mast took detailed images of the Martian landscape. The team used those images to study rocks and plan where to drive.",
          source: instruments,
          diagram: [163, 21],
          target: [-0.028, 1.485, -0.407],
          view: { azimuth: 174, polar: 69 },
        },
        {
          id: "wheels",
          highlight: [{ materials: ["tex_suspension_n"], cylinders: merTires }],
          name: "Six wheels",
          description: "Each wheel had its own drive motor. The front and rear wheels could steer, helping the rover turn in place.",
          source: basics,
          diagram: [151, 198],
          target: [0.622, 0.16, -0.548],
          view: { azimuth: 105, polar: 80 },
        },
        {
          id: "suspension",
          highlight: [{ materials: ["tex_suspension_n"], cylinders: merTires, outsideCylinders: true }],
          name: "Rocker-bogie suspension",
          description: "Linked arms let the six wheels move over uneven ground while keeping the rover body steady.",
          source: basics,
          diagram: [60, 172],
          target: [0.49, 0.39, -0.1],
          view: { azimuth: 84, polar: 69 },
        },
        {
          id: "arm",
          highlight: [{ materials: ["tex_arm"] }],
          name: "Robotic arm",
          description: "The arm put science tools close to rocks and soil. One tool brushed and ground away the outer layer of a rock so other instruments could study what was underneath.",
          source: instruments,
          diagram: [246, 163],
          target: [0.09, 0.4, -0.51],
          view: { azimuth: 180, polar: 84 },
        },
        {
          id: "antenna",
          highlight: [
            { materials: ["Silver"] },
            { materials: ["tex_instruments"], bounds: { min: [-0.86, 0.706, 0.15], max: [-0.46, 1, 0.3] } },
          ],
          name: "High-gain antenna",
          description: "This antenna could aim a narrow radio signal directly at Earth to send data and receive commands.",
          source: basics,
          diagram: [249, 62],
          target: [-0.709, 0.854, 0.19],
          view: { azimuth: 178, polar: 66 },
        },
        {
          id: "body",
          highlight: [{ materials: ["tex_body_n"] }],
          name: "Electronics box",
          description: "The insulated rover body held the computer and protected electronics from the Martian cold.",
          source: basics,
          diagram: [33, 125],
          target: [0.4, 0.49, 0.24],
          view: { azimuth: 15, polar: 79 },
        },
      ],
    },
    modelCredit: {
      label: "Model · NASA VTAD",
      url: "https://science.nasa.gov/resource/mars-exploration-rovers-3d-model/",
    },
    background: {
      image: merAssets + "/opportunity-surface.webp",
      credit: "Photo · NASA/JPL/Cornell",
      url: "https://science.nasa.gov/photojournal/opportunity-captures-lion-king-panorama/",
    },
};

const models: Partial<Record<string, RoverModel>> = {
  opportunity,
  spirit: {
    ...opportunity,
    name: "Spirit",
    description: "Spirit has six wheels, broad solar panels, a tall camera mast, and a robotic arm.",
    background: {
      image: merAssets + "/spirit-surface.webp",
      credit: "Gusev Crater · NASA/JPL-Caltech/Cornell",
      url: "https://science.nasa.gov/photojournal/sweeping-view-of-the-columbia-hills-and-gusev-crater-approximate-true-color/",
    },
  },
  sojourner: sojournerModel,
  "lunar-rover": lunarRover,
  insight: insightLander,
  "tranquility-base": apolloLander,
};

export function getRoverModel(explorerId: string) {
  return Object.hasOwn(models, explorerId) ? models[explorerId] : undefined;
}

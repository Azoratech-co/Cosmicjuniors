import type { RoverModel } from "./rover-models";

// Sojourner has no official NASA 3D model, so this one is built by the team (scripts/build-sojourner.mjs)
// at true size from NASA/JPL specs and photos: 65 x 48 x 30 cm, six 13 cm aluminium wheels with
// steel cleats, a 0.22 m² solar panel, the APXS at the back and the radio antenna at the front.

const assets = "/models/sojourner";
const rover = "https://pds.nasa.gov/data/mpfr-m-apxs-2-edr-v1.0/mprv_0001/document/insthost.htm";
const mission = "https://science.nasa.gov/mission/mars-pathfinder/";

export const sojournerModel: RoverModel = {
  name: "Sojourner",
  model: assets + "/sojourner.glb",
  poster: assets + "/poster.webp",
  description: "Sojourner, a six-wheeled rover about 65 centimetres long, with a solar panel on top and the APXS at the back.",
  modelNote: "Simplified model built by the team from NASA photos and measurements.",
  view: { azimuth: 35, polar: 62 },
  modelCredit: { label: "Model · Cosmic Juniors, from NASA/JPL specs", url: rover },
  background: {
    image: assets + "/surface.webp",
    credit: "Ares Vallis and the Twin Peaks · NASA/JPL",
    url: "https://science.nasa.gov/resource/panoramic-views-of-the-landing-site-from-sagan-memorial-station/",
  },
  partsGuide: {
    diagram: { image: assets + "/diagram.png", width: 310, height: 219 },
    parts: [
      {
        id: "solar",
        name: "Solar panel",
        description: "The solar panel on top turned sunlight into electricity. It was made of 13 rows of 18 solar cells.",
        source: rover,
        diagram: [150, 70],
        target: [0.05, 0.277, 0.0],
        view: { azimuth: 30, polar: 38 },
        highlight: [{ nodePrefix: "solar_panel" }],
      },
      {
        id: "wheels",
        name: "Six wheels",
        description: "Each aluminium wheel was 13 centimetres across, with steel cleats to grip the soil. Every wheel had its own motor, and the front and back wheels could steer.",
        source: rover,
        diagram: [166, 186],
        target: [0.2, 0.065, 0.25],
        view: { azimuth: 55, polar: 70 },
        highlight: [{ nodePrefix: "wheels" }],
      },
      {
        id: "rocker-bogie",
        name: "Rocker-bogie suspension",
        description: "Linked arms let each wheel rise and fall on its own, so Sojourner could climb over rocks about as tall as one of its wheels.",
        source: rover,
        diagram: [206, 126],
        target: [0.152, 0.15, -0.06],
        view: { azimuth: 88, polar: 74 },
        highlight: [{ nodePrefix: "rocker_bogie" }],
      },
      {
        id: "apxs",
        name: "APXS",
        description: "At the back, the APXS was pressed against rocks and soil to find out which chemical elements they were made of.",
        source: rover,
        diagram: [224, 92],
        target: [0, 0.1, -0.3],
        view: { azimuth: 160, polar: 66 },
        highlight: [{ nodePrefix: "apxs" }],
      },
      {
        id: "cameras",
        name: "Cameras and lasers",
        description: "Two black-and-white cameras and five laser stripes at the front spotted rocks and holes in the way. A colour camera at the back watched the APXS.",
        source: rover,
        diagram: [128, 140],
        target: [0.05, 0.205, 0.235],
        view: { azimuth: 12, polar: 72 },
        highlight: [{ nodePrefix: "cameras" }, { nodePrefix: "laser_stripers" }],
      },
      {
        id: "antenna",
        name: "Radio antenna",
        description: "Sojourner could not talk to Earth directly. Its radio antenna sent messages to the lander, which passed them home.",
        source: mission,
        diagram: [88, 40],
        target: [-0.17, 0.52, 0.2],
        view: { azimuth: -30, polar: 62 },
        highlight: [{ nodePrefix: "antenna" }],
      },
      {
        id: "body",
        name: "Warm electronics box",
        description: "The insulated body held the rover’s computer and electronics and kept them warm through the freezing Martian nights.",
        source: rover,
        diagram: [172, 142],
        target: [0.14, 0.18, 0.12],
        view: { azimuth: 70, polar: 70 },
        highlight: [{ nodePrefix: "body" }],
      },
    ],
  },
};

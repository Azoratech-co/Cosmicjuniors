import type { RoverModel } from "./rover-models";

// Phoenix has no official NASA 3D model, so this one is built by the team (scripts/build-phoenix.mjs)
// at true size from NASA/JPL facts and pictures: a 1.5 m deck on three legs, two ten-sided solar
// arrays about 5.5 m across, a 2.35 m robotic arm and a weather mast 2.2 m above the ground.

const assets = "/models/phoenix";
const mission = "https://science.nasa.gov/mission/phoenix/";

export const phoenixModel: RoverModel = {
  name: "Phoenix",
  kind: "lander",
  model: assets + "/phoenix.glb",
  poster: assets + "/poster.webp",
  description: "The Phoenix lander with both solar arrays open, its robotic arm reaching to the ground, and its cameras and science instruments on the deck.",
  modelNote: "Simplified model built by the team from NASA pictures and measurements.",
  view: { azimuth: 35, polar: 62 },
  modelCredit: { label: "Model · Cosmic Juniors, from NASA/JPL pictures", url: mission },
  background: {
    image: assets + "/surface.webp",
    credit: "Phoenix landing site · NASA/JPL-Caltech/University of Arizona",
    url: "https://images.nasa.gov/details/PIA10713",
  },
  partsGuide: {
    diagram: { image: assets + "/diagram.png", width: 310, height: 219 },
    parts: [
      {
        id: "solar",
        name: "Solar arrays",
        description: "Two ten-sided solar arrays opened like fans after landing and made electricity from sunlight.",
        source: mission,
        diagram: [223, 139],
        target: [1.76, 0.97, 0.3],
        view: { azimuth: 60, polar: 40 },
        highlight: [{ nodePrefix: "solar_arrays" }],
      },
      {
        id: "arm",
        name: "Robotic arm",
        description: "The 2.35-metre arm dug trenches and scooped up soil and ice. A camera above the scoop took close-up colour pictures.",
        source: mission,
        diagram: [59, 102],
        target: [-0.95, 1.27, 1.25],
        view: { azimuth: -25, polar: 62 },
        highlight: [{ nodePrefix: "robotic_arm" }],
      },
      {
        id: "ssi",
        name: "Stereo camera",
        description: "The Surface Stereo Imager was Phoenix’s main camera. From the top of its mast, it took 3D pictures of the landing site.",
        source: mission,
        diagram: [145, 47],
        target: [-0.2, 1.93, -0.3],
        view: { azimuth: 15, polar: 60 },
        highlight: [{ nodePrefix: "stereo_camera" }],
      },
      {
        id: "tega",
        name: "TEGA ovens",
        description: "Eight tiny ovens, each about the size of a large pen, baked soil samples. In July 2008, one sample gave off water vapour, confirming water ice on Mars.",
        source: mission,
        diagram: [137, 87],
        target: [0.05, 1.29, 0.12],
        view: { azimuth: 20, polar: 40 },
        highlight: [{ nodePrefix: "tega" }],
      },
      {
        id: "meca",
        name: "MECA lab",
        description: "MECA’s wet chemistry lab mixed soil with water to see what dissolved, and its microscopes looked at tiny grains of soil. It found a salt called perchlorate.",
        source: mission,
        diagram: [167, 107],
        target: [0.38, 1.18, 0.16],
        view: { azimuth: 45, polar: 45 },
        highlight: [{ nodePrefix: "meca" }],
      },
      {
        id: "met",
        name: "Weather station",
        description: "Canada’s weather station measured temperature and wind. Its laser, called a lidar, saw snow falling from clouds, something never seen on Mars before.",
        source: mission,
        diagram: [181, 43],
        target: [0.5, 2.15, -0.38],
        view: { azimuth: 50, polar: 62 },
        highlight: [{ nodePrefix: "weather_station" }],
      },
      {
        id: "legs",
        name: "Legs and thrusters",
        description: "Phoenix landed on three legs. Twelve thrusters underneath fired to slow it down for a gentle touchdown.",
        source: mission,
        diagram: [119, 145],
        target: [0, 0.5, 0.81],
        view: { azimuth: 10, polar: 78 },
        highlight: [{ nodePrefix: "landing_legs" }],
      },
    ],
  },
};

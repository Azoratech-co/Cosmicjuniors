import type { RoverModel } from "./rover-models";

// Surveyor 3 has no official NASA 3D model, so this one is built by the team (scripts/build-surveyor.mjs)
// from NASA facts and the Apollo 12 photos of the lander on the Moon.

const assets = "/models/surveyor-3";
const nssdc = "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A";

export const surveyorModel: RoverModel = {
  name: "Surveyor 3",
  kind: "lander",
  model: assets + "/surveyor-3.glb",
  poster: assets + "/poster.webp",
  description: "Surveyor 3 on its three legs, with the solar panel and flat antenna on top of its mast, the TV camera and the surface sampler.",
  modelNote: "Simplified model built by the team from NASA facts and Apollo 12 photos.",
  view: { azimuth: 35, polar: 62 },
  modelCredit: { label: "Model · Cosmic Juniors, from NASA photos", url: nssdc },
  background: {
    image: assets + "/surface.webp",
    credit: "Surveyor 3's crater, photographed by Apollo 12 · NASA",
    url: "https://images.nasa.gov/details/as12-48-7110",
  },
  partsGuide: {
    diagram: { image: assets + "/diagram.png", width: 310, height: 219 },
    parts: [
      {
        id: "camera",
        name: "TV camera",
        description: "The TV camera looked at the Moon through a moving mirror and sent back thousands of pictures. Apollo 12 astronauts later brought this camera home to Earth.",
        source: nssdc,
        diagram: [140, 116],
        target: [0.1, 1.2, 0.42],
        view: { azimuth: 20, polar: 65 },
        highlight: [{ nodePrefix: "tv_camera" }],
      },
      {
        id: "sampler",
        name: "Surface sampler",
        description: "This folding arm’s scoop dug four trenches, up to 18 centimetres deep, to test how firm the Moon’s ground was. Apollo 12 astronauts took the scoop back to Earth.",
        source: nssdc,
        diagram: [69, 145],
        target: [-1.45, 0.2, 0.98],
        view: { azimuth: -40, polar: 62 },
        highlight: [{ nodePrefix: "surface_sampler" }],
      },
      {
        id: "solar",
        name: "Solar panel",
        description: "The solar panel on top of the mast made electricity. When the first lunar night came, the power ran out and Surveyor 3 shut down.",
        source: nssdc,
        diagram: [165, 36],
        target: [0.42, 2.95, 0.05],
        view: { azimuth: 40, polar: 45 },
        highlight: [{ nodePrefix: "solar_panel" }],
      },
      {
        id: "antenna",
        name: "Flat antenna",
        description: "The flat antenna beside the solar panel sent Surveyor 3’s TV pictures back to Earth.",
        source: nssdc,
        diagram: [130, 27],
        target: [-0.36, 2.95, 0.05],
        view: { azimuth: -50, polar: 55 },
        highlight: [{ nodePrefix: "planar_antenna" }],
      },
      {
        id: "legs",
        name: "Legs and footpads",
        description: "Three legs with crushable footpads took the shock of landing. Surveyor 3’s engines did not shut off in time, so it touched down three times before settling on the Moon.",
        source: nssdc,
        diagram: [109, 166],
        target: [0, 0.45, 1.4],
        view: { azimuth: 15, polar: 72 },
        highlight: [{ nodePrefix: "landing_legs" }],
      },
      {
        id: "verniers",
        name: "Vernier engines",
        description: "Three small rocket engines under the frame steered the lander and slowed it down during the last part of its descent.",
        source: nssdc,
        diagram: [157, 140],
        target: [0.39, 0.66, 0.225],
        view: { azimuth: 40, polar: 88 },
        highlight: [{ nodePrefix: "vernier_engines" }],
      },
      {
        id: "electronics",
        name: "Electronics boxes",
        description: "Two insulated boxes kept Surveyor 3’s radio, power and command electronics at a safe temperature.",
        source: nssdc,
        diagram: [166, 114],
        target: [0.32, 1.0, -0.16],
        view: { azimuth: 100, polar: 60 },
        highlight: [{ nodePrefix: "electronics_boxes" }],
      },
    ],
  },
};

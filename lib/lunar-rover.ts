import type { RoverModel } from "./rover-models";

const assets = "/models/lunar-rover";
const pressKit = "https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A15_PressKit.pdf";
const fieldGuide = "https://www.nasa.gov/wp-content/uploads/static/history/alsj/a17/EP-101-OCR.pdf";

export const lunarRover = {
  description: "The Apollo Lunar Roving Vehicle carried two astronauts and their equipment across the Moon.",
  name: "Lunar Roving Vehicle",
  model: assets + "/lunar-rover.glb",
  modelCredit: {
    label: "Model · Deutsches Museum",
    url: "https://sketchfab.com/3d-models/mondfahrzeug-lunar-rover-acb3f8645a69493cb211a62b40d66aab",
    license: { label: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
  },
  poster: assets + "/poster.webp",
  background: {
    image: assets + "/moon-surface.webp",
    url: "https://images.nasa.gov/details/as17-145-22162",
    credit: "Taurus–Littrow photo · NASA",
  },
  view: { azimuth: -42, polar: 60 },
  partsGuide: {
    diagram: { image: assets + "/diagram.png", width: 310, height: 219 },
    parts: [
      {
        id: "dish",
        highlight: [{ materials: ["Antenne"] }],
        name: "High-gain antenna",
        description: "The dish was pointed toward Earth to send television pictures and other signals from the Moon.",
        source: fieldGuide,
        diagram: [267, 64],
        target: [0.661, 1.371, 1.108],
        view: { azimuth: 22, polar: 62 },
      },
      {
        id: "seats",
        highlight: [{ materials: ["Seats"] }],
        name: "Two seats",
        description: "Two astronauts rode side by side. Seat belts kept them in place as the rover bounced over uneven ground.",
        source: pressKit,
        diagram: [46, 107],
        target: [-0.17, 0.785, -0.668],
        view: { azimuth: -79, polar: 57 },
      },
      {
        id: "wheels",
        highlight: [{ nodePrefix: "Wheel_" }],
        name: "Wire-mesh wheels",
        description: "Flexible wire-mesh wheels gripped the dusty surface. Each wheel had its own electric motor.",
        source: pressKit,
        diagram: [120, 193],
        target: [-0.869, 0.335, 0.869],
        view: { azimuth: -90, polar: 76 },
      },
      {
        id: "controller",
        highlight: [{ materials: ["ControlPanel"], bounds: { min: [-0.17, 0.76, -0.16], max: [0.22, 1.43, 0.23] } }],
        name: "Hand controller",
        description: "The astronauts used a hand control between the seats to steer, speed up, and brake.",
        source: pressKit,
        diagram: [169, 40],
        target: [-0.09, 0.914, 0.033],
        view: { azimuth: -42, polar: 32 },
      },
      {
        id: "tv",
        highlight: [{ materials: ["FrontParts", "Kameralinse"], bounds: { min: [-0.47, 0.92, 0.97], max: [0.3, 1.61, 1.65] } }],
        name: "Television camera",
        description: "A color television camera let people on Earth watch the astronauts working on the Moon. Controllers on Earth could aim and zoom it.",
        source: fieldGuide,
        diagram: [262, 143],
        target: [-0.22, 1.17, 1.42],
        view: { azimuth: -18, polar: 75 },
      },
      {
        id: "rack",
        highlight: [{ materials: ["BackParts"] }],
        name: "Equipment rack",
        description: "The rack behind the seats held equipment the astronauts took with them as they explored the Moon.",
        source: fieldGuide,
        diagram: [72, 36],
        target: [0.23, 0.75, -1.23],
        view: { azimuth: -159, polar: 59 },
      },
    ],
  },
} satisfies RoverModel;

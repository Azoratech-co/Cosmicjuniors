// Builds public/models/phoenix/phoenix.glb: a simple model of NASA's Phoenix Mars lander at true
// size (1.5 m deck, about 5.5 m across with both solar arrays open, 2.2 m to the top of the weather
// mast, a 2.35 m robotic arm), laid out like NASA/JPL's pictures. Metres, y up, +z is the front.
import { THREE, mat, group, box, cyl, tube, add, save, mergeGeometries } from "./model-kit.mjs";

const M = {
  deck: mat("deck_white", 0xe6e3dc, 0.15, 0.55),
  foil: mat("gold_foil", 0xc8963e, 0.85, 0.32),
  copper: mat("copper", 0xb06a3a, 0.8, 0.35),
  silver: mat("silver", 0xbfc3c9, 0.85, 0.3),
  steel: mat("steel", 0x8d9299, 0.85, 0.4),
  dark: mat("dark", 0x2b2e34, 0.4, 0.5),
  black: mat("black", 0x141519, 0.3, 0.55),
  cell: mat("solar_cell", 0x121626, 0.0, 0.85),
  white: mat("white", 0xf1efe9, 0.05, 0.6),
  lens: mat("lens", 0x08090d, 0.6, 0.1),
};
const root = group("phoenix");
const DY = 0.95; // deck height

// ---------- deck and body ----------
const deck = group("deck", root);
cyl(deck, "deck_top", M.deck, 0.75, 0.05, 0, DY, 0, "y", 10);
cyl(deck, "deck_edge", M.copper, 0.76, 0.03, 0, DY - 0.04, 0, "y", 10);
cyl(deck, "body", M.foil, 0.5, 0.32, 0, DY - 0.21, 0, "y", 20);

// ---------- three legs, and the descent thrusters under the deck ----------
const legs = group("landing_legs", root);
for (const deg of [90, 210, 330]) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const top = [0.62 * c, DY - 0.06, 0.62 * s], foot = [1.0 * c, 0.05, 1.0 * s];
  tube(legs, "leg_strut", M.steel, 0.035, top, foot, 14);
  const side = [-s, 0, c];
  for (const k of [-1, 1]) tube(legs, "leg_brace", M.dark, 0.018, [0.42 * c + k * 0.3 * side[0], DY - 0.3, 0.42 * s + k * 0.3 * side[2]], [0.98 * c, 0.1, 0.98 * s]);
  cyl(legs, "footpad", M.silver, 0.15, 0.04, foot[0], 0.03, foot[2], "y", 24, 0.12);
}
const thrusterGeos = [];
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2 + 0.26;
  thrusterGeos.push(new THREE.CylinderGeometry(0.03, 0.055, 0.12, 12).translate(0.42 * Math.cos(a), DY - 0.43, 0.42 * Math.sin(a)));
}
add(legs, "thrusters", mergeGeometries(thrusterGeos), M.dark);

// ---------- two ten-sided solar arrays, opened like fans ----------
const arrays = group("solar_arrays", root);
for (const side of [-1, 1]) {
  const cx = side * 1.76;
  cyl(arrays, "array_rim", M.foil, 1.0, 0.025, cx, DY - 0.01, 0, "y", 10);
  cyl(arrays, "array_cells", M.cell, 0.96, 0.03, cx, DY, 0, "y", 10);
  const ribs = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 10;
    ribs.push(new THREE.BoxGeometry(0.96, 0.008, 0.012).translate(0.48, 0, 0).rotateY(-a).translate(cx, DY + 0.017, 0));
  }
  add(arrays, "array_ribs", mergeGeometries(ribs), M.foil);
  tube(arrays, "array_hinge", M.steel, 0.025, [side * 0.7, DY, 0], [side * 0.8, DY, 0]);
}

// ---------- robotic arm with its scoop and camera ----------
const arm = group("robotic_arm", root);
const base = [-0.35, DY + 0.06, 0.48], elbow = [-0.95, DY + 0.32, 1.25], wrist = [-1.15, 0.28, 1.62];
cyl(arm, "arm_base", M.dark, 0.07, 0.1, base[0], base[1] + 0.03, base[2], "y", 16);
tube(arm, "arm_upper", M.foil, 0.035, base, elbow, 16);
cyl(arm, "arm_elbow", M.dark, 0.05, 0.1, ...elbow, "x", 16);
tube(arm, "arm_lower", M.foil, 0.03, elbow, wrist, 16);
box(arm, "arm_scoop", M.silver, 0.14, 0.07, 0.18, wrist[0], wrist[1] - 0.12, wrist[2] + 0.04);
box(arm, "arm_camera", M.black, 0.07, 0.06, 0.06, wrist[0], wrist[1] - 0.02, wrist[2] - 0.06);

// ---------- Surface Stereo Imager on its mast ----------
const ssi = group("stereo_camera", root);
const sx = -0.2, sz = -0.3;
for (const [dx, dz] of [[-0.05, -0.05], [0.05, -0.05], [0, 0.06]]) tube(ssi, "ssi_mast", M.silver, 0.012, [sx + dx, DY + 0.02, sz + dz], [sx + dx * 0.4, 1.85, sz + dz * 0.4]);
box(ssi, "ssi_head", M.white, 0.26, 0.11, 0.12, sx, 1.93, sz);
for (const dx of [-0.07, 0.07]) cyl(ssi, "ssi_eye", M.lens, 0.028, 0.03, sx + dx, 1.93, sz + 0.07, "z", 20);

// ---------- TEGA: eight small ovens in a white box ----------
const tega = group("tega", root);
box(tega, "tega_box", M.white, 0.3, 0.3, 0.3, 0.05, DY + 0.18, 0.12);
for (let i = 0; i < 8; i++) box(tega, "tega_door", M.foil, 0.05, 0.012, 0.05, -0.04 + (i % 4) * 0.06, DY + 0.336, 0.06 + Math.floor(i / 4) * 0.11);

// ---------- MECA: microscopes and the wet chemistry lab ----------
const meca = group("meca", root);
box(meca, "meca_box", M.dark, 0.34, 0.2, 0.28, 0.38, DY + 0.13, 0.16);
for (let i = 0; i < 4; i++) cyl(meca, "meca_cell", M.silver, 0.03, 0.03, 0.27 + i * 0.075, DY + 0.245, 0.16, "y", 16);

// ---------- MET: the weather mast with its telltale, and the lidar ----------
const met = group("weather_station", root);
const mx = 0.5, mz = -0.38;
tube(met, "met_mast", M.silver, 0.012, [mx, DY + 0.02, mz], [mx, 2.12, mz], 10);
tube(met, "telltale_rod", M.steel, 0.004, [mx, 2.12, mz], [mx, 2.2, mz], 8);
cyl(met, "telltale", M.dark, 0.012, 0.05, mx, 2.16, mz + 0.012, "y", 10);
box(met, "lidar", M.black, 0.18, 0.16, 0.2, 0.55, DY + 0.11, -0.05);
cyl(met, "lidar_window", M.lens, 0.04, 0.01, 0.55, DY + 0.195, -0.05, "y", 20);

await save(root, "public/models/phoenix/phoenix.glb");

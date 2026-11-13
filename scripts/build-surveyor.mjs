// Builds public/models/surveyor-3/surveyor-3.glb: a simple model of NASA's Surveyor 3 lander, laid
// out like the Apollo 12 photos of it on the Moon: a triangular aluminium frame on three legs with
// footpads, a tall mast with the solar panel and flat antenna, the TV camera, the surface sampler,
// three vernier engines and two electronics boxes. Metres, y up, +z is the front.
import { THREE, mat, group, box, cyl, tube, add, save, mergeGeometries } from "./model-kit.mjs";

const M = {
  alu: mat("aluminium", 0xd2d5da, 0.8, 0.35),
  white: mat("white", 0xeeece6, 0.1, 0.55),
  steel: mat("steel", 0x8d9299, 0.85, 0.4),
  dark: mat("dark", 0x2c2f35, 0.4, 0.5),
  cell: mat("solar_cell", 0x141a2c, 0.0, 0.8),
  mirror: mat("mirror", 0xcfd6e0, 1.0, 0.08),
};
const root = group("surveyor_3");
const FY = 0.8; // height of the frame's base triangle
const corner = (deg, r) => [r * Math.cos((deg * Math.PI) / 180), FY, r * Math.sin((deg * Math.PI) / 180)];
const C = [90, 210, 330].map((d) => corner(d, 0.75));

// ---------- frame and mast ----------
const frame = group("frame", root);
for (let i = 0; i < 3; i++) {
  tube(frame, "frame_tube", M.alu, 0.022, C[i], C[(i + 1) % 3]);
  tube(frame, "frame_tube", M.alu, 0.02, C[i], [0, 1.55, 0]);
}
tube(frame, "mast", M.alu, 0.03, [0, FY - 0.1, 0], [0, 2.85, 0], 14);
// two small omni antennas on booms
for (const s of [-1, 1]) tube(frame, "omni_boom", M.steel, 0.008, [0, 2.2, 0], [s * 0.55, 2.0, -0.15]);

// ---------- solar panel and flat (planar) antenna on top of the mast ----------
const solar = group("solar_panel", root);
const sp = add(solar, "solar_cells", new THREE.BoxGeometry(0.85, 0.02, 0.8), M.cell, [0.42, 2.95, 0.05]);
sp.rotation.z = -0.35;
const spf = add(solar, "solar_frame", new THREE.BoxGeometry(0.88, 0.012, 0.83), M.alu, [0.42, 2.94, 0.05]);
spf.rotation.z = -0.35;
const ant = group("planar_antenna", root);
const pa = add(ant, "antenna_face", new THREE.BoxGeometry(0.62, 0.03, 0.45), M.white, [-0.36, 2.95, 0.05]);
pa.rotation.z = 0.9;
const grid = [];
for (let i = 0; i < 5; i++) grid.push(new THREE.BoxGeometry(0.6, 0.035, 0.01).translate(0, 0, -0.18 + i * 0.09));
const pg = add(ant, "antenna_grid", mergeGeometries(grid), M.steel, [-0.36, 2.95, 0.05]); pg.rotation.z = 0.9;
cyl(ant, "mast_head", M.dark, 0.06, 0.12, 0, 2.88, 0, "y", 16);

// ---------- three legs with crushable footpads ----------
const legs = group("landing_legs", root);
for (const deg of [90, 210, 330]) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const hip = [0.75 * c, FY, 0.75 * s], foot = [2.05 * c, 0.12, 2.05 * s];
  tube(legs, "leg", M.alu, 0.03, hip, foot, 14);
  tube(legs, "shock_absorber", M.steel, 0.02, [0.55 * c, 1.25, 0.55 * s], [1.45 * c, 0.42, 1.45 * s], 12);
  cyl(legs, "footpad", M.white, 0.16, 0.09, foot[0], 0.06, foot[2], "y", 28, 0.14);
}

// ---------- three vernier engines under the frame ----------
const vern = group("vernier_engines", root);
for (const deg of [30, 150, 270]) {
  const [x, , z] = corner(deg, 0.45);
  cyl(vern, "vernier", M.dark, 0.05, 0.16, x, FY - 0.14, z, "y", 16, 0.025);
}

// ---------- two electronics boxes (compartments A and B) ----------
const boxes = group("electronics_boxes", root);
box(boxes, "compartment_a", M.white, 0.42, 0.34, 0.36, -0.3, FY + 0.2, -0.12);
box(boxes, "compartment_b", M.white, 0.38, 0.3, 0.34, 0.32, FY + 0.18, -0.16);

// ---------- TV camera with its mirror hood ----------
const cam = group("tv_camera", root);
const cx = 0.1, cz = 0.42;
cyl(cam, "camera_body", M.alu, 0.1, 0.42, cx, FY + 0.28, cz, "y", 24);
cyl(cam, "camera_hood", M.dark, 0.11, 0.12, cx, FY + 0.55, cz, "y", 24);
const mir = add(cam, "camera_mirror", new THREE.BoxGeometry(0.14, 0.01, 0.12), M.mirror, [cx, FY + 0.56, cz + 0.02]); mir.rotation.x = 0.8;

// ---------- the surface sampler: a folding arm with a scoop ----------
const samp = group("surface_sampler", root);
const s0 = [-0.45, FY + 0.05, 0.35];
const pts = [];
for (let i = 0; i <= 5; i++) pts.push([s0[0] - i * 0.2, s0[1] - i * 0.12 + (i % 2 ? 0.05 : -0.05), s0[2] + i * 0.12]);
for (let i = 0; i < 5; i++) {
  tube(samp, "sampler_link", M.alu, 0.012, pts[i], pts[i + 1]);
  const a = pts[i], b = pts[i + 1];
  tube(samp, "sampler_link", M.alu, 0.012, [a[0], a[1] + (i % 2 ? -0.1 : 0.1), a[2]], [b[0], b[1] + (i % 2 ? 0.1 : -0.1), b[2]]);
}
const end = pts[5];
box(samp, "sampler_scoop", M.steel, 0.13, 0.06, 0.06, end[0] - 0.05, end[1] - 0.12, end[2] + 0.03);
tube(samp, "sampler_wrist", M.alu, 0.012, end, [end[0] - 0.05, end[1] - 0.1, end[2] + 0.03]);

await save(root, "public/models/surveyor-3/surveyor-3.glb");

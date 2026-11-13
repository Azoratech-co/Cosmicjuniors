// Builds public/models/sojourner/sojourner.glb: a simple, true-to-size model of NASA's Sojourner
// rover (65 x 48 x 30 cm, 13 cm wheels, 0.22 m² solar panel), made from NASA/JPL photos and specs.
// Units are metres, y is up, +z is the front of the rover. Run: node scripts/build-sojourner.mjs
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { writeFileSync, mkdirSync } from "node:fs";

// GLTFExporter needs FileReader, which Node does not have
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = "data:application/octet-stream;base64," + Buffer.from(b).toString("base64"); this.onloadend?.(); }); }
};

const mat = (name, color, metalness, roughness) => { const m = new THREE.MeshStandardMaterial({ color, metalness, roughness }); m.name = name; return m; };
const M = {
  alu: mat("aluminium", 0xc9cdd3, 0.85, 0.32),
  steel: mat("steel", 0x8e939a, 0.9, 0.4),
  tube: mat("tube", 0xb9bec5, 0.85, 0.3),
  foil: mat("foil", 0xd9b86a, 0.85, 0.3),
  white: mat("white", 0xe9e7e1, 0.1, 0.6),
  cell: mat("solar_cell", 0x1a2040, 0.0, 0.75),
  frame: mat("panel_frame", 0x4a505c, 0.6, 0.4),
  black: mat("black", 0x16171a, 0.3, 0.5),
  lens: mat("lens", 0x0a0c12, 0.6, 0.1),
};

const root = new THREE.Group(); root.name = "sojourner";
const group = (name, parent = root) => { const g = new THREE.Group(); g.name = name; parent.add(g); return g; };
const box = (parent, name, m, w, h, d, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.name = name; o.position.set(x, y, z); parent.add(o); return o; };
const cyl = (parent, name, m, r, len, x, y, z, axis = "y", seg = 24) => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m); o.name = name; o.position.set(x, y, z);
  if (axis === "x") o.rotation.z = Math.PI / 2; if (axis === "z") o.rotation.x = Math.PI / 2; parent.add(o); return o;
};
// a tube between two points
const tube = (parent, name, m, r, a, b) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), m); o.name = name;
  o.position.copy(A).add(B).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); parent.add(o); return o;
};

// ---------- warm electronics box (the body) ----------
const web = group("body");
box(web, "body_box", M.foil, 0.28, 0.095, 0.42, 0, 0.18, 0);
box(web, "body_top", M.white, 0.29, 0.008, 0.43, 0, 0.232, 0);
box(web, "body_bottom", M.steel, 0.28, 0.006, 0.42, 0, 0.13, 0);

// ---------- solar panel: 13 strings of 18 cells on top ----------
const panel = group("solar_panel");
const PW = 0.44, PL = 0.50, PY = 0.272;
box(panel, "panel_frame", M.frame, PW + 0.012, 0.008, PL + 0.012, 0, PY - 0.002, 0);
const strings = 13, cells = 18, gx = PW / strings, gz = PL / cells;
const cellGeos = [];
for (let i = 0; i < strings; i++) for (let j = 0; j < cells; j++) {
  cellGeos.push(new THREE.BoxGeometry(gx * 0.9, 0.004, gz * 0.88).translate(-PW / 2 + gx * (i + 0.5), PY + 0.003, -PL / 2 + gz * (j + 0.5)));
}
const cellMesh = new THREE.Mesh(mergeGeometries(cellGeos), M.cell); cellMesh.name = "panel_cells"; panel.add(cellMesh);
for (const [x, z] of [[-0.13, 0.17], [0.13, 0.17], [-0.13, -0.17], [0.13, -0.17]]) cyl(panel, "panel_post", M.tube, 0.006, 0.036, x, 0.25, z, "y", 10);

// ---------- six wheels: aluminium, with steel cleats ----------
const R = 0.065, WW = 0.079, WX = 0.2, WZ = [0.25, 0.0, -0.25];
const wheels = group("wheels");
for (const side of [-1, 1]) WZ.forEach((z, k) => {
  const w = group(`wheel_${side < 0 ? "l" : "r"}${k}`, wheels);
  w.position.set(side * WX, R, z);
  cyl(w, "wheel_rim", M.alu, R - 0.004, WW, 0, 0, 0, "x", 40);
  cyl(w, "wheel_hub", M.steel, 0.018, WW + 0.012, 0, 0, 0, "x", 20);
  const face = cyl(w, "wheel_face", M.alu, R - 0.012, 0.004, side * (WW / 2 + 0.001), 0, 0, "x", 40);
  face.material = M.alu;
  const cleats = [];
  for (let c = 0; c < 16; c++) {
    const a = (c / 16) * Math.PI * 2;
    cleats.push(new THREE.BoxGeometry(WW * 0.96, 0.005, 0.003).rotateX(-a).translate(0, Math.cos(a) * (R - 0.002), Math.sin(a) * (R - 0.002)));
  }
  const cl = new THREE.Mesh(mergeGeometries(cleats), M.steel); cl.name = "wheel_cleats"; w.add(cl);
});

// ---------- rocker-bogie suspension (one on each side) ----------
const susp = group("rocker_bogie");
for (const side of [-1, 1]) {
  const s = side, ax = s * 0.152;           // arms sit just inside the wheels
  const pivot = [ax, 0.19, 0.06];             // rocker pivot on the body
  const bogie = [ax, 0.115, -0.125];          // bogie pivot
  const top = (z) => [ax, 0.13, z];
  tube(susp, "rocker_front", M.tube, 0.0075, pivot, top(0.25));
  tube(susp, "rocker_rear", M.tube, 0.0075, pivot, bogie);
  tube(susp, "bogie_mid", M.tube, 0.0075, bogie, top(0.0));
  tube(susp, "bogie_rear", M.tube, 0.0075, bogie, top(-0.25));
  cyl(susp, "rocker_pivot", M.steel, 0.014, 0.02, ax, 0.19, 0.06, "x", 16);
  cyl(susp, "bogie_pivot", M.steel, 0.011, 0.018, ax, 0.115, -0.125, "x", 16);
  for (const z of WZ) {
    // legs down to the wheels; the front and rear ones carry the steering motors
    tube(susp, "wheel_leg", M.tube, 0.007, top(z), [ax, R, z]);
    tube(susp, "wheel_axle", M.steel, 0.006, [ax, R, z], [s * WX, R, z]);
    if (z !== 0) cyl(susp, "steering_motor", M.black, 0.012, 0.03, ax, 0.135, z, "y", 14);
  }
}

// ---------- front: two black-and-white cameras and five laser stripers ----------
const cams = group("cameras");
for (const x of [-0.05, 0.05]) {
  box(cams, "front_camera", M.black, 0.028, 0.026, 0.02, x, 0.205, 0.222);
  cyl(cams, "front_camera_lens", M.lens, 0.007, 0.008, x, 0.205, 0.234, "z", 16);
}
box(cams, "rear_camera", M.black, 0.026, 0.024, 0.02, 0.09, 0.2, -0.222);
cyl(cams, "rear_camera_lens", M.lens, 0.007, 0.008, 0.09, 0.2, -0.234, "z", 16);
const lasers = group("laser_stripers");
for (let i = 0; i < 5; i++) cyl(lasers, "laser", M.steel, 0.006, 0.012, -0.1 + i * 0.05, 0.152, 0.226, "z", 12);

// ---------- rear: the APXS on its deployment arm ----------
const apxs = group("apxs");
cyl(apxs, "apxs_hinge", M.steel, 0.01, 0.06, 0, 0.165, -0.225, "x", 14);
tube(apxs, "apxs_arm", M.tube, 0.007, [-0.02, 0.165, -0.226], [-0.02, 0.105, -0.29]);
tube(apxs, "apxs_arm", M.tube, 0.007, [0.02, 0.165, -0.226], [0.02, 0.105, -0.29]);
const head = cyl(apxs, "apxs_head", M.alu, 0.026, 0.05, 0, 0.1, -0.3, "z", 28);
cyl(apxs, "apxs_face", M.black, 0.02, 0.004, 0, 0.1, -0.326, "z", 28);
head.material = M.alu;

// ---------- the radio antenna (talks to the lander), at the front corner ----------
const ant = group("antenna");
cyl(ant, "antenna_base", M.black, 0.01, 0.02, -0.17, 0.285, 0.2, "y", 14);
cyl(ant, "antenna_rod", M.steel, 0.0032, 0.31, -0.17, 0.45, 0.2, "y", 10);

// export
const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(root, { binary: true });
mkdirSync("public/models/sojourner", { recursive: true });
writeFileSync("public/models/sojourner/sojourner.glb", Buffer.from(glb));
const b = new THREE.Box3().setFromObject(root);
console.log("written", Buffer.from(glb).length, "bytes; size", b.getSize(new THREE.Vector3()).toArray().map((v) => v.toFixed(3)), "min", b.min.toArray().map((v) => v.toFixed(3)));

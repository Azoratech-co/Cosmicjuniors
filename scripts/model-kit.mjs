// Small helpers for building the team's simple 3D models with three.js and saving them as .glb.
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// GLTFExporter needs FileReader, which Node does not have
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = "data:application/octet-stream;base64," + Buffer.from(b).toString("base64"); this.onloadend?.(); }); }
};

export { THREE, mergeGeometries };
export const mat = (name, color, metalness, roughness, extra = {}) => { const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra }); m.name = name; return m; };
export const group = (name, parent) => { const g = new THREE.Group(); g.name = name; parent?.add(g); return g; };
export const add = (parent, name, geometry, material, [x, y, z] = [0, 0, 0]) => { const o = new THREE.Mesh(geometry, material); o.name = name; o.position.set(x, y, z); parent.add(o); return o; };
export const box = (parent, name, m, w, h, d, x, y, z) => add(parent, name, new THREE.BoxGeometry(w, h, d), m, [x, y, z]);
export const cyl = (parent, name, m, r, len, x, y, z, axis = "y", seg = 24, r2 = r) => {
  const o = add(parent, name, new THREE.CylinderGeometry(r2, r, len, seg), m, [x, y, z]);
  if (axis === "x") o.rotation.z = Math.PI / 2; if (axis === "z") o.rotation.x = Math.PI / 2; return o;
};
/** A tube (or cone if r2 differs) from point a to point b. */
export const tube = (parent, name, m, r, a, b, seg = 12, r2 = r) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const o = add(parent, name, new THREE.CylinderGeometry(r2, r, A.distanceTo(B), seg), m);
  o.position.copy(A).add(B).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return o;
};
export async function save(root, file) {
  const glb = await new GLTFExporter().parseAsync(root, { binary: true });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(glb));
  const b = new THREE.Box3().setFromObject(root);
  console.log(file, Buffer.from(glb).length, "bytes; size", b.getSize(new THREE.Vector3()).toArray().map((v) => v.toFixed(2)), "min", b.min.toArray().map((v) => v.toFixed(2)));
}

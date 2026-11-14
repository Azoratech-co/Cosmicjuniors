// The 3D, cinematic view of Mars Pathfinder's landing (three.js). It only draws: the flight itself
// (phases, altitude, steering, timing) lives in pathfinderFlight.ts and follows NASA's real entry,
// descent and landing sequence. Two worlds are used: space (Mars from afar, then atmospheric entry)
// and the ground at Ares Vallis (parachute, bridle, airbags, retrorockets, bounces).

import * as THREE from "three";
import { EDL, PERFECT_RADIUS, SAFE_RADIUS, type PathfinderFlight } from "./pathfinderFlight";

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };
const rand = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------------------------------------------------------------- shared materials and parts
const M = {
  heatShield: new THREE.MeshStandardMaterial({ color: 0x3a2a1f, roughness: 0.9, metalness: 0.05 }),
  backshell: new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.45, metalness: 0.35 }),
  foil: new THREE.MeshStandardMaterial({ color: 0xd2a24c, roughness: 0.32, metalness: 0.85 }),
  cells: new THREE.MeshStandardMaterial({ color: 0x1b2747, roughness: 0.35, metalness: 0.4, emissive: 0x05091a }),
  steel: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.4, metalness: 0.85 }),
  airbag: new THREE.MeshStandardMaterial({ color: 0xe9e2d0, roughness: 0.92, metalness: 0 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x6b4430, roughness: 0.95, metalness: 0, flatShading: true }),
};

function stripeTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 64;
  const g = c.getContext("2d")!;
  const gores = 24;
  for (let i = 0; i < gores; i++) {
    g.fillStyle = i % 2 ? "#f4efe4" : "#d9622c";
    g.fillRect((i / gores) * 512, 0, 512 / gores + 1, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Aeroshell: a shallow 70° cone heat shield in front, a white conical backshell behind. */
function makeCapsule(withShield: boolean) {
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.32, 1.05, 40, 1, true), M.backshell);
  back.position.y = 0.62;
  const cap = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), M.backshell);
  cap.rotation.x = -Math.PI / 2; cap.position.y = 1.145;
  g.add(back, cap);
  if (withShield) {
    const shield = new THREE.Mesh(new THREE.ConeGeometry(1.33, 0.42, 40), M.heatShield);
    shield.rotation.x = Math.PI; shield.position.y = -0.11;
    shield.name = "shield";
    g.add(shield);
  }
  g.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  return g;
}

/** Cruise stage: a disc of solar cells with thrusters, sitting on top of the backshell. */
function makeCruise() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 0.14, 48), M.cells);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.05, 8, 48), M.steel);
  rim.rotation.x = Math.PI / 2;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.32, 24), M.foil);
  g.add(disc, rim, hub);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 10), M.steel);
    t.position.set(Math.cos(a) * 1.1, 0.16, Math.sin(a) * 1.1);
    g.add(t);
  }
  g.position.y = 1.25;
  return g;
}

/** Disk-gap-band parachute (about 11 m across) with its suspension lines. */
function makeParachute(stripes: THREE.Texture) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.85, side: THREE.DoubleSide });
  const disk = new THREE.LatheGeometry(
    Array.from({ length: 14 }, (_, i) => { const a = (i / 13) * Math.PI * 0.42; return new THREE.Vector2(Math.sin(a) * 5.6 + 0.01, Math.cos(a) * 2.4); }), 48);
  const band = new THREE.CylinderGeometry(5.7, 5.9, 1.5, 48, 1, true);
  const d = new THREE.Mesh(disk, mat); d.position.y = -0.4;
  const b = new THREE.Mesh(band, mat); b.position.y = -2.0;
  g.add(d, b);
  const pts: number[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push(Math.cos(a) * 5.85, -2.75, Math.sin(a) * 5.85, 0, -13, 0);
  }
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)),
    new THREE.LineBasicMaterial({ color: 0xe9e1d2, transparent: true, opacity: 0.75 }));
  g.add(lines);
  g.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  return g; // the lines meet 13 m below the canopy, at the backshell
}

/** The folded lander (gold blanket) and the airbag cluster around it. */
function makeLander() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.25, 3), M.foil);
  core.castShadow = true;
  g.add(core);
  const bags = new THREE.Group();
  bags.name = "airbags";
  const n = 24;
  for (let i = 0; i < n; i++) {
    // spread the lobes evenly over a sphere, like Pathfinder's four six-lobe airbags
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996;
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.95, 18, 14), M.airbag);
    lobe.position.set(Math.cos(a) * r * 1.85, y * 1.85, Math.sin(a) * r * 1.85);
    lobe.castShadow = true;
    bags.add(lobe);
  }
  g.add(bags);
  return g;
}

function makeFlame() {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffb46a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const g = new THREE.Group();
  for (const k of [0, 1, 2]) {
    const a = (k / 3) * Math.PI * 2;
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 2.6, 12, 1, true), mat);
    f.rotation.x = Math.PI; f.position.set(Math.cos(a) * 0.95, -0.9, Math.sin(a) * 0.95);
    g.add(f);
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.1, 1.3, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1d6, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    core.rotation.x = Math.PI; core.position.set(Math.cos(a) * 0.95, -0.4, Math.sin(a) * 0.95);
    g.add(core);
  }
  g.visible = false;
  return g;
}

function glowSprite(color: string, size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, color); grad.addColorStop(0.35, color.replace(/[\d.]+\)$/, "0.45)")); grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s.scale.setScalar(size);
  return s;
}

// ---------------------------------------------------------------- terrain of Ares Vallis
function heightAt(x: number, z: number) {
  // gentle flood-plain undulations, plus the Twin Peaks about a kilometre to the southwest
  let h = Math.sin(x * 0.011) * Math.cos(z * 0.013) * 1.6 + Math.sin(x * 0.037 + z * 0.021) * 0.6 + Math.sin(z * 0.05 - x * 0.03) * 0.3;
  for (const [px, pz, ph, pr] of [[-430, -1050, 38, 230], [-170, -1150, 32, 200], [650, -1500, 20, 360]] as const) {
    const d = Math.hypot(x - px, z - pz) / pr;
    h += ph * Math.exp(-d * d * 2.2);
  }
  return h * smooth((Math.hypot(x, z) - 90) / 90); // keep the target zone flat
}

function groundTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#8a5a3b"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const v = rand(i), x = rand(i * 1.3) * 512, y = rand(i * 2.7) * 512, s = 0.6 + rand(i * 3.1) * 2.6;
    g.fillStyle = v > 0.6 ? `rgba(160,110,78,${0.25 + rand(i * 5) * 0.3})` : v > 0.25 ? `rgba(90,56,36,${0.25 + rand(i * 7) * 0.3})` : `rgba(60,38,26,${0.35})`;
    g.fillRect(x, y, s, s);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function makeGround(orbital: THREE.Texture) {
  const size = 5200, seg = 320;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color(0xe0a275), dark = new THREE.Color(0xb57a52), light = new THREE.Color(0xf0bb8c);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, heightAt(x, z));
    const n = Math.sin(x * 0.006 + 1.3) * Math.cos(z * 0.0071) * 0.5 + Math.sin(x * 0.021 - z * 0.017) * 0.3;
    tmp.copy(base).lerp(n > 0 ? light : dark, Math.abs(n) * 0.9);
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: orbital, vertexColors: true, roughness: 0.97, metalness: 0 });
  // fine grain on top of the orbital photo, for when the camera is close to the ground
  const grain = groundTexture();
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.grain = { value: grain };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <map_pars_fragment>", "#include <map_pars_fragment>\nuniform sampler2D grain;")
      .replace("#include <map_fragment>", "#include <map_fragment>\n diffuseColor.rgb *= mix(vec3(1.0), texture2D(grain, vMapUv * 90.0).rgb * 1.6, 0.55);");
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

function makeRocks() {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const k = 0.75 + rand(i * 9.1) * 0.45;
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.7, p.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const count = 2600;
  const mesh = new THREE.InstancedMesh(geo, M.rock, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const r = 18 + Math.pow(rand(i * 3.7), 0.7) * 900, a = rand(i * 5.3) * Math.PI * 2;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const big = rand(i * 7.9) > 0.97 ? 2.4 : 1;
    const size = (0.15 + Math.pow(rand(i * 2.1), 3) * 1.1) * big;
    q.setFromEuler(new THREE.Euler(rand(i) * 0.6, rand(i * 1.7) * 6.3, rand(i * 2.9) * 0.6));
    s.set(size * (0.8 + rand(i * 4.4) * 0.6), size, size * (0.8 + rand(i * 6.6) * 0.6));
    v.set(x, heightAt(x, z) + size * 0.25, z);
    mesh.setMatrixAt(i, m.compose(v, q, s));
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeSky() {
  const geo = new THREE.SphereGeometry(4500, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(0x9c7458) }, horizon: { value: new THREE.Color(0xe0b896) }, space: { value: new THREE.Color(0x120d12) }, dark: { value: 0 } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 horizon; uniform vec3 space; uniform float dark; varying vec3 vP; void main(){ float h = clamp(vP.y, 0.0, 1.0); vec3 c = mix(horizon, top, pow(h, 0.55)); c = mix(c, space, dark * pow(h, 0.7)); gl_FragColor = vec4(c, 1.0); }",
  });
  return new THREE.Mesh(geo, mat);
}

function makeTarget() {
  const g = new THREE.Group();
  const ring = (r: number, w: number, color: number, opacity: number) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r - w, r, 96), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    return m;
  };
  g.add(ring(SAFE_RADIUS, 2.2, 0xffa560, 0.85), ring(PERFECT_RADIUS, 1.4, 0xfff0d0, 0.9));
  const fill = new THREE.Mesh(new THREE.CircleGeometry(SAFE_RADIUS, 96), new THREE.MeshBasicMaterial({ color: 0xff8a3c, transparent: true, opacity: 0.09, depthWrite: false }));
  fill.rotation.x = -Math.PI / 2;
  g.add(fill);
  g.position.y = 0.15;
  g.renderOrder = 2;
  return g;
}

// ---------------------------------------------------------------- dust puffs
class Dust {
  points: THREE.Points;
  private v: Float32Array;
  private life: Float32Array;
  constructor(count = 260) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.v = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xc89870, size: 2.6, map: (glowSprite("rgba(220,170,130,1)", 1).material as THREE.SpriteMaterial).map, transparent: true, opacity: 0.6, depthWrite: false }));
    this.points.frustumCulled = false;
  }
  burst(at: THREE.Vector3, strength: number) {
    const p = this.points.geometry.attributes.position as THREE.BufferAttribute;
    let made = 0;
    for (let i = 0; i < this.life.length && made < 70 * strength; i++) {
      if (this.life[i] > 0) continue;
      const a = Math.random() * Math.PI * 2, s = (4 + Math.random() * 10) * strength;
      p.setXYZ(i, at.x, 0.4, at.z);
      this.v.set([Math.cos(a) * s, 1 + Math.random() * 4 * strength, Math.sin(a) * s], i * 3);
      this.life[i] = 1.6 + Math.random();
      made++;
    }
  }
  update(dt: number) {
    const p = this.points.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.life.length; i++) {
      if (this.life[i] <= 0) { p.setXYZ(i, 0, -999, 0); continue; }
      this.life[i] -= dt;
      this.v[i * 3] *= 0.96; this.v[i * 3 + 2] *= 0.96; this.v[i * 3 + 1] -= 1.2 * dt;
      p.setXYZ(i, p.getX(i) + this.v[i * 3] * dt, Math.max(0.2, p.getY(i) + this.v[i * 3 + 1] * dt), p.getZ(i) + this.v[i * 3 + 2] * dt);
    }
    p.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- the scene
export class PathfinderScene {
  private renderer: THREE.WebGLRenderer;
  private camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 9000);
  private space = new THREE.Scene();
  private ground = new THREE.Scene();
  // space
  private mars!: THREE.Mesh;
  private atmosphere!: THREE.Mesh;
  private craft = new THREE.Group();
  private cruise = makeCruise();
  private entryCapsule = makeCapsule(true);
  private plasma = glowSprite("rgba(255,170,90,1)", 9);
  private trail!: THREE.Points;
  // ground
  private sky = makeSky();
  private sun = new THREE.DirectionalLight(0xfff0dc, 2.4);
  private chute = makeParachute(stripeTexture());
  private shell = makeCapsule(false);
  private flame = makeFlame();
  private droppingShield = new THREE.Group().add(makeCapsule(true).getObjectByName("shield")!.clone());
  private lander = makeLander();
  private bridle: THREE.Line;
  private target = makeTarget();
  private marker: THREE.Mesh;
  private dust = new Dust();
  // state
  private shake = 0;
  private lastPhase = "";
  private release = { t: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3() };
  private shieldFall = { active: false, t: 0, pos: new THREE.Vector3() };
  private roll = 0;
  private lastBounce = 0;
  private camPos = new THREE.Vector3(0, 40, 80);
  private camLook = new THREE.Vector3();
  ready: Promise<void>;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // --- space: stars, Mars, the spacecraft
    const starPos: number[] = [];
    for (let i = 0; i < 5000; i++) {
      const v = new THREE.Vector3(rand(i) - 0.5, rand(i * 1.7) - 0.5, rand(i * 2.3) - 0.5).normalize().multiplyScalar(3000);
      starPos.push(v.x, v.y, v.z);
    }
    const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3)),
      new THREE.PointsMaterial({ color: 0xdfe7ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.85 }));
    this.space.add(stars);
    const sunLight = new THREE.DirectionalLight(0xfff4e6, 3.2);
    sunLight.position.set(60, 40, 160);
    this.space.add(sunLight, new THREE.AmbientLight(0x30324a, 0.6));
    this.space.background = new THREE.Color(0x020309);

    this.atmosphere = new THREE.Mesh(new THREE.SphereGeometry(51.6, 64, 48), new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
      uniforms: { glow: { value: new THREE.Color(0xff9a62) } },
      vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
      fragmentShader: "uniform vec3 glow; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(glow * f * 1.4, f); }",
    }));
    this.space.add(this.atmosphere);

    this.craft.add(this.entryCapsule, this.cruise);
    this.plasma.position.y = -0.6;
    this.craft.add(this.plasma);
    const trailGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(400 * 3), 3));
    const soft = (glowSprite("rgba(255,200,140,1)", 1).material as THREE.SpriteMaterial).map;
    this.trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({ color: 0xffb070, size: 0.9, map: soft, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.trail.frustumCulled = false;
    this.space.add(this.craft, this.trail);

    // --- ground: Ares Vallis
    this.ground.add(this.sky);
    this.ground.fog = new THREE.Fog(0xd6ab86, 500, 3600);
    this.ground.add(new THREE.HemisphereLight(0xf0d2b4, 0x6b4630, 1.15));
    this.sun.position.set(-160, 260, 120);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = sc.bottom = -45; sc.right = sc.top = 45; sc.near = 1; sc.far = 900;
    this.ground.add(this.sun, this.sun.target);
    const orbital = new THREE.TextureLoader().load("/story/sojourner/orbit.jpg");
    orbital.wrapS = orbital.wrapT = THREE.MirroredRepeatWrapping;
    orbital.repeat.set(3.5, 3.5);
    orbital.colorSpace = THREE.SRGBColorSpace;
    orbital.anisotropy = 8;
    this.ground.add(makeGround(orbital), makeRocks(), this.target, this.dust.points);
    this.marker = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.2, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }));
    this.marker.rotation.x = -Math.PI / 2;
    this.ground.add(this.marker);
    this.shell.add(this.flame);
    this.ground.add(this.chute, this.shell, this.lander, this.droppingShield);
    this.droppingShield.visible = false;
    this.bridle = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xf2e6d2 }));
    this.bridle.frustumCulled = false;
    this.ground.add(this.bridle);

    // Mars, with NASA's colour and relief maps
    const loader = new THREE.TextureLoader();
    this.ready = Promise.all([
      loader.loadAsync(window.innerWidth > 900 ? "/models/mars/surface/color-4096.webp" : "/models/mars/surface/color-2048.webp"),
      loader.loadAsync("/models/mars/surface/normals-2048.webp"),
    ]).then(([color, normals]) => {
      color.colorSpace = THREE.SRGBColorSpace;
      color.anisotropy = 8;
      this.mars = new THREE.Mesh(new THREE.SphereGeometry(50, 128, 96), new THREE.MeshStandardMaterial({ map: color, normalMap: normals, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 1 }));
      // turn Mars so Ares Vallis (19.3° N, 33.6° W) faces the incoming spacecraft
      this.mars.rotation.set(THREE.MathUtils.degToRad(19.3), THREE.MathUtils.degToRad(-(90 - 33.6)), 0, "XYZ");
      this.space.add(this.mars);
    });
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.renderer.dispose();
  }

  /** Visual height above the ground (compressed so the whole descent fits on screen). */
  private lift(alt: number) {
    return 125 * Math.log(1 + alt / 30) / Math.log(1 + EDL.chute / 30);
  }

  render(f: PathfinderFlight, dt: number, time: number) {
    const phase = f.phase;
    if (phase !== this.lastPhase) this.onPhase(phase, f);
    this.lastPhase = phase;
    const inSpace = phase === "ready" || phase === "cruise" || phase === "approach" || phase === "entry";
    if (inSpace) this.drawSpace(f, time);
    else this.drawGround(f, dt, time);
    this.shake = Math.max(0, this.shake - dt * 1.6);
    if (this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.6;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.6;
    }
    this.renderer.render(inSpace ? this.space : this.ground, this.camera);
  }

  private onPhase(phase: string, f: PathfinderFlight) {
    if (phase === "chute") this.shake = 0.9;
    if (phase === "freefall") {
      // the bridle is cut: backshell and parachute fly away
      this.release.t = 0;
      this.release.pos.copy(this.shell.position);
      this.release.vel.set(9 + f.vx * 0.2, 16, -4);
    }
    if (phase === "bounce") { this.lastBounce = 0; this.roll = 0; }
    if (phase === "failure" && f.grade === "unsafe") this.shake = 1.4;
    if (phase === "cruise" || phase === "ready") { this.shieldFall.active = false; this.droppingShield.visible = false; this.lastBounce = 0; this.roll = 0; }
  }

  // ------------------------------------------------------------ space and entry
  private drawSpace(f: PathfinderFlight, time: number) {
    const phase = f.phase;
    const st = f.stageTime;
    const cam = this.camera;
    this.cruise.visible = phase !== "entry";
    this.plasma.visible = phase === "entry";
    this.trail.visible = phase === "entry";

    if (phase === "entry") {
      // diving into the thin air at a steep angle; the heat shield glows, the camera shakes
      const k = smooth(st / 5);
      const heat = Math.sin(Math.PI * clamp(st / 4.6));
      const d = 60 - k * 4.5;
      const pos = new THREE.Vector3(Math.sin(0.25 + k * 0.05) * d * 0.25, Math.cos(0.25) * d, 4 - k * 8);
      this.craft.position.copy(pos);
      this.craft.lookAt(0, 0, 0);
      this.craft.rotateX(-Math.PI / 2);
      this.craft.rotateZ(Math.sin(time * 9) * 0.02 * heat);
      this.entryCapsule.position.set(0, 0, 0);
      (this.plasma.material as THREE.SpriteMaterial).opacity = 0.25 + heat * 0.9;
      this.plasma.scale.setScalar(5 + heat * 9 + Math.sin(time * 30) * 0.4);
      this.shake = Math.max(this.shake, heat * 0.35);
      // a stream of glowing gas behind the capsule
      const tp = this.trail.geometry.attributes.position as THREE.BufferAttribute;
      const back = pos.clone().normalize();
      for (let i = 0; i < tp.count; i++) {
        const s = (i / tp.count + time * 1.7) % 1;
        const spread = 0.6 + s * 3.2;
        tp.setXYZ(i, pos.x + back.x * s * 9 + (rand(i) - 0.5) * spread, pos.y + back.y * s * 9 + (rand(i * 2) - 0.5) * spread, pos.z + back.z * s * 9 + (rand(i * 3) - 0.5) * spread);
      }
      tp.needsUpdate = true;
      (this.trail.material as THREE.PointsMaterial).opacity = 0.75 * heat;
      const camTarget = pos.clone().add(new THREE.Vector3(5.5, 3.5, 9));
      cam.position.lerp(camTarget, 0.08);
      cam.lookAt(pos.clone().lerp(new THREE.Vector3(0, 0, 0), 0.02));
      cam.fov = 50;
      cam.updateProjectionMatrix();
      return;
    }

    // cruise and approach: Mars grows ahead; at the end the cruise stage separates
    const approach = phase === "approach" ? smooth(st / 5.5) : 0;
    const dist = 360 - approach * 270;
    const pos = new THREE.Vector3(-8, 14, dist);
    this.craft.position.copy(pos);
    this.craft.rotation.set(Math.PI / 2 + Math.sin(time * 0.4) * 0.05, 0, 0.3 + time * 0.05);
    const sep = phase === "approach" ? smooth((st - 3.9) / 1.3) : 0;
    this.cruise.position.set(0, 1.25 + sep * 9, 0);
    this.cruise.rotation.set(sep * 0.8, 0, sep * 0.5);
    this.cruise.visible = sep < 0.98;
    const orbit = time * 0.08;
    const camTarget = pos.clone().add(new THREE.Vector3(11 + Math.sin(orbit) * 2, 2.5, 8 - approach * 2));
    if (phase === "ready") cam.position.copy(camTarget); else cam.position.lerp(camTarget, 0.06);
    cam.lookAt(pos.clone().lerp(new THREE.Vector3(0, 0, 0), 0.05 + approach * 0.08));
    cam.fov = 42;
    cam.updateProjectionMatrix();
  }

  // ------------------------------------------------------------ the ground scene
  private drawGround(f: PathfinderFlight, dt: number, time: number) {
    const phase = f.phase;
    const st = f.stageTime;
    const ended = phase === "success" || phase === "failure";
    const ground = phase === "bounce" || ended;
    const groundX = f.x, groundZ = -f.depth;
    const h = ground ? 0 : this.lift(f.altitude);
    const ballR = 2.85;

    // sky darkens a little at the top while high up
    (this.sky.material as THREE.ShaderMaterial).uniforms.dark.value = clamp((f.altitude - 3000) / 6000) * 0.5;

    // lander position
    const lander = this.lander;
    const bags = lander.getObjectByName("airbags")!;
    const inflate = phase === "airbags" ? smooth(st / 0.7) : ["braking", "freefall", "bounce", "success", "failure"].includes(phase) ? 1 : 0;
    bags.visible = inflate > 0.01;
    bags.scale.setScalar(0.35 + inflate * 0.65);
    let ly = h + (inflate > 0 ? ballR * inflate : 1);
    if (phase === "bounce" || ended) {
      ly = ballR + f.bounceHeight * 0.7;
      if (phase === "bounce") {
        this.roll += dt * (3.5 - st);
        if (f.bounceHeight < 0.6 && st - this.lastBounce > 0.25) { this.dust.burst(lander.position, 1 - st / 3.2 + 0.2); this.lastBounce = st; this.shake = Math.max(this.shake, 0.4 * (1 - st / 3.2)); }
      }
      if (phase === "failure" && f.grade === "unsafe" && this.lastBounce >= 0) { this.dust.burst(new THREE.Vector3(groundX, 0, groundZ), 2.2); this.lastBounce = -1; }
    }
    lander.position.set(groundX, ly, groundZ);
    lander.rotation.set(this.roll * 0.6, this.roll * 0.2, this.roll);
    lander.visible = true;

    // backshell and parachute above it
    // the real bridle was 20 m; it is drawn a bit shorter so the whole stack fits on screen
    const bridleLen = phase === "chute" ? 0 : phase === "bridle" ? 13 * smooth(st / 2.5) : 13;
    const sway = Math.sin(time * 1.3) * 0.6 + f.wind * 0.12;
    const freeing = phase === "freefall" || ground;
    if (freeing) {
      this.release.t += dt;
      this.release.vel.y -= 2.5 * dt;
      this.release.pos.addScaledVector(this.release.vel, dt);
      this.shell.position.copy(this.release.pos);
      this.shell.visible = this.chute.visible = this.release.t < 5;
    } else {
      this.shell.visible = this.chute.visible = true;
      this.shell.position.set(groundX + sway * 0.3, ly + bridleLen + (bridleLen > 0 ? ballR * inflate + 0.5 : 0) + 1.2, groundZ);
    }
    this.shell.rotation.set(0, time * 0.05, sway * 0.03);
    // during the parachute phase the lander is still folded inside the backshell; the heat shield
    // stays attached until 7.3 km, then drops away
    if (phase === "chute") lander.visible = false;
    const shieldOn = phase === "chute" && f.altitude > EDL.heatShield;
    if (shieldOn) {
      this.droppingShield.visible = true;
      this.droppingShield.rotation.set(0, 0, 0);
      this.droppingShield.position.copy(this.shell.position).add(new THREE.Vector3(0, -0.11, 0));
    } else if (phase === "chute" && !this.shieldFall.active) {
      this.shieldFall = { active: true, t: 0, pos: this.shell.position.clone() };
    }
    if (this.shieldFall.active) {
      this.shieldFall.t += dt;
      this.droppingShield.position.copy(this.shieldFall.pos).add(new THREE.Vector3(this.shieldFall.t * 2, -this.shieldFall.t * this.shieldFall.t * 6, 0));
      this.droppingShield.rotation.set(this.shieldFall.t * 1.3, 0, this.shieldFall.t * 0.8);
      this.droppingShield.visible = this.shieldFall.t < 6;
    }

    const open = phase === "chute" ? smooth(st / 1.0) : 1;
    this.chute.scale.set(0.3 + open * 0.7, 0.5 + open * 0.5, 0.3 + open * 0.7);
    this.chute.position.copy(this.shell.position).add(new THREE.Vector3(sway * 0.8, 1.15 + 13 * (0.5 + open * 0.5), 0));
    this.chute.rotation.set(sway * 0.02, time * 0.1, -sway * 0.04 + Math.sin(time * 2.1) * 0.02);

    // retrorockets
    const burning = phase === "braking";
    this.flame.visible = burning;
    if (burning) this.flame.scale.set(1, 0.8 + Math.random() * 0.45, 1);

    // bridle line
    const bp = this.bridle.geometry.attributes.position as THREE.BufferAttribute;
    const linked = bridleLen > 0 && !freeing;
    this.bridle.visible = linked;
    if (linked) {
      bp.setXYZ(0, this.shell.position.x, this.shell.position.y - 0.1, this.shell.position.z);
      bp.setXYZ(1, lander.position.x, lander.position.y + 1.0, lander.position.z);
      bp.needsUpdate = true;
    }

    // ground marker under the lander (where it would land now)
    this.marker.position.set(groundX, 0.25, groundZ);
    this.marker.visible = !ground;
    (this.marker.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.35 * Math.sin(time * 5);

    // shadows follow the lander
    this.sun.position.set(lander.position.x - 160, 260, lander.position.z + 120);
    this.sun.target.position.copy(lander.position).setY(0);

    this.dust.update(dt);

    // cinematic camera: behind and above, looking down past the craft at the target
    const cam = this.camera;
    let camTarget: THREE.Vector3, look: THREE.Vector3;
    if (ended) {
      const a = time * 0.15;
      camTarget = new THREE.Vector3(groundX + Math.sin(a) * 26, 8, groundZ + Math.cos(a) * 26);
      look = new THREE.Vector3(groundX, 2.5, groundZ);
    } else if (phase === "bounce") {
      camTarget = new THREE.Vector3(groundX + 14, 7, groundZ + 30);
      look = lander.position.clone();
    } else {
      const high = clamp(h / 125);
      // frame the whole stack: parachute (13 m of lines), backshell, the 20 m bridle and the lander
      const top = this.chute.position.y + 3, bottom = lander.position.y - 3;
      const mid = new THREE.Vector3(groundX, (top + bottom) / 2, groundZ);
      const span = Math.max(24, top - bottom);
      const back = span * 1.15 + 14;
      camTarget = mid.clone().add(new THREE.Vector3(back * 0.32 + Math.sin(time * 0.15) * 4, span * 0.22 + 4, back));
      look = mid.clone().add(new THREE.Vector3(0, -span * 0.12 - (1 - high) * 6, 0));
    }
    cam.position.lerp(camTarget, phase === "chute" && st < 0.1 ? 1 : 0.07);
    this.camLook.lerp(look, phase === "chute" && st < 0.1 ? 1 : 0.1);
    cam.lookAt(this.camLook);
    cam.fov = ended ? 40 : 46;
    cam.updateProjectionMatrix();
  }
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatLandingCoordinates, landingView, marsRoverSites, marsSurfacePosition, opportunityLanding, type MarsRoverSite } from "@/lib/landing-sites";

// A live 3D Mars for the story's cruise scene: the planet turns slowly while Mars Pathfinder,
// spinning on its cruise stage, flies toward it. Scrolling through the scene brings Mars closer.
// The story's scroll loop writes the scene's progress (0-1) into the parent's data-lp.
// Like the wiki globes, visitors can turn Mars by dragging or with the arrow keys (Home resets),
// and pick a rover landing site: Mars turns to it and slides aside to make room for its card.
// Texture: NASA/USGS Viking colour mosaic (public/models/mars/surface). Sites: lib/landing-sites.ts.

const SITES: MarsRoverSite[] = [opportunityLanding, ...marsRoverSites.filter((s) => s.id !== opportunityLanding.id)]
  .sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate));

const R = 50;

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export default function StoryMars({ poster, label }: { poster?: string; label?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const hint = useId();
  const cardId = useId();
  // where the planet is turned to (yaw/pitch), and how long since anyone touched it
  const orient = useRef({ yaw: 2.2, pitch: 0, idle: 99 });
  const selectedRef = useRef<string | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; moved: number } | null>(null);
  const pick = useRef<(x: number, y: number) => string | null>(() => null);

  function rotate(x: number, y: number) {
    const o = orient.current;
    o.yaw += x;
    o.pitch = Math.max(-1.3, Math.min(1.3, o.pitch + y));
    o.idle = 0;
    selectedRef.current = null; // turning by hand stops following the chosen site, but keeps its card
  }

  function choose(id: string | null) {
    const next = id === selected ? null : id; // picking the chosen site again closes it
    setSelected(next);
    selectedRef.current = next;
    orient.current.idle = 0;
  }

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      const el = canvas.current;
      const host = box.current;
      if (disposed || !el || !host) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, alpha: false, powerPreference: "high-performance" });
      } catch {
        setFailed(true);
        return; // no WebGL: the painting stays
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x02030a);
      const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 5000);

      // stars
      const pts: number[] = [];
      for (let i = 0; i < 3500; i++) {
        const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(1500);
        pts.push(v.x, v.y, v.z);
      }
      scene.add(new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)),
        new THREE.PointsMaterial({ color: 0xdfe7ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.8 })));

      // the Sun lights Mars from the upper left, so it shows a gibbous face
      const sun = new THREE.DirectionalLight(0xfff2e2, 3.4);
      sun.position.set(-90, 35, 170);
      scene.add(sun, new THREE.AmbientLight(0x2a2c40, 0.7));

      // Mars
      const narrow = Math.min(window.innerWidth, window.innerHeight) < 700;
      const loader = new THREE.TextureLoader();
      const load = (url: string) => new Promise<InstanceType<typeof THREE.Texture>>((res, rej) => loader.load(url, res, undefined, rej));
      const color = await load(`/models/mars/surface/color-${narrow ? 2048 : 4096}.webp`).catch(() => null);
      if (disposed || !color) { renderer.dispose(); if (!disposed) setFailed(true); return; }
      color.colorSpace = THREE.SRGBColorSpace;
      color.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const spin = new THREE.Group();
      spin.add(new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), new THREE.MeshStandardMaterial({ map: color, roughness: 0.95, metalness: 0 })));
      scene.add(spin);
      const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.028, 64, 48), new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
        vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
        fragmentShader: "varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(vec3(1.0,0.62,0.42) * f * 0.75, f * 0.6); }",
      }));
      scene.add(atmo);

      // landing-site markers: a bright dot with a dark edge, plus a ring for the chosen one
      const dotCanvas = document.createElement("canvas");
      dotCanvas.width = dotCanvas.height = 64;
      const g = dotCanvas.getContext("2d")!;
      g.fillStyle = "rgba(4,6,16,0.85)"; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(32, 32, 21, 0, Math.PI * 2); g.fill();
      const dotTex = new THREE.CanvasTexture(dotCanvas);
      const ringCanvas = document.createElement("canvas");
      ringCanvas.width = ringCanvas.height = 128;
      const rg = ringCanvas.getContext("2d")!;
      rg.strokeStyle = "#fff"; rg.lineWidth = 7; rg.beginPath(); rg.arc(64, 64, 54, 0, Math.PI * 2); rg.stroke();
      const ringTex = new THREE.CanvasTexture(ringCanvas);
      const markers = SITES.map((site) => {
        const [x, y, z] = marsSurfacePosition(site);
        const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: site.color, sizeAttenuation: false, depthWrite: false }));
        m.position.set(x, y, z).multiplyScalar(R * 1.012);
        m.userData.id = site.id;
        m.renderOrder = 2;
        spin.add(m);
        return m;
      });
      const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, sizeAttenuation: false, depthWrite: false, transparent: true }));
      ring.renderOrder = 3;
      ring.visible = false;
      spin.add(ring);

      // Mars Pathfinder in cruise: backshell + heat shield under a disc of solar cells
      const craft = new THREE.Group();
      const steel = new THREE.MeshStandardMaterial({ color: 0xc9ccd2, metalness: 0.7, roughness: 0.35 });
      const shell = new THREE.MeshStandardMaterial({ color: 0xe8e4da, metalness: 0.1, roughness: 0.6 });
      const cells = new THREE.MeshStandardMaterial({ color: 0x3a56a8, metalness: 0.35, roughness: 0.35, emissive: 0x0a1430 });
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.32, 1.05, 40), shell);
      back.position.y = 0.62;
      const heat = new THREE.Mesh(new THREE.ConeGeometry(1.33, 0.42, 40), new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8 }));
      heat.rotation.x = Math.PI; heat.position.y = -0.11;
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 0.14, 48), cells);
      disc.position.y = 1.25;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.05, 8, 48), steel);
      rim.rotation.x = Math.PI / 2; rim.position.y = 1.25;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.32, 24), steel);
      hub.position.y = 1.4;
      craft.add(back, heat, disc, rim, hub);
      const tilt = new THREE.Group();
      tilt.add(craft);
      tilt.rotation.set(0.55, 0.5, 0.95); // seen from the side, heat shield ahead toward Mars
      tilt.scale.setScalar(0.8);
      scene.add(tilt);

      let W = 1, H = 1;
      const fit = () => {
        W = host.clientWidth || 1; H = host.clientHeight || 1;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(fit);
      ro.observe(host);
      fit();

      // clicking a marker on the globe picks that site
      const ray = new THREE.Raycaster();
      pick.current = (x, y) => {
        const r = el.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), camera);
        const hit = ray.intersectObjects(markers, false)[0];
        if (!hit) return null;
        // ignore markers on the far side of the planet
        const toCam = camera.position.clone().sub(hit.object.getWorldPosition(new THREE.Vector3()));
        const normal = hit.object.getWorldPosition(new THREE.Vector3()).normalize();
        return normal.dot(toCam) > 0 ? (hit.object.userData.id as string) : null;
      };

      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const layer = host.closest(".ss-layer") as HTMLElement | null;
      const mover = host.parentElement;
      let raf = 0, last = performance.now(), shown = 0, side = 0;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (layer && layer.style.visibility === "hidden") { last = now; return; }
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const o = orient.current;
        o.idle += dt;
        const chosen = SITES.find((s) => s.id === selectedRef.current);
        if (chosen) {
          // turn the chosen site to face the viewer (the short way round)
          const target = landingView(chosen);
          let dy = target.yaw - o.yaw;
          dy = Math.atan2(Math.sin(dy), Math.cos(dy));
          const k = still ? 1 : Math.min(1, dt * 3);
          o.yaw += dy * k;
          o.pitch += (target.pitch - o.pitch) * k;
        } else if (!still && o.idle > 4) {
          o.yaw += dt * 0.06; // slow spin resumes a few seconds after anyone touched it
        }
        spin.rotation.set(o.pitch, o.yaw, 0);

        // the open card pulls Mars closer and to the side (up on narrow screens)
        const open = box.current?.dataset.open === "true";
        side += ((open ? 1 : 0) - side) * (still ? 1 : Math.min(1, dt * 4));
        const lp = Number(mover?.dataset.lp ?? 0) || 0;
        shown += (lp - shown) * Math.min(1, dt * 4);
        const narrowView = camera.aspect < 1;
        const e = Math.max(shown * shown * (3 - 2 * shown), (narrowView ? 0.3 : 0.72) * side);
        const dist = 640 - 470 * e;
        camera.position.set(narrowView ? 0 : (-18 + 10 * e) * (1 - side), (6 - 4 * e) * (1 - side), dist * (narrowView ? 1.35 : 1));
        camera.lookAt(narrowView ? 0 : (-14 + 6 * e) * (1 - side), 0, 0);
        if (side > 0.001) camera.setViewOffset(W, H, narrowView ? 0 : W * 0.21 * side, narrowView ? H * 0.3 * side : 0, W, H);
        else camera.clearViewOffset();

        // markers: the chosen one is larger and ringed
        // markers grow a little as Mars comes closer, so they never hide the planet
        const base = (narrowView ? 0.034 : 0.022) * (0.5 + 0.5 * e);
        for (const m of markers) m.scale.setScalar(base * (m.userData.id === box.current?.dataset.site ? 1.45 : 1));
        const ringed = markers.find((m) => m.userData.id === box.current?.dataset.site);
        ring.visible = !!ringed;
        if (ringed) {
          ring.position.copy(ringed.position).multiplyScalar(1.001);
          const pulse = still ? 0.5 : (now / 1400) % 1;
          ring.scale.setScalar(base * (1.6 + 1.6 * pulse));
          (ring.material as InstanceType<typeof THREE.SpriteMaterial>).opacity = 0.9 * (1 - pulse);
          (ring.material as InstanceType<typeof THREE.SpriteMaterial>).color.set(SITES.find((s) => s.id === ringed.userData.id)!.color);
        }

        // the spacecraft sits in front of the camera, lower left; it steps aside while a card is open
        tilt.visible = side < 0.5;
        tilt.position.set(camera.position.x + (narrowView ? -2.5 : -8.5), camera.position.y - (narrowView ? 5 : 3.6), camera.position.z - 22);
        craft.rotation.y = (still ? 0 : now / 1000) * 0.21; // Pathfinder spun at about 2 rpm during cruise
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(frame);
      renderer.render(scene, camera);
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        pick.current = () => null;
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Sprite) {
            obj.geometry.dispose();
            (obj.material as InstanceType<typeof THREE.Material>).dispose();
          }
        });
        color.dispose();
        dotTex.dispose();
        ringTex.dispose();
        renderer.dispose();
      };
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  const site = SITES.find((s) => s.id === selected);

  return (
    <div
      ref={box}
      className="ss-mars ss-model"
      data-open={site ? "true" : "false"}
      data-site={selected ?? ""}
      role="group"
      aria-roledescription="3D model"
      aria-label={label ?? "Mars in 3D, growing closer as Mars Pathfinder approaches"}
      aria-describedby={hint}
      onKeyDown={(event) => {
        if (event.key === "Escape" && selected) {
          choose(null);
          event.preventDefault();
        }
      }}
    >
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ss-mars__poster" src={poster} alt="" aria-hidden="true" style={{ opacity: ready ? 0 : 1 }} />
      )}
      <canvas
        ref={canvas}
        className="ss-mars__canvas"
        style={{ opacity: ready ? 1 : 0 }}
        tabIndex={ready ? 0 : undefined}
        aria-label="Mars globe. Drag or use the arrow keys to turn it, Home to reset."
        onPointerDown={(event) => {
          if (!ready || event.button !== 0 || !event.isPrimary) return;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: 0 };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const previous = drag.current;
          if (previous?.id !== event.pointerId) return;
          const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
          const moved = previous.moved + Math.abs(dx) + Math.abs(dy);
          // on touch screens only sideways drags turn Mars, so up and down still scroll the story
          if (moved > 4) rotate(dx * 0.009, event.pointerType === "touch" ? 0 : dy * 0.009);
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved };
        }}
        onPointerUp={(event) => {
          const d = drag.current;
          drag.current = null;
          if (d && d.moved <= 4) {
            const hit = pick.current(event.clientX, event.clientY);
            if (hit) choose(hit);
          }
        }}
        onPointerCancel={() => { drag.current = null; }}
        onKeyDown={(event) => {
          switch (event.key) {
            case "ArrowLeft": rotate(-0.18, 0); break;
            case "ArrowRight": rotate(0.18, 0); break;
            case "ArrowUp": rotate(0, -0.18); break;
            case "ArrowDown": rotate(0, 0.18); break;
            case "Home": orient.current = { yaw: 2.2, pitch: 0, idle: 0 }; choose(null); break;
            default: return;
          }
          event.preventDefault();
        }}
      />
      <p id={hint} className={`ss-mars__hint${site ? " is-quiet" : ""}`} role={failed ? "status" : undefined}>
        {failed
          ? "The 3D Mars is unavailable on this device, so the painting is shown."
          : ready
            ? <>Drag or use arrow keys to rotate Mars.<span className="ss-mars__more"> Pick a landing site to visit it.</span></>
            : "Loading Mars…"}
      </p>

      {ready && (
        <div className={`ss-mars__panel${site ? " is-open" : ""}`}>
          <div className="ss-mars__sites" role="group" aria-label="Rover landing sites on Mars">
            {SITES.map((s) => (
              <button
                key={s.id}
                type="button"
                className="ss-mars__site"
                aria-pressed={selected === s.id}
                aria-controls={cardId}
                onClick={() => choose(s.id)}
              >
                <span className="ss-mars__dot" style={{ background: s.color }} aria-hidden="true" />
                {s.rover}
              </button>
            ))}
          </div>
          <section id={cardId} className="ss-mars__card" aria-live="polite" hidden={!site}>
            {site && (
              <>
                <button type="button" className="ss-mars__close" aria-label={`Close ${site.rover} landing site`} onClick={() => choose(null)}>×</button>
                <h3 style={{ color: site.color }}>{site.rover}</h3>
                <p className="ss-mars__where">{site.name} · {site.region}</p>
                <dl>
                  <div><dt>{site.arrivalLabel ?? "Landed"}</dt><dd>{formatDate(site.arrivalDate)}</dd></div>
                  <div><dt>Where</dt><dd>{formatLandingCoordinates(site, site.approximate)}</dd></div>
                  <div><dt>Mission</dt><dd>{site.agency}</dd></div>
                </dl>
                <p>{site.summary}</p>
                <p><b>{site.highlight.title}.</b> {site.highlight.description}</p>
                <a href={site.source} target="_blank" rel="noopener noreferrer">NASA source<span className="sr-only"> (opens in a new tab)</span></a>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

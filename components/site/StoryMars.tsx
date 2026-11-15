"use client";

import { useEffect, useRef, useState } from "react";

// A live 3D Mars for the story's cruise scene: the planet turns slowly while Mars Pathfinder,
// spinning on its cruise stage, flies toward it. Scrolling through the scene brings Mars closer.
// The story's scroll loop writes the scene's progress (0-1) into the parent's data-lp.
// Texture: NASA/USGS Viking colour mosaic (public/models/mars/surface).

export default function StoryMars({ poster, label }: { poster?: string; label?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

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
      scene.add(sun, new THREE.AmbientLight(0x2a2c40, 0.5));

      // Mars
      const narrow = Math.min(window.innerWidth, window.innerHeight) < 700;
      const loader = new THREE.TextureLoader();
      const load = (url: string) => new Promise<InstanceType<typeof THREE.Texture>>((res, rej) => loader.load(url, res, undefined, rej));
      const color = await load(`/models/mars/surface/color-${narrow ? 2048 : 4096}.webp`).catch(() => null);
      if (disposed || !color) { renderer.dispose(); return; }
      color.colorSpace = THREE.SRGBColorSpace;
      color.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const mars = new THREE.Mesh(new THREE.SphereGeometry(50, 128, 96),
        new THREE.MeshStandardMaterial({ map: color, roughness: 0.95, metalness: 0 }));
      mars.rotation.z = THREE.MathUtils.degToRad(25.2); // Mars's axial tilt
      const spin = new THREE.Group();
      spin.add(mars);
      scene.add(spin);
      const atmo = new THREE.Mesh(new THREE.SphereGeometry(51.4, 64, 48), new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
        vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
        fragmentShader: "varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(vec3(1.0,0.62,0.42) * f * 0.75, f * 0.6); }",
      }));
      scene.add(atmo);

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

      const fit = () => {
        const w = host.clientWidth || 1, h = host.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(fit);
      ro.observe(host);
      fit();

      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const layer = host.closest(".ss-layer") as HTMLElement | null;
      const mover = host.parentElement;
      let raf = 0, last = performance.now(), t = 0, shown = 0;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (layer && layer.style.visibility === "hidden") { last = now; return; }
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!still) t += dt;
        const lp = Number(mover?.dataset.lp ?? 0) || 0;
        shown += (lp - shown) * Math.min(1, dt * 4);
        const e = shown * shown * (3 - 2 * shown);
        // far away -> close: Mars grows from a small disc to filling most of the frame
        const dist = 640 - 470 * e;
        const narrowView = camera.aspect < 1;
        camera.position.set(narrowView ? 0 : -18 + 10 * e, 6 - 4 * e, dist * (narrowView ? 1.35 : 1));
        camera.lookAt(narrowView ? 0 : -14 + 6 * e, 0, 0);
        spin.rotation.y = t * 0.06 + 2.2;
        // the spacecraft sits in front of the camera, lower left, drifting toward Mars
        const cd = 22;
        tilt.position.set(camera.position.x + (narrowView ? -2.5 : -8.5), camera.position.y - (narrowView ? 5 : 3.6), camera.position.z - cd);
        craft.rotation.y = t * 0.21; // Pathfinder spun at about 2 rpm during cruise
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(frame);
      renderer.render(scene, camera);
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        scene.traverse((o) => {
          if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
            o.geometry.dispose();
            const m = o.material as InstanceType<typeof THREE.Material>;
            m.dispose();
          }
        });
        color.dispose();
        renderer.dispose();
      };
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={box} className="ss-mars" role="img" aria-label={label ?? "Mars in 3D, growing closer as Mars Pathfinder approaches"}>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ss-mars__poster" src={poster} alt="" aria-hidden="true" style={{ opacity: ready ? 0 : 1 }} />
      )}
      <canvas ref={canvas} className="ss-mars__canvas" style={{ opacity: ready ? 1 : 0 }} />
    </div>
  );
}

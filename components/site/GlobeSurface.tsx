"use client";

import { useThree, useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { NoColorSpace, ObjectSpaceNormalMap, RepeatWrapping, SphereGeometry, SRGBColorSpace, TextureLoader, Vector3, type Texture, type Group, type PerspectiveCamera } from "three";
import { decodeShape, globeRadii, sampleShape, surfaceResolution, type GlobeView, type GlobeWorld, type SurfaceStatus } from "@/lib/globe-surface";

type Assets = { color: Texture; normals: Texture; heights: Float32Array; width: number };
const assetsCache = new Map<string, Promise<Assets>>();

function loadSurface(world: GlobeWorld, width: number) {
  const key = `${world}-${width}`;
  let request = assetsCache.get(key);
  if (!request) {
    const base = `/models/${world}/surface`, loader = new TextureLoader();
    const results = [loader.loadAsync(`${base}/color-${width}.webp`), loader.loadAsync(`${base}/normals-${Math.min(width, 4096)}.webp`)];
    // Wait for every resource so partial failures can release any decoded textures.
    request = Promise.allSettled([...results, fetch(`${base}/shape-512.f32`).then(async (response) => {
      if (!response.ok) throw new Error("Terrain data unavailable");
      return decodeShape(await response.arrayBuffer());
    })]).then((loaded) => {
      if (loaded.some((entry) => entry.status === "rejected")) {
        for (const entry of loaded) if (entry.status === "fulfilled" && entry.value instanceof Object && "isTexture" in entry.value) (entry.value as Texture).dispose();
        throw new Error("Detailed surface unavailable");
      }
      const [color, normals, heights] = loaded.map((entry) => (entry as PromiseFulfilledResult<Texture | Float32Array>).value);
      (color as Texture).colorSpace = SRGBColorSpace;
      (normals as Texture).colorSpace = NoColorSpace;
      (color as Texture).wrapS = RepeatWrapping;
      (normals as Texture).wrapS = RepeatWrapping;
      return { color: color as Texture, normals: normals as Texture, heights: heights as Float32Array, width };
    }).catch((error) => { assetsCache.delete(key); throw error; });
    assetsCache.set(key, request);
  }
  return request;
}

export function GlobeSurface({ world, image, detailed = false, relief = true, attempt = 0, onDetailStatus }: {
  world: GlobeWorld; image: string; detailed?: boolean; relief?: boolean; attempt?: number; onDetailStatus?: (status: SurfaceStatus) => void;
}) {
  const standard = useLoader(TextureLoader, image);
  const { gl, invalidate } = useThree();
  const [assets, setAssets] = useState<Assets | null>(null);
  const [status, setStatus] = useState<SurfaceStatus>("loading");
  standard.colorSpace = SRGBColorSpace;
  useEffect(() => {
    if (!detailed) return;
    let cancelled = false;
    const width = surfaceResolution(gl.capabilities.maxTextureSize, window.matchMedia("(max-width: 760px)").matches,
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory);
    setStatus("loading");
    loadSurface(world, width).then((next) => {
      if (cancelled) return;
      next.color.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      setAssets(next); setStatus("ready"); invalidate();
    }).catch(() => { if (!cancelled) { setStatus("failed"); invalidate(); } });
    return () => { cancelled = true; };
  }, [world, detailed, attempt, gl, invalidate]);
  useEffect(() => { if (detailed) onDetailStatus?.(status); }, [detailed, status, onDetailStatus]);
  const geometry = useMemo(() => {
    const density = assets && relief ? (assets.width >= 8192 ? 512 : 256) : 64;
    const result = new SphereGeometry(1, density, assets && relief ? density / 2 : 40);
    if (assets && relief) {
      const positions = result.getAttribute("position"), uv = result.getAttribute("uv");
      for (let i = 0; i < positions.count; i++) {
        const height = sampleShape(assets.heights, uv.getX(i) * 360 - 180, uv.getY(i) * 180 - 90);
        const factor = 1 + height / globeRadii[world];
        positions.setXYZ(i, positions.getX(i) * factor, positions.getY(i) * factor, positions.getZ(i) * factor);
      }
      result.computeVertexNormals();
    }
    return result;
  }, [assets, relief, world]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name={`${world}-surface`} geometry={geometry}>
    <meshStandardMaterial key={assets && relief ? "terrain-normal-map" : "flat-surface"} map={assets?.color ?? standard} roughness={1}
      normalMap={assets && relief ? assets.normals : null} normalMapType={ObjectSpaceNormalMap} />
  </mesh>;
}

export function GlobeLighting({ view }: { view?: GlobeView }) {
  const angle = (view?.lightAngle ?? -35) * Math.PI / 180;
  return <><ambientLight intensity={view ? 0.32 : 0.85} /><directionalLight position={view ? [Math.sin(angle) * 5, 2, Math.cos(angle) * 5] : [-3, 4, 6]} intensity={view ? 2.7 : 2} /></>;
}

/** UI symbols stay legible without covering the terrain at close camera distances. */
export function SurfaceMarkerSize({ enabled, radius, pixels = 16, children }: { enabled: boolean; radius: number; pixels?: number; children: ReactNode }) {
  const marker = useRef<Group>(null);
  const point = useMemo(() => new Vector3(), []);
  const { camera, size } = useThree();
  useFrame(() => {
    if (!marker.current) return;
    if (!enabled) { marker.current.scale.setScalar(1); return; }
    marker.current.updateWorldMatrix(true, false);
    camera.updateMatrixWorld();
    marker.current.getWorldPosition(point).applyMatrix4(camera.matrixWorldInverse);
    const unitsPerPixel = 2 * Math.max(0.02, -point.z) * Math.tan((camera as PerspectiveCamera).fov * Math.PI / 360) / Math.max(1, size.height);
    marker.current.scale.setScalar(Math.min(1.5, pixels * unitsPerPixel / radius));
  });
  return <group ref={marker}>{children}</group>;
}

export function GlobeCamera({ view, globe }: { view: GlobeView; globe: RefObject<Group | null> }) {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    if (!size.width || !size.height) return;
    const lens = camera as PerspectiveCamera, vertical = 39 * Math.PI / 360;
    const horizontal = Math.atan(Math.tan(vertical) * size.width / size.height);
    lens.fov = view.fov;
    lens.position.set(0, 0, 1.15 / Math.sin(Math.min(vertical, horizontal)) / view.zoom);
    lens.lookAt(0, 0, 0); lens.updateProjectionMatrix(); invalidate();
  }, [camera, size.width, size.height, view.fov, view.zoom, invalidate]);
  useEffect(() => { if (view.autoRotate) invalidate(); }, [view.autoRotate, invalidate]);
  useFrame((_, delta) => {
    if (!view.autoRotate || !globe.current) return;
    globe.current.rotation.y += Math.min(delta, 0.05) * 0.12; invalidate();
  });
  return null;
}

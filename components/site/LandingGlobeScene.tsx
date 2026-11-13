"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { DoubleSide, MathUtils, Quaternion, SRGBColorSpace, TextureLoader, Vector3, type Group, type PerspectiveCamera } from "three";
import { landingView, marsSurfacePosition, type MarsRoverSite } from "@/lib/landing-sites";
import { getRouteSnapshot, routeCoordinates, type JourneyData } from "@/lib/mars-journeys";

export type MarsGlobeView = { zoom: number; fov: number; autoRotate: boolean };

export type LandingMarkerProjection = { siteId: string; x: number; y: number };

type Props = {
  site: MarsRoverSite;
  sites: readonly MarsRoverSite[];
  focusVersion: number;
  globe: RefObject<Group | null>;
  redraw: RefObject<(() => void) | null>;
  onReady: () => void;
  onError: () => void;
  view?: MarsGlobeView;
  journey?: JourneyData;
  focusPoint?: { latitude: number; longitude: number };
  cancelFocus: RefObject<(() => void) | null>;
  referenceSite?: MarsRoverSite;
  onProjectReference?: (point: LandingMarkerProjection | null) => void;
  onProjectMarker?: (point: LandingMarkerProjection | null) => void;
  pickSite?: RefObject<((x: number, y: number) => MarsRoverSite | undefined) | null>;
};

function WindowCamera({ view, globe, moving }: { view: MarsGlobeView; globe: RefObject<Group | null>; moving: RefObject<boolean> }) {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    if (!size.width || !size.height) return;
    const lens = camera as PerspectiveCamera;
    lens.fov = view.fov;
    const vertical = 39 * Math.PI / 360;
    const horizontal = Math.atan(Math.tan(vertical) * size.width / Math.max(1, size.height));
    // Fit to the smaller dimension, so portrait and landscape both show the whole globe.
    lens.position.set(0, 0, 1.15 / Math.sin(Math.min(vertical, horizontal)) / view.zoom);
    lens.lookAt(0, 0, 0);
    lens.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, view.fov, view.zoom, invalidate]);
  useEffect(() => { if (view.autoRotate) invalidate(); }, [view.autoRotate, invalidate]);
  useFrame((_, delta) => {
    if (!view.autoRotate || !globe.current || moving.current) return;
    globe.current.rotation.y += Math.min(delta, 0.05) * 0.12;
    invalidate();
  });
  return null;
}

function JourneyTrack({ data, color }: { data: JourneyData; color: string }) {
  const vertices = useMemo(() => {
    const points: number[] = [];
    for (const segment of data.segments) {
      for (let i = 1; i < segment.length; i++) {
        for (const point of [segment[i - 1], segment[i]]) {
          points.push(...marsSurfacePosition(routeCoordinates(point)).map((value) => value * 1.006));
        }
      }
    }
    return new Float32Array(points);
  }, [data]);
  return <lineSegments>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[vertices, 3]} /></bufferGeometry>
    <lineBasicMaterial color={color} toneMapped={false} />
  </lineSegments>;
}

function EndpointMarker({ site }: { site: MarsRoverSite }) {
  const snapshot = getRouteSnapshot(site.id);
  if (!snapshot) return null;
  const normal = new Vector3(...marsSurfacePosition(routeCoordinates(snapshot.last)));
  const orientation = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);
  return <mesh name={`last-position-${site.id}`} position={normal.multiplyScalar(1.019)} quaternion={orientation}>
    <circleGeometry args={[0.018, 4]} />
    <meshBasicMaterial color={site.color} side={DoubleSide} toneMapped={false} />
  </mesh>;
}

function LandingMarker({ site, selected }: { site: MarsRoverSite; selected: boolean }) {
  const normal = new Vector3(...marsSurfacePosition(site));
  const orientation = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);
  return (
    <group name={`landing-marker-${site.id}`} position={normal.multiplyScalar(1.012)} quaternion={orientation}>
      {site.approximate ? Array.from({ length: 8 }, (_, index) => (
        <mesh key={index}>
          <ringGeometry args={[0.04, 0.056, 6, 1, index * Math.PI / 4, Math.PI / 6]} />
          <meshBasicMaterial color={site.color} side={DoubleSide} toneMapped={false} />
        </mesh>
      )) : <mesh>
        <ringGeometry args={[0.04, 0.056, 40]} />
        <meshBasicMaterial color={site.color} side={DoubleSide} toneMapped={false} />
      </mesh>}
      {!site.approximate && <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[0.013, 20]} />
        <meshBasicMaterial color={site.color} side={DoubleSide} toneMapped={false} />
      </mesh>}
      {selected && <mesh position={[0, 0, 0.003]}>
        <ringGeometry args={[0.072, 0.081, 48]} />
        <meshBasicMaterial color="white" side={DoubleSide} toneMapped={false} />
      </mesh>}
    </group>
  );
}

function MarsSurface({
  site, sites, focusVersion, globe, redraw, onReady, onError, journey, focusPoint,
  cancelFocus, onProjectMarker, referenceSite, onProjectReference, pickSite, moving,
}: Props & { moving: RefObject<boolean> }) {
  const map = useLoader(TextureLoader, "/models/mars/viking-global.jpg");
  const { invalidate, gl, camera, size } = useThree();
  const initialFocus = useRef(true);
  const transition = useRef({ fromPitch: 0, fromYaw: 0, pitch: 0, yaw: 0, elapsed: 0 });
  const marker = useMemo(() => new Vector3(...marsSurfacePosition(site)).multiplyScalar(1.012), [site]);
  const reference = useMemo(() => referenceSite ? new Vector3(...marsSurfacePosition(referenceSite)).multiplyScalar(1.012) : null, [referenceSite]);
  const projected = useMemo(() => new Vector3(), []);
  map.colorSpace = SRGBColorSpace;

  useLayoutEffect(() => {
    const rotation = globe.current?.rotation;
    if (!rotation) return;
    const { pitch, yaw } = landingView(focusPoint ?? site);
    const yawDelta = MathUtils.euclideanModulo(yaw - rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    const targetYaw = rotation.y + yawDelta;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    moving.current = !initialFocus.current && !reducedMotion &&
      (Math.abs(yawDelta) > 0.001 || Math.abs(pitch - rotation.x) > 0.001);
    initialFocus.current = false;
    if (moving.current) {
      transition.current = { fromPitch: rotation.x, fromYaw: rotation.y, pitch, yaw: targetYaw, elapsed: 0 };
      onProjectMarker?.(null);
    } else {
      rotation.set(pitch, targetYaw, 0, "XYZ");
    }
    invalidate();
  }, [site, focusPoint, focusVersion, globe, invalidate, moving, onProjectMarker]);

  useEffect(() => {
    cancelFocus.current = () => { moving.current = false; };
    return () => { cancelFocus.current = null; moving.current = false; };
  }, [cancelFocus, moving]);

  useEffect(() => {
    if (!pickSite) return;
    const point = new Vector3();
    pickSite.current = (x, y) => {
      const group = globe.current;
      if (!group || moving.current || !size.width || !size.height) return;
      group.updateWorldMatrix(true, false);
      let closest = 16;
      let hit: MarsRoverSite | undefined;
      for (const entry of sites) {
        point.set(...marsSurfacePosition(entry)).multiplyScalar(1.012).applyMatrix4(group.matrixWorld);
        if (point.dot(camera.position) <= point.lengthSq()) continue;
        point.project(camera);
        const distance = Math.hypot((point.x + 1) * size.width / 2 - x, (1 - point.y) * size.height / 2 - y);
        if (distance < closest) { closest = distance; hit = entry; }
      }
      return hit;
    };
    return () => { pickSite.current = null; };
  }, [camera, globe, moving, pickSite, sites, size.height, size.width]);

  useFrame((_, delta) => {
    const group = globe.current;
    if (!group) return;
    if (moving.current) {
      const turn = transition.current;
      turn.elapsed += Math.min(delta, 0.05);
      const progress = Math.min(turn.elapsed / 0.65, 1);
      const eased = progress * progress * (3 - 2 * progress);
      group.rotation.set(MathUtils.lerp(turn.fromPitch, turn.pitch, eased),
        MathUtils.lerp(turn.fromYaw, turn.yaw, eased), 0, "XYZ");
      moving.current = progress < 1;
      if (moving.current) invalidate();
    }
    if (!onProjectMarker && !onProjectReference) return;
    group.updateWorldMatrix(true, false);

    const project = (position: Vector3, siteId: string): LandingMarkerProjection | null => {
      if (!size.width || !size.height) return null;
      projected.copy(position).applyMatrix4(group.matrixWorld);
      // A hidden surface point must never have a leader drawn through Mars.
      if (projected.dot(camera.position) <= projected.lengthSq()) return null;
      projected.project(camera);
      if (Math.abs(projected.x) >= 1 || Math.abs(projected.y) >= 1 || projected.z <= -1 || projected.z >= 1) return null;
      return { siteId, x: (projected.x + 1) / 2, y: (1 - projected.y) / 2 };
    };

    if (onProjectMarker) onProjectMarker(moving.current ? null : project(marker, site.id));
    if (onProjectReference && referenceSite && reference) onProjectReference(project(reference, referenceSite.id));
  });

  useEffect(() => {
    const canvas = gl.domElement;
    redraw.current = invalidate;
    canvas.addEventListener("webglcontextlost", onError);
    onReady();
    return () => {
      redraw.current = null;
      canvas.removeEventListener("webglcontextlost", onError);
    };
  }, [gl, invalidate, onError, onReady, redraw]);

  return (
    <group ref={globe}>
      <mesh>
        <sphereGeometry args={[1, 64, 40]} />
        <meshStandardMaterial map={map} roughness={1} />
      </mesh>
      {sites.map((entry) => <LandingMarker key={entry.id} site={entry} selected={entry.id === site.id} />)}
      {sites.map((entry) => <EndpointMarker key={entry.id} site={entry} />)}
      {journey && <JourneyTrack data={journey} color={site.color} />}
    </group>
  );
}

export default function MarsGlobeScene(props: Props) {
  const moving = useRef(false);
  return (
    <Canvas aria-hidden="true" camera={{ position: [0, 0, 3.8], fov: 39 }}
      dpr={[1, 1.75]} frameloop="demand">
      <ambientLight intensity={0.85} />
      <directionalLight position={[-3, 4, 6]} intensity={2} />
      {props.view && <WindowCamera view={props.view} globe={props.globe} moving={moving} />}
      <Suspense fallback={null}><MarsSurface {...props} moving={moving} /></Suspense>
    </Canvas>
  );
}

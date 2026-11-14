"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, type RefObject } from "react";
import { DoubleSide, MathUtils, Quaternion, Vector3, type Group } from "three";
import { GLOBE_MAPS, landingView, type LandingGlobeData, type LandingSite } from "@/lib/mission-landing-sites";
import type { GlobeView, SurfaceStatus } from "@/lib/globe-surface";
import { GlobeCamera, GlobeLighting, GlobeSurface, SurfaceMarkerSize } from "./GlobeSurface";

type Props = {
  data: LandingGlobeData; site?: LandingSite; globe: RefObject<Group | null>; redraw: RefObject<(() => void) | null>;
  view?: GlobeView; focusVersion?: number; onReady?: () => void; onError?: () => void;
  detailAttempt?: number; onDetailStatus?: (status: SurfaceStatus) => void;
};

function Surface({ data, site = data.sites[0], globe, redraw, focusVersion, onReady, onError, view, detailAttempt, onDetailStatus }: Props) {
  const { invalidate, gl } = useThree();
  useLayoutEffect(() => {
    if (!globe.current) return;
    const { pitch, yaw } = landingView(site);
    globe.current.rotation.set(pitch, yaw, 0, "XYZ"); invalidate();
  }, [site, focusVersion, globe, invalidate]);
  useEffect(() => {
    redraw.current = invalidate;
    const canvas = gl.domElement;
    if (onError) canvas.addEventListener("webglcontextlost", onError);
    onReady?.();
    return () => { redraw.current = null; if (onError) canvas.removeEventListener("webglcontextlost", onError); };
  }, [gl, invalidate, redraw, onReady, onError]);

  return (
    <group ref={globe}>
      <GlobeSurface world={data.world} image={GLOBE_MAPS[data.world].image} detailed={!!view} relief={view?.relief}
        attempt={detailAttempt} onDetailStatus={onDetailStatus} />
      {data.sites.map((site) => {
        // SphereGeometry maps the left edge of the NASA maps (-180°) to -X.
        const lat = MathUtils.degToRad(site.latitude);
        const lon = MathUtils.degToRad(site.longitude);
        const normal = new Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
        const turn = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);
        return (
          <group key={site.name} position={normal.multiplyScalar(1.012)} quaternion={turn}>
            <SurfaceMarkerSize enabled={!!view} radius={0.069} pixels={16}>
            <mesh>
              <ringGeometry args={[0.052, 0.069, 48]} />
              <meshBasicMaterial color={site.color} side={DoubleSide} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0.003]}>
              <circleGeometry args={[0.017, 24]} />
              <meshBasicMaterial color={site.color} side={DoubleSide} toneMapped={false} />
            </mesh>
            </SurfaceMarkerSize>
          </group>
        );
      })}
    </group>
  );
}

export default function MissionGlobeScene(props: Props) {
  return (
    <Canvas
      aria-hidden="true"
      resize={{ offsetSize: true }}
      camera={{ position: [0, 0, 3.8], fov: 39 }}
      dpr={[1, 1.75]}
      frameloop="demand"
    >
      <GlobeLighting view={props.view} />
      {props.view && <GlobeCamera view={props.view} globe={props.globe} />}
      <Suspense fallback={null}><Surface {...props} /></Suspense>
    </Canvas>
  );
}

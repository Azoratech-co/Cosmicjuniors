"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { Suspense, type RefObject } from "react";
import { DoubleSide, MathUtils, Quaternion, SRGBColorSpace, TextureLoader, Vector3, type Group } from "three";
import { landingView, type MarsLandingSite } from "@/lib/mars-landing-sites";

function MarsSurface({ site, globe }: { site: MarsLandingSite; globe: RefObject<Group | null> }) {
  const map = useLoader(TextureLoader, "/models/mars/viking-global.jpg");
  map.colorSpace = SRGBColorSpace;
  const { pitch, yaw } = landingView(site);
  // SphereGeometry maps the left edge of the NASA mosaic (-180°) to -X.
  const longitude = MathUtils.degToRad(site.longitude);
  const normal = new Vector3(Math.cos(pitch) * Math.cos(longitude), Math.sin(pitch), -Math.cos(pitch) * Math.sin(longitude));
  const markerOrientation = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);

  return (
    <group ref={globe} rotation={[pitch, yaw, 0, "XYZ"]}>
      <mesh>
        <sphereGeometry args={[1, 64, 40]} />
        <meshStandardMaterial map={map} roughness={1} />
      </mesh>
      <mesh position={normal.clone().multiplyScalar(1.012)} quaternion={markerOrientation}>
        <ringGeometry args={[0.052, 0.069, 48]} />
        <meshBasicMaterial color={site.color} side={DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={normal.clone().multiplyScalar(1.015)} quaternion={markerOrientation}>
        <circleGeometry args={[0.017, 24]} />
        <meshBasicMaterial color={site.color} side={DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function MarsGlobeScene({ site, globe, redraw }: {
  site: MarsLandingSite;
  globe: RefObject<Group | null>;
  redraw: RefObject<(() => void) | null>;
}) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0, 3.8], fov: 39 }}
      dpr={[1, 1.75]}
      frameloop="demand"
      onCreated={({ invalidate }) => { redraw.current = invalidate; }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[-3, 4, 6]} intensity={2} />
      <Suspense fallback={null}><MarsSurface site={site} globe={globe} /></Suspense>
    </Canvas>
  );
}

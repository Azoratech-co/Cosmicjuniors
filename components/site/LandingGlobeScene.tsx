"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { Suspense, type RefObject } from "react";
import { DoubleSide, MathUtils, Quaternion, SRGBColorSpace, TextureLoader, Vector3, type Group } from "three";
import { GLOBE_MAPS, landingView, type LandingGlobeData } from "@/lib/landing-sites";

function Surface({ data, globe }: { data: LandingGlobeData; globe: RefObject<Group | null> }) {
  const map = useLoader(TextureLoader, GLOBE_MAPS[data.world].image);
  map.colorSpace = SRGBColorSpace;
  const { pitch, yaw } = landingView(data.sites[0]);

  return (
    <group ref={globe} rotation={[pitch, yaw, 0, "XYZ"]}>
      <mesh>
        <sphereGeometry args={[1, 64, 40]} />
        <meshStandardMaterial map={map} roughness={1} />
      </mesh>
      {data.sites.map((site) => {
        // SphereGeometry maps the left edge of the NASA maps (-180°) to -X.
        const lat = MathUtils.degToRad(site.latitude);
        const lon = MathUtils.degToRad(site.longitude);
        const normal = new Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
        const turn = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);
        return (
          <group key={site.name}>
            <mesh position={normal.clone().multiplyScalar(1.012)} quaternion={turn}>
              <ringGeometry args={[0.052, 0.069, 48]} />
              <meshBasicMaterial color={site.color} side={DoubleSide} toneMapped={false} />
            </mesh>
            <mesh position={normal.clone().multiplyScalar(1.015)} quaternion={turn}>
              <circleGeometry args={[0.017, 24]} />
              <meshBasicMaterial color={site.color} side={DoubleSide} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function LandingGlobeScene({ data, globe, redraw }: {
  data: LandingGlobeData;
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
      <Suspense fallback={null}><Surface data={data} globe={globe} /></Suspense>
    </Canvas>
  );
}

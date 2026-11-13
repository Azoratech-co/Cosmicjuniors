"use client";

import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Box3, BufferGeometry, EdgesGeometry, Float32BufferAttribute, MathUtils, Mesh, PMREMGenerator, Raycaster, Sphere, Spherical, Vector3, type Group, type PerspectiveCamera } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { RoverModel, RoverPart } from "@/lib/rover-models";

const fieldOfView = 36;

export type RoverCameraControls = {
  rotate: (horizontal: number, vertical: number) => void;
  zoom: (factor: number) => void;
  focus: (part: RoverPart) => void;
  /** Deselect the part (no highlight, no label) without moving the camera. */
  clear: () => void;
  reset: () => void;
};

export type PartProjection = { x: number; y: number; width: number; height: number; zoom: number; visible: boolean };

function getPartGeometry(object: Group, definitions: readonly RoverPart[]) {
  const parts = new Map<RoverPart, number[]>();
  const triangle = [new Vector3(), new Vector3(), new Vector3()];
  object.updateMatrixWorld(true);

  object.traverse((node) => {
    if (!(node instanceof Mesh) || Array.isArray(node.material)) return;
    const material = node.material.name;
    const regions = definitions.flatMap((part) => part.highlight
      .filter((region) => (!region.materials || region.materials.includes(material)) &&
        (!region.nodePrefix || node.name.startsWith(region.nodePrefix)))
      .map((region) => ({ part, region })));
    if (!regions.length) return;

    const positions = node.geometry.getAttribute("position");
    const indices = node.geometry.getIndex();
    for (let offset = 0; offset < (indices?.count ?? positions.count); offset += 3) {
      triangle.forEach((vertex, index) => {
        vertex.fromBufferAttribute(positions, indices?.getX(offset + index) ?? offset + index);
        vertex.applyMatrix4(node.matrixWorld);
      });
      for (const { part, region } of regions) {
        const { bounds, cylinders, outsideCylinders } = region;
        if (bounds && !triangle.every(({ x, y, z }) =>
          x >= bounds.min[0] && y >= bounds.min[1] && z >= bounds.min[2] &&
          x <= bounds.max[0] && y <= bounds.max[1] && z <= bounds.max[2])) continue;
        if (cylinders) {
          const inside = cylinders.some(({ center, halfWidth, radius }) => triangle.every(({ x, y, z }) =>
            Math.abs(x - center[0]) <= halfWidth && Math.hypot(y - center[1], z - center[2]) <= radius));
          if (inside === !!outsideCylinders) continue;
        }
        const vertices = parts.get(part) ?? [];
        for (const { x, y, z } of triangle) vertices.push(x, y, z);
        parts.set(part, vertices);
        break;
      }
    }
  });

  return Array.from(parts, ([part, vertices]) => {
    const surface = new BufferGeometry();
    surface.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    return { id: part.id, surface, edges: new EdgesGeometry(surface, 37) };
  });
}

type Props = {
  model: RoverModel;
  controls: RefObject<RoverCameraControls | null>;
  onReady: () => void;
  onError: () => void;
  highlight: boolean;
  /** How far to slide the rover to the left, as a share of the canvas width (0 = centered). */
  shift: number;
  onProject: (projection: PartProjection) => void;
};

function RoverModelScene({ model, controls, onReady, onError, highlight, onProject, shift }: Props) {
  const gltf = useLoader(GLTFLoader, model.model);
  const { camera, size, invalidate, gl, scene } = useThree();
  const { object, center, radius } = useMemo(() => {
    const object = gltf.scene.clone(true);
    const sphere = new Box3().setFromObject(object, true).getBoundingSphere(new Sphere());
    if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) {
      throw new Error("The rover has no measurable geometry.");
    }
    return { object, center: sphere.center, radius: sphere.radius };
  }, [gltf.scene]);

  const initialAzimuth = MathUtils.degToRad(model.view.azimuth);
  const initialPolar = MathUtils.degToRad(model.view.polar);
  const orbit = useRef({ azimuth: initialAzimuth, polar: initialPolar, zoom: 1, target: center });
  const selected = useRef<RoverPart | null>(null);
  const shiftNow = useRef(shift);
  const redraw = useRef<((moving?: boolean) => void) | null>(null);
  const highlightGroups = useRef(new Map<string, Group>());
  const partGeometries = useMemo(() => getPartGeometry(object, model.partsGuide?.parts ?? []),
    [model.partsGuide, object]);

  useEffect(() => () => {
    for (const { surface, edges } of partGeometries) {
      surface.dispose();
      edges.dispose();
    }
  }, [partGeometries]);

  const updateHighlight = useCallback((part: RoverPart | null, enabled: boolean) => {
    for (const [id, group] of highlightGroups.current) group.visible = enabled && part?.id === id;
    invalidate();
  }, [invalidate]);

  useEffect(() => {
    updateHighlight(selected.current, highlight);
  }, [highlight, updateHighlight]);
  const highlightEnabled = useRef(highlight);
  useLayoutEffect(() => { highlightEnabled.current = highlight; }, [highlight]);

  useLayoutEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    const verticalAngle = MathUtils.degToRad(fieldOfView / 2);
    const horizontalAngle = Math.atan(Math.tan(verticalAngle) * size.width / size.height);
    const fitDistance = 1.06 * radius / Math.sin(Math.min(verticalAngle, horizontalAngle));
    const spherical = new Spherical();
    const position = new Vector3();
    const anchor = new Vector3();
    const projected = new Vector3();
    const direction = new Vector3();
    const ray = new Raycaster();
    let frame = 0;

    function updateCamera(moving = false) {
      const { azimuth, polar, zoom, target } = orbit.current;
      // slide the picture sideways (the rover moves left to make room for the label)
      const lens = camera as PerspectiveCamera;
      if (shiftNow.current > 0.0005) lens.setViewOffset(size.width, size.height, shiftNow.current * size.width, 0, size.width, size.height);
      else if (lens.view?.enabled) lens.clearViewOffset();
      spherical.set(fitDistance * zoom, polar, azimuth);
      camera.position.copy(position.setFromSpherical(spherical).add(target));
      camera.lookAt(target);
      camera.updateMatrixWorld();
      if (selected.current) {
        anchor.set(...selected.current.target);
        projected.copy(anchor).project(camera);
        direction.subVectors(anchor, camera.position);
        const distance = direction.length();
        ray.set(camera.position, direction.normalize());
        ray.far = Math.max(0, distance - radius * 0.045);
        const angleFromPartView = Math.abs(MathUtils.euclideanModulo(
          azimuth - MathUtils.degToRad(selected.current.view.azimuth) + Math.PI, 2 * Math.PI,
        ) - Math.PI);
        const nearPartView = angleFromPartView < 0.3 &&
          Math.abs(polar - MathUtils.degToRad(selected.current.view.polar)) < 0.25;
        const edge = nearPartView ? 1.12 : 0.98;
        const visible = !moving && angleFromPartView < Math.PI * 0.46 &&
          Math.abs(projected.x) < edge && Math.abs(projected.y) < edge && projected.z < 1 &&
          (nearPartView || ray.intersectObject(object, true).length === 0);
        onProject({
          x: (MathUtils.clamp(projected.x, -0.98, 0.98) + 1) * size.width / 2,
          y: (1 - MathUtils.clamp(projected.y, -0.98, 0.98)) * size.height / 2,
          ...size,
          zoom: 1 / zoom,
          visible,
        });
      } else {
        onProject({ x: 0, y: 0, ...size, zoom: 1 / zoom, visible: false });
      }
      invalidate();
    }

    function turnTo(azimuth: number, polar: number, target: Vector3) {
      cancelAnimationFrame(frame);
      const start = { ...orbit.current, target: orbit.current.target.clone() };
      const delta = MathUtils.euclideanModulo(azimuth - start.azimuth + Math.PI, 2 * Math.PI) - Math.PI;
      const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 :
        MathUtils.clamp(330 + Math.abs(delta) * 125, 330, 700);
      const started = performance.now();
      const update = (now: number) => {
        const progress = duration ? MathUtils.clamp((now - started) / duration, 0, 1) : 1;
        const eased = progress * progress * (3 - 2 * progress);
        orbit.current.azimuth = start.azimuth + delta * eased;
        orbit.current.polar = MathUtils.lerp(start.polar, polar, eased);
        orbit.current.target = start.target.clone().lerp(target, eased);
        updateCamera(progress < 1);
        if (progress < 1) frame = requestAnimationFrame(update);
      };
      update(started);
    }

    controls.current = {
      rotate(horizontal, vertical) {
        cancelAnimationFrame(frame);
        orbit.current.azimuth = MathUtils.euclideanModulo(orbit.current.azimuth + horizontal, 2 * Math.PI);
        orbit.current.polar = MathUtils.clamp(orbit.current.polar + vertical, 0.25, 1.74);
        updateCamera();
      },
      zoom(factor) {
        orbit.current.zoom = MathUtils.clamp(orbit.current.zoom * factor, 0.59, 1.6);
        updateCamera();
      },
      focus(part) {
        selected.current = part;
        updateHighlight(part, highlightEnabled.current);
        turnTo(MathUtils.degToRad(part.view.azimuth), MathUtils.degToRad(part.view.polar), center);
      },
      clear() {
        selected.current = null;
        updateHighlight(null, false);
        updateCamera();
      },
      reset() {
        selected.current = null;
        updateHighlight(null, false);
        turnTo(initialAzimuth, initialPolar, center);
      },
    };
    redraw.current = updateCamera;
    updateCamera();
    return () => {
      cancelAnimationFrame(frame);
      controls.current = null;
      redraw.current = null;
    };
  }, [camera, center, controls, initialAzimuth, initialPolar, invalidate, object, onProject, radius, size, updateHighlight]);

  // glide the rover sideways when a part is picked or cleared
  useEffect(() => {
    let frame = 0;
    const from = shiftNow.current;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 560;
    const started = performance.now();
    const step = (now: number) => {
      const progress = duration ? MathUtils.clamp((now - started) / duration, 0, 1) : 1;
      const eased = progress * progress * (3 - 2 * progress);
      shiftNow.current = from + (shift - from) * eased;
      redraw.current?.(progress < 1);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    step(started);
    return () => cancelAnimationFrame(frame);
  }, [shift]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", onError);
    const room = new RoomEnvironment();
    const generator = new PMREMGenerator(gl);
    const environment = generator.fromScene(room, 0.04, 0.1, 100, { size: 128 });
    generator.dispose();
    room.dispose();
    scene.environment = environment.texture;
    invalidate();
    onReady();

    return () => {
      canvas.removeEventListener("webglcontextlost", onError);
      scene.environment = null;
      environment.dispose();
    };
  }, [gl, invalidate, onError, onReady, scene]);

  return (
    <>
      <hemisphereLight args={["#fff6e9", "#8c6555", 1.2]} />
      <directionalLight position={[3, 5, -4]} intensity={2.4} />
      <directionalLight position={[-4, 2, 3]} intensity={1.2} />
      <primitive object={object} dispose={null} />
      {partGeometries.map(({ id, surface, edges }) => (
        <group key={id} visible={false} ref={(group) => {
          if (group) highlightGroups.current.set(id, group);
          else highlightGroups.current.delete(id);
        }}>
          <mesh geometry={surface} renderOrder={1}>
            <meshBasicMaterial color="#ff2948" toneMapped={false} transparent opacity={0.26} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
          <lineSegments geometry={edges} renderOrder={2}>
            <lineBasicMaterial color="#ff4c49" toneMapped={false} transparent opacity={0.9} depthWrite={false} />
          </lineSegments>
        </group>
      ))}
    </>
  );
}

export default function RoverScene(props: Props) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ fov: fieldOfView }}
      dpr={[1, 1.75]}
      frameloop="demand"
      gl={{ alpha: true, antialias: true }}
    >
      <Suspense fallback={null}>
        <RoverModelScene {...props} />
      </Suspense>
    </Canvas>
  );
}

export type GlobeWorld = "mars" | "moon";
export type GlobeView = { zoom: number; fov: number; autoRotate: boolean; relief: boolean; lightAngle: number };
export type SurfaceStatus = "loading" | "ready" | "failed";
export const initialGlobeView: GlobeView = { zoom: 1, fov: 39, autoRotate: false, relief: true, lightAngle: -35 };
export const globeRadii = { mars: 3396190, moon: 1737400 } as const;
export const surfaceReferences = {
  moon: { color: "https://svs.gsfc.nasa.gov/4720/", elevation: "https://svs.gsfc.nasa.gov/4720/", credit: "NASA SVS · LRO / LROC / LOLA" },
  mars: { color: "https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars", elevation: "https://pds-geosciences.wustl.edu/missions/mgs/megdr.html", credit: "NASA / JPL / USGS · Viking / MGS MOLA" },
} as const;

export function surfaceResolution(maxTextureSize: number, narrow: boolean, deviceMemory?: number) {
  const budget = narrow || !deviceMemory || deviceMemory < 4 ? 4096 : 8192;
  return maxTextureSize < 4096 ? 2048 : Math.min(budget, maxTextureSize) >= 8192 ? 8192 : 4096;
}

/** Binary grid is little-endian relative radii, meters, north row first. */
export function decodeShape(buffer: ArrayBuffer, width = 512, height = 256) {
  if (buffer.byteLength !== width * height * 4) throw new Error("Invalid terrain grid size");
  const data = new DataView(buffer), values = new Float32Array(width * height);
  for (let i = 0; i < values.length; i++) {
    const value = data.getFloat32(i * 4, true);
    if (!Number.isFinite(value) || Math.abs(value) > 40000) throw new Error("Invalid terrain radius");
    values[i] = value;
  }
  return values;
}

export function sampleShape(values: Float32Array, longitude: number, latitude: number, width = 512, height = 256) {
  if (Math.abs(latitude) >= 89.999999) {
    const row = latitude > 0 ? 0 : height - 1;
    let total = 0;
    for (let x = 0; x < width; x++) total += values[row * width + x];
    return total / width;
  }
  const x = (((longitude + 180) % 360 + 360) % 360) / 360 * width - 0.5;
  const y = Math.max(0, Math.min(height - 1, (90 - latitude) / 180 * height - 0.5));
  const ix = Math.floor(x), iy = Math.floor(y), dx = x - ix, dy = y - iy;
  const at = (col: number, row: number) => values[Math.min(height - 1, row) * width + ((col % width + width) % width)];
  return (at(ix, iy) * (1 - dx) + at(ix + 1, iy) * dx) * (1 - dy) +
    (at(ix, iy + 1) * (1 - dx) + at(ix + 1, iy + 1) * dx) * dy;
}

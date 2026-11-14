import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { decodeShape, globeRadii, sampleShape, surfaceResolution } from '../lib/globe-surface.ts';

for (const world of ['moon','mars']) {
 test(`${world}: bundled NASA surface resources and hashes are complete`, async () => {
  const base=new URL(`../public/models/${world}/surface/`,import.meta.url);
  const meta=JSON.parse(await readFile(new URL('sources.json',base)));
  assert.equal(meta.world,world);
  assert.equal(meta.referenceRadiusMeters,globeRadii[world]);
  assert.deepEqual(meta.extent,[-180,-90,180,90]);
  assert.equal(meta.files.length,6);
  for (const entry of meta.files) {
   const raw=await readFile(new URL(entry.file,base));
   assert.equal(raw.length,entry.bytes);
   assert.equal(createHash('sha256').update(raw).digest('hex'),entry.sha256);
  }
  assert.match(meta.credit,/NASA/);
  const raw=await readFile(new URL(meta.shape.file,base));
  const grid=decodeShape(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
  assert.equal(grid.length,512*256);
  for (const value of grid) assert.ok(Number.isFinite(value) && Math.abs(value)<40000);
  if (world==='mars') {
   assert.equal(meta.tiles.length,512);
   assert.equal(new Set(meta.tiles.map(t=>t.url)).size,512);
   assert.ok(meta.tiles.every(t=>new URL(t.url).hostname==='trek.nasa.gov'));
   // These opposite topographic landmarks catch a 180-degree offset or north/south inversion.
   assert.ok(sampleShape(grid,226.2,18.65)>15000,'Olympus Mons must be high');
   assert.ok(sampleShape(grid,70,-42)<-10000,'Hellas must be low');
  } else {
   assert.ok(sampleShape(grid,-11.36,-43.31)<-1000,'Tycho crater floor must be below the reference sphere');
   assert.ok(sampleShape(grid,-20.08,9.62)<-1000,'Copernicus crater floor must be below the reference sphere');
  }
 });
}

test('shape lookup wraps the seam, preserves north/east orientation and closes the poles', () => {
 const grid=new Float32Array([1,2,3,4,11,12,13,14]);
 assert.equal(sampleShape(grid,-135,45,4,2),1);
 assert.equal(sampleShape(grid,-45,45,4,2),2);
 assert.equal(sampleShape(grid,-135,-45,4,2),11);
 assert.equal(sampleShape(grid,-180,0,4,2),sampleShape(grid,180,0,4,2));
 assert.equal(sampleShape(grid,540,0,4,2),sampleShape(grid,-180,0,4,2));
 assert.equal(sampleShape(grid,0,90,4,2),2.5);
 assert.equal(sampleShape(grid,77,90,4,2),2.5);
 assert.equal(sampleShape(grid,0,-90,4,2),12.5);
});

test('terrain decoder rejects truncation, NaN and nonphysical relative radii', () => {
 assert.throws(()=>decodeShape(new ArrayBuffer(3),1,1));
 for (const value of [NaN,Infinity,50000]) {
  const raw=new ArrayBuffer(4);new DataView(raw).setFloat32(0,value,true);
  assert.throws(()=>decodeShape(raw,1,1));
 }
 const raw=new ArrayBuffer(4);new DataView(raw).setFloat32(0,-2500,true);
 assert.equal(decodeShape(raw,1,1)[0],-2500);
});

test('detail resolution respects GPU and phone memory limits', () => {
 assert.equal(surfaceResolution(16384,false,8),8192);
 assert.equal(surfaceResolution(16384,true,8),4096);
 assert.equal(surfaceResolution(16384,false,2),4096);
 assert.equal(surfaceResolution(4096,false,8),4096);
 assert.equal(surfaceResolution(2048,false,8),2048);
 assert.equal(surfaceResolution(8192,false,undefined),4096);
});

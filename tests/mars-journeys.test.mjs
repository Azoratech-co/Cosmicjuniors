import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { closestStopIndex, detailedCoordinates, getJourneyDefinition, getRouteSnapshot, mappedRoverIds, regionalPoint, solRange } from '../lib/mars-journeys.ts';

for (const id of mappedRoverIds) {
 test(`${id}: complete bundled records, geometry and source metadata are consistent`, async () => {
  const info = getRouteSnapshot(id);
  const data = JSON.parse(await readFile(new URL(`../public${info.file}`, import.meta.url)));
  assert.equal(data.schemaVersion, 1);
  assert.equal(data.roverId, id);
  assert.equal(data.stops.length, info.stopCount);
  assert.equal(data.segments.length, info.segmentCount);
  assert.equal(data.segments.reduce((n, s) => n + s.length, 0), info.coordinateCount);
  assert.deepEqual(data.stops[0], info.first);
  assert.deepEqual(data.stops.at(-1), info.last);
  assert.equal(Math.max(...data.stops.map(s => s[3])), info.maxRecordedSol);
  for (const point of [...data.stops, ...data.segments.flat()]) {
   assert.ok(Number.isFinite(point[0]) && point[0] >= 0 && point[0] < 360);
   assert.ok(Number.isFinite(point[1]) && Math.abs(point[1]) <= 90);
  }
  for (const stop of data.stops) {
   assert.equal(stop.length, 6);
   assert.ok(stop[2] <= stop[3]);
   assert.equal(typeof stop[4], 'string');
  }
  const delta = regionalPoint(data.segments.at(-1).at(-1), info.last);
  assert.ok(Math.hypot(...delta) < 50);
  for (const source of data.sources) {
   const url = new URL(source.url);
   assert.ok(url.hostname.endsWith('.nasa.gov') || url.hostname === 'an.rsl.wustl.edu');
   assert.match(source.sha256, /^[a-f0-9]{64}$/);
   assert.ok(source.bytes > 0);
  }
  const definition = getJourneyDefinition(id);
  assert.equal(definition.kind, 'mapped');
  for (const visit of definition.landmarks) {
   const position = closestStopIndex(data.stops, visit.sol);
   const stop = data.stops[position];
   assert.ok(Math.min(Math.abs(stop[2] - visit.sol), Math.abs(stop[3] - visit.sol)) < 30 || (stop[2] <= visit.sol && stop[3] >= visit.sol));
   assert.ok(new URL(visit.source).hostname.endsWith('.nasa.gov'));
  }
 });
}

test('only mapped endpoints get exact pins; imagery evidence and non-deployed rovers remain distinct', () => {
 assert.equal(mappedRoverIds.length, 4);
 for (const id of ['sojourner','zhurong']) {
  assert.equal(getRouteSnapshot(id), undefined);
  assert.equal(getJourneyDefinition(id).kind, 'imagery');
  assert.ok(getJourneyDefinition(id).images.length > 0);
 }
 for (const id of ['mars-2-prop-m','mars-3-prop-m']) {
  assert.equal(getRouteSnapshot(id), undefined);
  assert.equal(getJourneyDefinition(id).kind, 'not-deployed');
  assert.equal(getJourneyDefinition(id).landmarks.length, 0);
 }
 assert.equal(getJourneyDefinition('curiosity').contact, undefined);
 assert.equal(getJourneyDefinition('perseverance').contact, undefined);
 assert.equal(getJourneyDefinition('opportunity').contact.date, '2018-06-10');
 assert.equal(getJourneyDefinition('zhurong').contact.label, 'HiRISE observation');
});

test('a visit resolves to a recorded position even with stationary ranges and source sol inversions', () => {
 const stops = [[1,2,1,2,'0','0'],[2,3,5,8,'1','0'],[2,3,6,6,'1','1'],[2,3,5,9,'1','2']];
 assert.equal(closestStopIndex(stops, 7), 3);
 assert.equal(closestStopIndex(stops, 0), 0);
 assert.equal(closestStopIndex(stops, 100), 3);
 assert.equal(solRange(stops[0]), 'Sols 1–2');
 assert.equal(solRange(stops[2]), 'Sol 6');
});

test('regional plots preserve north/east orientation, wrap longitude and use Mars meters', () => {
 const origin = [359.99, 0];
 const east = regionalPoint([0.01,0], origin);
 assert.ok(Math.abs(east[0] - 1185.4939504) < 0.01);
 assert.equal(east[1], 0);
 assert.ok(regionalPoint([359.99,0.01], origin)[1] > 0);
 assert.ok(regionalPoint([359.98,0], origin)[0] < 0);
 assert.equal(detailedCoordinates([354.651023,-2.330925]), '2.33093° S, 354.65102° E');
});

test('bundled mission imagery matches the unmodified source bytes and credit manifest', async () => {
 const manifest = JSON.parse(await readFile(new URL('../public/models/mars/routes/media-sources.json', import.meta.url)));
 assert.equal(manifest.length, 3);
 for (const entry of manifest) {
  const bytes = await readFile(new URL(`../public/models/mars/routes/${entry.file}`, import.meta.url));
  assert.equal(bytes.length, entry.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
  assert.ok(new URL(entry.source).hostname.endsWith('.nasa.gov') || new URL(entry.source).hostname === 'static.uahirise.org');
  assert.match(entry.credit, /NASA/);
  assert.equal(bytes[0], 0xff);
  assert.equal(bytes[1], 0xd8);
 }
});

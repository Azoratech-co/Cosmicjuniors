import test from "node:test";
import assert from "node:assert/strict";
import { Euler, Vector3 } from "three";
import { formatLandingCoordinates, landingView, marsRoverSites, marsSurfacePosition, opportunityLanding } from "../lib/landing-sites.ts";

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test("all eight sent rovers are accounted for, with six explorers and two undeployed attempts", () => {
  assert.deepEqual(marsRoverSites.filter((site) => site.outcome === "explored").map((site) => site.id),
    ["sojourner", "spirit", "opportunity", "curiosity", "perseverance", "zhurong"]);
  assert.deepEqual(marsRoverSites.filter((site) => site.outcome === "not-deployed").map((site) => site.id),
    ["mars-2-prop-m", "mars-3-prop-m"]);
  assert.equal(marsRoverSites.find((site) => site.id === "opportunity"), opportunityLanding);
  assert.equal(new Set(marsRoverSites.map((site) => site.id)).size, 8);
  assert.equal(new Set(marsRoverSites.map((site) => site.color)).size, 8);
  for (const site of marsRoverSites) {
    assert.ok(site.latitude >= -90 && site.latitude <= 90);
    assert.ok(site.longitude >= 0 && site.longitude < 360);
    assert.equal(site.approximate, site.outcome === "not-deployed");
    assert.match(site.arrivalDate, /^\d{4}-\d{2}-\d{2}$/);
    for (const source of [site.source, site.coordinateSource]) {
      const hostname = new URL(source).hostname;
      assert.ok(hostname === "nasa.gov" || hostname.endsWith(".nasa.gov"));
    }
  }
});

test("the globe uses east-positive longitude and north-positive latitude", () => {
  for (const [latitude, longitude, expected] of [
    [0, 0, [1, 0, 0]], [0, 90, [0, 0, -1]], [0, 180, [-1, 0, 0]],
    [0, 270, [0, 0, 1]], [90, 0, [0, 1, 0]], [-90, 0, [0, -1, 0]],
  ]) {
    marsSurfacePosition({ latitude, longitude }).forEach((value, index) => near(value, expected[index]));
  }
});

test("selecting every rover places its marker at the globe's front center", () => {
  for (const site of marsRoverSites) {
    const position = new Vector3(...marsSurfacePosition(site));
    near(position.length(), 1);
    const { pitch, yaw } = landingView(site);
    position.applyEuler(new Euler(pitch, yaw, 0, "XYZ"));
    near(position.x, 0);
    near(position.y, 0);
    near(position.z, 1);
  }
});

test("equivalent east/west and wrapped longitudes place the same marker", () => {
  const expected = marsSurfacePosition({ latitude: -1.9483, longitude: 354.47417 });
  for (const longitude of [-5.52583, 714.47417]) {
    marsSurfacePosition({ latitude: -1.9483, longitude }).forEach((value, index) => near(value, expected[index]));
  }
});

test("coordinate labels distinguish hemispheres and coarse arrival estimates", () => {
  assert.equal(formatLandingCoordinates(opportunityLanding), "1.95° S, 354.47° E");
  assert.equal(formatLandingCoordinates({ latitude: 19.47, longitude: -33.25 }), "19.47° N, 326.75° E");
  assert.equal(formatLandingCoordinates({ latitude: -45, longitude: 202 }, true), "Approx. 45° S, 202° E");
});

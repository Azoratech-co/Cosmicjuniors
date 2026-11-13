# Mars rover arrival sites

Researched against NASA sources on 2026-11-13. This module appears on
`/explorers/opportunity`. It shows historical landing/arrival locations, **not
current or final rover positions**. It is an educational globe, not a live tracker.

## Scope and coordinates

Six rovers successfully explored the surface. Two earlier Soviet PrOP-M rovers
were also sent to Mars in 1971, but neither explored the surface. Both attempts
are included with dashed markers and explicit approximate-location labels.
Stationary landers (including Viking, Phoenix and InSight), Ingenuity (a
helicopter), and missions not yet launched are outside this rover catalogue.

All factual and coordinate sources used for this addition are hosted by NASA.

| Rover | Agency / country | Arrival date (UTC) | Latitude (north positive) | Longitude (east positive) | Location | Coordinate source |
| --- | --- | --- | --- | --- | --- | --- |
| Sojourner, aboard Pathfinder | NASA / USA | 1997-07-04 | 19.47 | 326.75 | Ares Vallis / Carl Sagan Memorial Station | [NASA Mars24](https://www.giss.nasa.gov/tools/mars24/help/landers.html) |
| Spirit | NASA / USA | 2004-01-04 | -14.5692 | 175.4729 | Gusev Crater / Columbia Memorial Station | [NASA Spirit mission history](https://science.nasa.gov/mission/mer-spirit/) |
| Opportunity | NASA / USA | 2004-01-25 | -1.9483 | 354.47417 | Eagle Crater, Meridiani Planum | [NASA Opportunity mission history](https://science.nasa.gov/mission/mer-opportunity/) |
| Curiosity | NASA / USA | 2012-08-06 | -4.5895 | 137.4417 | Gale Crater / Bradbury Landing | [NASA NTRS, MSL EDL assessment](https://ntrs.nasa.gov/citations/20130010129) |
| Perseverance | NASA / USA | 2021-02-18 | 18.44463 | 77.45088 | Jezero Crater / Octavia E. Butler Landing | [NASA NTRS, Mars 2020 EDL assessment](https://ntrs.nasa.gov/citations/20210024644) |
| Zhurong, aboard Tianwen-1 | CNSA / China | 2021-05-14 | 25.07 | 109.93 | Southern Utopia Planitia | [NASA Mars24](https://www.giss.nasa.gov/tools/mars24/help/landers.html) |
| PrOP-M, aboard Mars 2 | Soviet Union | 1971-11-27 | about -45 | about 47 | Approximate lander impact site, Hellas Planitia | [NASA Mars24](https://www.giss.nasa.gov/tools/mars24/help/landers.html) |
| PrOP-M, aboard Mars 3 | Soviet Union | 1971-12-02 | about -45 | about 202 | Approximate lander site, Ptolemaeus Crater / Terra Sirenum | [NASA Mars24](https://www.giss.nasa.gov/tools/mars24/help/landers.html) |

Dates use UTC consistently. Zhurong's May 14 UTC arrival was May 15 in China;
Spirit's January 4 UTC arrival was January 3 in US Pacific time. Do not replace
these with local dates without changing the UTC label.

NASA Mars24 reports rounded coordinates for Sojourner and Zhurong. Their input
precision remains two decimals; the two Soviet estimates remain whole degrees.
More digits in other records reproduce the cited source, not a guarantee of
survey precision. The visible list rounds successful landing sites to two
decimals for readability. The original Opportunity input is preserved.

The PrOP-M coordinates belong to their **landers**, not independently located
rovers. Mars 2 crashed. Mars 3 soft-landed but stopped transmitting after about
20 seconds and could not deploy its rover. NASA gives approximate lander
coordinates without a numerical uncertainty radius. Dashed symbols indicate
uncertain estimates, not measured uncertainty areas. They must not be used for
precise location scoring.

## Complete NASA source list

1. [NASA GISS Mars24 — Mars Lander Missions](https://www.giss.nasa.gov/tools/mars24/help/landers.html).
   Coordinates and arrival histories, including Zhurong and both 1971 landers;
   landing-station names and UTC dates. The page acknowledges its underlying
   coordinate references. Its 2023 activity/status notes are **not** presented as
   current rover status in this feature.
2. [NASA Mars Pathfinder](https://science.nasa.gov/mission/mars-pathfinder/).
   Sojourner's mission, deployment and exploration context.
3. [NASA Spirit](https://science.nasa.gov/mission/mer-spirit/).
   Touchdown coordinates and Gusev/Columbia Hills mission context.
4. [NASA Opportunity](https://science.nasa.gov/mission/mer-opportunity/).
   Preserved touchdown coordinates and Eagle Crater/ancient-water context.
5. [NASA Curiosity](https://science.nasa.gov/mission/msl-curiosity/).
   Gale Crater and the mission's habitability investigation.
6. [NASA NTRS — Assessment of the Mars Science Laboratory Entry, Descent,
   and Landing Simulation](https://ntrs.nasa.gov/citations/20130010129).
   Curiosity touchdown position in the [NASA-hosted PDF](https://ntrs.nasa.gov/api/citations/20130010129/downloads/20130010129.pdf),
   section “Landing Accuracy,” paragraph beginning “This estimate,” and the
   landing-accuracy conclusions. Text extraction confirms 4.5895 S, 137.4417 E.
7. [NASA Perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/).
   Jezero Crater, ancient delta and sample collection mission context.
8. [NASA NTRS — Assessment of the Mars 2020 Entry, Descent, and Landing
   Simulation](https://ntrs.nasa.gov/citations/20210024644).
   The abstract gives actual touchdown at 18.44463 N, 77.45088 E.
9. [NASA History — 50 Years Ago: Mariner 9 Launches to Orbit Mars](https://www.nasa.gov/history/50-years-ago-mariner-9-launches-to-orbit-mars/).
   Mars 2/3 launch/arrival outcomes and PrOP-M non-deployment history.
10. [NASA Mars Trek imagery API](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars).
    Existing globe imagery credit retained. The existing
    `public/models/mars/viking-global.jpg` texture is reused without modification.
    This change does not establish new provenance for the pre-existing derivative.

No Wikipedia, third-party location feed, live position API or non-NASA research
source supplies this feature's records. No external requests are required to
show the dataset; NASA links are for visitors to check facts.

## Rendering and integration

`lib/mars-landing-sites.ts` holds mission data and pure coordinate helpers.
Longitudes are east-positive in [0, 360); negative western longitudes are
normalized for display. The globe keeps the existing texture mapping:

- Surface normal: `[cos(lat) cos(lon), sin(lat), -cos(lat) sin(lon)]`.
- Centering rotation in XYZ order: pitch `lat`, yaw `-(lon + 90 degrees)`.
- Each marker's local Z axis is aligned to its surface normal.

The unit test verifies that centering sends every site's normal to [0, 0, 1],
checks cardinal directions and longitude wrapping, and checks catalogue coverage.
This tests geographic math independently of the visual texture. The existing
texture is retained; no new survey-grade cartographic calibration is claimed.
Markers are enlarged for visibility and depth-tested against Mars so far-side
sites remain hidden until the visitor rotates the globe or selects that rover.
The selected site gains a white outer ring. Names, coordinates, selection ticks,
pressed states and dashed attempt symbols supplement color coding.

The existing `<MarsLandingGlobe site={opportunityLanding} />` integration is
preserved, so the explorer route and rover/orbit viewers require no edits.
The globe scene is still a lazy client-only R3F canvas with on-demand rendering,
a pixel ratio cap, keyboard controls and vertical touch scrolling. Selecting
before the texture finishes loading is supported. Loading, texture failure,
WebGL creation failure and context loss leave the complete list usable.

## Verification commands

From the repository root, with the existing lockfile dependencies installed:

```sh
npm run lint
node --test tests/mars-landing-sites.test.mjs
npm run build
```

The Node test uses native TypeScript stripping (Node 22.18+ or Node 24+).
The existing package.json does not declare module type; Node may print a harmless
module-detection warning when importing the TypeScript data file. No package or
lockfile edit is needed for this feature.

Verified for this delivery:

- TypeScript (`npm run lint`) and production build passed.
- All five Node tests passed, including every site's front-centering rotation.
- Chromium with software WebGL: all eight list selections redraw the globe;
  one selected entry at a time; coordinate/reference text updates; every source
  link remains NASA-hosted.
- Keyboard rotation, Home re-centering, Enter activation and navigation away/back
  passed without page JavaScript errors on the normal path.
- Widths 320, 390 and 768 pixels had no horizontal page overflow; module buttons
  measured at least 44 pixels tall. Touch drag/cancel was exercised via Chromium
  input events; `touch-action: pan-y` is preserved. Real phone hardware was not
  available for testing.
- Forced WebGL context loss and failed texture loading retain all eight list
  entries and allow mission selection. Delaying the texture while selecting
  Perseverance retains that selection when the globe becomes ready.
- No new model assets, packages, global styles or route changes are required.

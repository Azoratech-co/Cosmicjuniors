# Mars rover journeys — data and implementation notes

Snapshot retrieved: **2026-11-13**. This update extends the Mars landing-site globe and expanded explorer. It adds a **Journey** view with recorded traverses, documented visits and the last published position, while retaining landing coordinates as a separate concept.

## What is available

| Rover | Route evidence included | Last published position in this update | Interpretation |
| --- | --- | --- | --- |
| Opportunity | 21,104 localization records; 19,964 route vertices | 2.330925° S, 354.651023° E; record spans sols 5076–5081 | Expected resting area in Perseverance Valley. Last radio contact was 2018-06-10; the coordinate was **not measured on that date**. |
| Spirit | 8,804 localization records; 7,562 route vertices | 14.600366° S, 175.525377° E; record spans sols 2169–2209 | Expected resting area at Troy, west of Home Plate. Last radio contact was 2010-03-22. |
| Curiosity | 1,389 waypoints; 25,693 route vertices | 4.82602331° S, 137.388886° E; sol 5073 | Latest waypoint in the retrieved publication, not live telemetry or a final resting place. |
| Perseverance | 708 waypoints; 35,010 route vertices | 18.43559434° N, 77.23322287° E; sol 2022 | Latest waypoint in the retrieved publication, not live telemetry or a last-contact claim. |
| Sojourner | NASA's original 83-sol traverse image; documented rock visits | Final image labels sols 78–83 south of Pathfinder, near Chimp | No verified global endpoint coordinate table was found in the sources used; no separate numerical endpoint pin is invented. |
| Zhurong | NASA MRO/HiRISE wheel-track image and later comparison image | No movement between 2022-09-08 and 2023-02-07 in those orbital views | A dated observation, not a radio-contact date or proof of the rover's position today. No exact endpoint pin or complete coordinate route is invented. |
| Mars 2 PrOP-M | No deployed rover traverse | Approximate lander arrival area retained | The rover never deployed or drove. |
| Mars 3 PrOP-M | No deployed rover traverse | Approximate lander arrival area retained | The rover never deployed or drove. |

Coordinates use east-positive longitude and north-positive latitude. Extra decimal places retain source values; they do **not** establish equivalent positional accuracy. The UI rounds display coordinates to five decimal places. Existing history-based landing coordinates remain in `lib/mars-landing-sites.ts`; route-localized origins are not silently substituted for them.

The four numerical routes contain **32,005 localization records and 88,229 route vertices**. Repeated stationary entries remain available through the slider, record number and Previous/Next controls. These records are not a log of every wheel movement. Curiosity retains 68 separate segments and Perseverance 20; source gaps are not bridged. All records are available in the bundled downloadable JSON, not just the named visits.

## Primary coordinate sources

**Spirit and Opportunity:** [NASA PDS Geosciences Analyst's Notebook traverse documentation](https://an.rsl.wustl.edu/mera/AN/pages/mer/mer_traverse.htm). Washington University hosts this NASA PDS node. Its corrected traverse products credit Tim Parker and June Wang and include science-team control points and interpolation. Their labels explicitly say `DATA_SET_ID = "N/A"` and "This product is not archived in PDS." These are **supplemental Analyst's Notebook products**, not a claim of formal PDS dataset archiving.

The conversion reads geographic `LON`/`LAT` fields from each shapefile DBF and PolyLine coordinates from its SHP. It does not mistake local corrected X/Y meters for global coordinates. The source projection is retained in the generated JSON; its Mars sphere radius is 3,396,190 m.

- [Spirit corrected traverse ZIP](https://an.rsl.wustl.edu/mera/AN/meri/MER/traverse/MERA_traverse.zip) and [label](https://an.rsl.wustl.edu/mera/AN/meri/MER/traverse/MERA_traverse.lbl).
- [Opportunity corrected traverse ZIP](https://an.rsl.wustl.edu/mera/AN/meri/MER/traverse/MERB_traverse_5130.zip) and [label](https://an.rsl.wustl.edu/mera/AN/meri/MER/traverse/MERB_traverse_5130.lbl).

Important source limits:

- The Opportunity filename and label advertise coverage through sol 5130, but the actual retrieved records end at sol 5081. This update reports the actual records. [NASA's final traverse map](https://science.nasa.gov/photojournal/opportunitys-final-traverse-map/) establishes the final mission area; it does not turn the earlier numeric record into a precise last-contact measurement. [NASA's last-message reference](https://science.nasa.gov/resource/opportunitys-last-message/) supplies the separate contact date.
- Spirit's last stationary record starts at sol 2169 and ends at sol 2209. [NASA's Troy view](https://science.nasa.gov/photojournal/spirits-view-from-troy/) identifies its immobilization area; the [NASA mission history](https://science.nasa.gov/mission/mer-spirit/) supplies last contact.
- Corrected map origins differ slightly from history-based landing coordinates. For example, the Spirit route starts at 14.565828° S, 175.475837° E, while the history landing coordinate is about 14.5692° S, 175.4729° E. No artificial line joins these different localizations. The Journey ring is labeled "Start of mapped traverse."
- Opportunity contains one same-position sol-order inversion, 2170 → 2169. Source site/drive record order is preserved; sorting by sol would change that order. Visit lookup scans sol ranges instead of assuming sorted records.

**Curiosity and Perseverance:** NASA/JPL's location maps publish the MMGIS layers used here. Route lines and waypoint lists are independently published, and the snapshot records both original byte hashes.

- [Curiosity location map](https://science.nasa.gov/mission/msl-curiosity/location-map/), [route GeoJSON](https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json), [waypoint GeoJSON](https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json).
- [Perseverance location map](https://science.nasa.gov/mission/mars-2020-perseverance/location-map/), [route GeoJSON](https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json), [waypoint GeoJSON](https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json).

The first listed waypoint need not be touchdown: Curiosity's list begins at sol 3 and Perseverance's at sol 13. The site/drive values and sol numbers remain available in the UI and JSON. No source publication timestamp or live tracking claim is inferred from a retrieval date.

## Image-based evidence

**Sojourner:** [NASA's Mars Pathfinder rover traverse image](https://science.nasa.gov/photojournal/mars-pathfinder-rover-traverse-image/) shows the 83-sol path in a projected local panorama. The original [PIA01238 JPEG](https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia01/pia01238/PIA01238.jpg) is bundled unchanged, credit NASA/JPL. Coordinates are not inferred from its pixels.

[NASA's final Sojourner photojournal entry](https://science.nasa.gov/resource/sojourner-rover-behind-chimp-left-eye/) identifies September 27, 1997 as the final data transmission. Some mission histories separately discuss a brief October 7 signal. The UI therefore labels September 27 specifically "Final data transmission (photojournal)" rather than claiming it resolves every definition of last contact.

**Zhurong:** these sources are from the NASA Mars Reconnaissance Orbiter's HiRISE team, hosted by the University of Arizona, rather than a `nasa.gov` domain. Credits remain NASA/JPL-Caltech/UArizona.

- [ESP_073225_2055](https://www.uahirise.org/ESP_073225_2055), acquired March 11, 2022, shows tracks and roughly 1.5 km of southward travel. [Original detailed JPEG](https://static.uahirise.org/images/2022/details/cut/ESP_073225_2055-cut-1.jpg). This is partial route coverage.
- [ESP_077511_2055](https://hirise.lpl.arizona.edu/ESP_077511_2055) compares observations and reports no movement between September 8, 2022 and February 7, 2023. [Original comparison JPEG](https://static.uahirise.org/images/2023/details/cut/ESP_077511_2055.jpg).

The HiRISE image-center coordinate (for example 25.125° N, 109.927° E) is **not a rover coordinate** and is not used to create a rover pin. The whole-planet landing marker remains distinct. [NASA Mars24 lander notes](https://www.giss.nasa.gov/tools/mars24/help/landers.html) support the landing/deployment context. [NASA's history of the 1971 missions](https://www.nasa.gov/history/50-years-ago-mariner-9-launches-to-orbit-mars/) supports the PrOP-M non-deployment context.

## Display and behavior

- The globe overlays the selected rover's published route and colored diamond endpoint where coordinate evidence exists. Existing colored landing rings remain separate. Small routes can overlap their landing markers at whole-planet scale; they are not enlarged to imply a false geographic footprint.
- "Explore … journey" opens the existing opaque, animated Mars window directly in Journey view. Globe/Journey tabs share the selected rover. Globe camera controls can focus the last published coordinate.
- The regional SVG is a north-up route diagram with a metric scale, not a satellite basemap or a reconstructed terrain surface. It uses a local equirectangular projection on the Mars sphere. It shows the recorded ground track, not the full area observed by cameras or instruments, and not a planned driving route.
- Numbered visits resolve to the nearest published rover localization for the cited sol. They locate the rover near a named feature, not a surveyed center or every scientifically examined target. The curated visits are examples; the full record list remains accessible.
- Numerical route JSON is fetched lazily and cached per immutable file. Failed fetches keep source and endpoint information accessible and offer Retry. Switching missions cancels stale UI updates. Sojourner and Zhurong show evidence images; PrOP-M shows its no-drive explanation.
- No new dependency, API key, tracking service, database or external runtime data request is required. All route data and evidence images are bundled locally. Source links open the original providers.

## Reproduction and refresh

`scripts/prepare-mars-journeys.py` uses only Python's standard library:

```sh
python scripts/prepare-mars-journeys.py --snapshot 2026-11-13 --cache /path/to/frozen-source-cache
```

The cache preserves input bytes. To fetch a new publication, use an empty cache directory and the actual retrieval date, then review the resulting differences before committing. Merely changing the date with an old cache is not a refresh. Source files can change upstream; exact historical reproduction needs the cached inputs matching the stored hashes.

Generated numerical JSON retains all localization records, with columns `longitudeE, latitudeN, startSol, endSol, site, drive`. Consecutive identical line vertices and zero-length line segments are removed. Only exactly matching neighboring endpoints are joined; no spline, gap filling or speculative extension is added. Geometry is rounded to eight decimal degrees for storage, a numerical operation that does not improve source accuracy. Last route vertices must agree with last localization records within 50 m or the preparation script stops for review.

Each route JSON and `lib/data/mars-journey-index.json` include original source URLs, byte sizes and SHA-256 hashes. `public/models/mars/routes/media-sources.json` includes the same provenance and credits for each unmodified image. Original geographic and source-resolution evidence stays available for future updates.

## Validation

The update was checked with TypeScript, a production Next.js build, the landing/journey Node tests, and Chromium browser checks. Browser coverage included all eight selections, first/next/last record access, source links, preserved route gaps, endpoint focus, route/globe switching, 320/390 px layouts, modal keyboard containment, Escape/focus restoration and recovery after a failed route request. All 34 linked reference pages in the journey registry returned successfully during the source audit. HTTP availability does not itself verify scientific interpretation; the distinctions above describe how each source is used.

The following visit and endpoint reference list is generated from the same registry used by the interface.

## Visit and endpoint references

### opportunity

- [Endurance Crater](https://www.jpl.nasa.gov/images/pia05872-at-the-edge-of-endurance/) — sol 95: Opportunity reached the crater rim and later explored its exposed rock layers.
- [Victoria Crater](https://science.nasa.gov/photojournal/opportunity-traverse-map-eagle-to-victoria/) — sol 951: After crossing the plains, Opportunity reached the rim of this much larger crater.
- [Santa Maria Crater](https://www.nasa.gov/image-article/opportunitys-view-of-santa-maria-crater-sol-2450/) — sol 2450: The rover stopped to examine Santa Maria during its journey toward Endeavour.
- [Endeavour Crater rim](https://science.nasa.gov/photojournal/west-rim-of-endeavour-crater-on-mars/) — sol 2681: Opportunity arrived at the western rim of Endeavour, beginning another major exploration area.
- [Perseverance Valley](https://science.nasa.gov/resource/from-tribulation-to-perseverance-on-mars/) — sol 4720: The rover reached the top of the valley and subsequently explored downslope. Its mission ended in this area.
- [Last mapped position: Perseverance Valley, Endeavour Crater](https://science.nasa.gov/photojournal/opportunitys-final-traverse-map/).
- [Last radio contact: 2018-06-10](https://science.nasa.gov/resource/opportunitys-last-message/).

### spirit

- [Bonneville Crater](https://science.nasa.gov/photojournal/bonneville-and-beyond/) — sol 66: Spirit surveyed the crater and the rocky plains before heading toward the hills.
- [Columbia Hills](https://nssdc.gsfc.nasa.gov/planetary/mars/mars_exploration_rovers/mera_images.html) — sol 156: The rover arrived at the base of the Columbia Hills after crossing the Gusev plains.
- [Husband Hill summit](https://science.nasa.gov/photojournal/postcard-above-tennessee-valley/) — sol 582: Spirit completed its climb and looked across the surrounding hills and basin.
- [Home Plate](https://ntrs.nasa.gov/citations/20080009717) — sol 744: Spirit reached the layered plateau and later explored around it.
- [Troy](https://science.nasa.gov/photojournal/spirits-view-from-troy/) — sol 1891: The rover became embedded in soft soil west of Home Plate. Later attempts to free it produced very little movement.
- [Last mapped position: Troy, west side of Home Plate](https://science.nasa.gov/photojournal/spirits-view-from-troy/).
- [Last radio contact: 2010-03-22](https://science.nasa.gov/mission/mer-spirit/).

### curiosity

- [Yellowknife Bay](https://science.nasa.gov/resource/looking-back-at-entry-into-yellowknife-bay/) — sol 125: Curiosity entered the shallow depression where it investigated ancient lakebed sediments.
- [Pahrump Hills approach](https://science.nasa.gov/resource/curiosity-mars-rovers-approach-to-pahrump-hills/) — sol 751: The rover approached the outcrop at the base of Mount Sharp. This is an approach waypoint, not the later drill-hole location.
- [Vera Rubin Ridge](https://science.nasa.gov/blog/sol-1809-thread-of-life-ledge-at-elevation-4202-meters/) — sol 1809: Curiosity climbed the ridge to study its rocks and mineral clues.
- [Glen Torridon](https://www.nasa.gov/image-article/curiosity-drives-over-new-kind-of-terrain/) — sol 2316: The rover investigated clay-bearing terrain after leaving Vera Rubin Ridge.
- [Latest published waypoint: Mount Sharp traverse, Gale Crater](https://science.nasa.gov/mission/msl-curiosity/location-map/).

### perseverance

- [Rochette](https://science.nasa.gov/resource/perseverances-selfie-at-rochette/) — sol 198: Perseverance took a selfie at the rock where it collected early rock-core samples.
- [Three Forks sample depot](https://science.nasa.gov/resource/perseverances-three-forks-sample-depot-map/) — sol 690: The rover finished placing ten sample tubes on the surface for a possible future collection mission.
- [Bright Angel](https://science.nasa.gov/photojournal/perseverance-captures-bright-angel-in-360-degrees/) — sol 1178: The rover imaged an area of rock outcrops associated with an ancient river environment.
- [Cheyava Falls](https://science.nasa.gov/resource/perseverance-finds-a-rock-with-leopard-spots/) — sol 1212: Perseverance examined an unusual rock in the Bright Angel region. This point locates the rover near the target, not the rock's surveyed center.
- [Lac de Charmes region](https://science.nasa.gov/photojournal/nasas-perseverance-rover-snaps-westernmost-selfie/) — sol 1797: The rover documented terrain west beyond Jezero Crater in a later mission selfie.
- [Latest published waypoint: Jezero exploration region](https://science.nasa.gov/mission/mars-2020-perseverance/location-map/).

### sojourner

- [Barnacle Bill](https://science.nasa.gov/resource/sojourner-near-barnacle-bill/): One of the first rocks investigated near the lander.
- [Yogi](https://science.nasa.gov/resource/sojourner-barnacle-bill-yogi/): Sojourner examined this larger rock using its camera and chemical instrument.
- [Chimp](https://www.jpl.nasa.gov/images/pia00970-sojourners-apxs-at-chimp-left-eye/) — sol 80: NASA documented Sojourner's chemical instrument against Chimp on sol 80, near the end of the mission.
- [Last documented area: South of Pathfinder, near Chimp](https://science.nasa.gov/photojournal/mars-pathfinder-rover-traverse-image/).
- [Final data transmission (photojournal): 1997-09-27](https://science.nasa.gov/resource/sojourner-rover-behind-chimp-left-eye/).

### zhurong

- [Landing platform](https://www.giss.nasa.gov/tools/mars24/help/landers.html): Zhurong drove off its Tianwen-1 landing platform on May 22, 2021.
- [Southward wheel-track corridor](https://www.uahirise.org/ESP_073225_2055): The March 11, 2022 HiRISE observation documented roughly 1.5 km of southward travel. This is partial coverage, not the whole mission route.
- [Stationary observation area](https://hirise.lpl.arizona.edu/ESP_077511_2055): The September 2022 and February 2023 orbital views show the rover at the same place.
- [Position documented from orbit: Southern Utopia Planitia](https://hirise.lpl.arizona.edu/ESP_077511_2055).
- [HiRISE observation: 2023-02-07](https://hirise.lpl.arizona.edu/ESP_077511_2055).

### mars-2-prop-m

- [No rover journey: Approximate lander arrival area](https://www.giss.nasa.gov/tools/mars24/help/landers.html).

### mars-3-prop-m

- [No rover journey: Approximate lander arrival area](https://www.giss.nasa.gov/tools/mars24/help/landers.html).

# Detailed Mars and Moon surfaces

Prepared from original NASA and NASA mission-archive inputs on **2026-11-14**.

## Reference and implementation

The rendering reference is [Aberration, remaster branch](https://github.com/laberration/aberration/tree/remaster), particularly [`createMoon` in `src/three/moon3.jsx`](https://github.com/laberration/aberration/blob/remaster/src/three/moon3.jsx). It combines a colour texture, a separate height texture, spherical geometry and directional lighting. Its [README references NASA's CGI Moon Kit](https://github.com/laberration/aberration/blob/remaster/README.md#resources-and-references).

This update follows that surface-data approach in the existing React/Three.js architecture. It uses assets fetched from their original NASA providers. The new rendering, preparation, caching and UI code is written for Cosmic Juniors; it does not import Aberration's global scene, GUI, modified images or Moonquake modules. The reference repository's root listing had no license file, so the implementation does not copy its source body.

Colour alone does not describe crater depth. The expanded view now combines higher-resolution colour with measured planetary radii, a denser surface mesh and a normal map derived from the measured terrain. Relief remains at physical scale; no random craters, procedural noise or height exaggeration is introduced.

## Sources and credits

### Moon: NASA LRO / LROC / LOLA

[NASA Scientific Visualization Studio's CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) supplies both the colour and elevation inputs. Credit: **NASA's Scientific Visualization Studio; LRO LROC and LOLA instrument teams**.

- [2025 sRGB colour map, 8192 × 4096 TIFF](https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_16bit_srgb_8k.tif).
- [LOLA elevation map, 5760 × 2880 unsigned TIFF](https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16_uint.tif).
- [Original LROC Hapke-normalized WAC source description](https://wms.lroc.asu.edu/lroc/view_rdr/WAC_HAPKE).
- [NASA PDS Geosciences LOLA archive information](https://pds-geosciences.wustl.edu/missions/lro/lola.htm).

The unsigned elevation values decode as `height_m = value × 0.5 − 10000`, relative to a radius of 1,737,400 m. The maps are centered at longitude 0°. The 2025 colour product includes lower-resolution laser-albedo fill near the poles and image-processing adjustments; NASA identifies it as a visualization product. It is not a quantitative albedo measurement.

### Mars: NASA Viking and Mars Global Surveyor / MOLA

[NASA Mars Trek's documented WMTS service](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars) supplies the Viking MDIM 2.1 global colour mosaic. Credit: **NASA/JPL/USGS**. The layer identifier is `Mars_Viking_MDIM21_ClrMosaic_global_232m`.

- [Original WMTS capabilities](https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/WMTSCapabilities.xml).
- [NASA PDS Geosciences MOLA MEGDR documentation](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html).
- [MOLA 16 pixels/degree planetary-radius image](https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/megr90n000eb.img).
- [Its original PDS3 label](https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/megr90n000eb.lbl) and [maintained PDS4 label](https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/megr90n000eb.xml).

The MOLA source is hosted by Washington University as NASA's PDS Geosciences Node. Credit: **NASA GSFC / Mars Global Surveyor MOLA team / NASA PDS Geosciences Node**. This mission-archive host is stated explicitly rather than presented as a nasa.gov domain.

The radius raster contains signed, big-endian 16-bit values with a 3,396,000 m offset. It describes planetary radius, which is different from topography measured above the Martian areoid. The renderer stores radii relative to its 3,396,190 m reference sphere. Source longitude is 0–360° E; the preparation shifts it by half its width to align with the colour mosaic's −180–180° E extent. Its original interpolated bins remain interpolated; this update does not turn them into direct laser observations.

## Preparation, resolution and accuracy

`scripts/prepare-globe-surfaces.py` requires **NumPy and Pillow only for asset preparation**. They are not website dependencies. No npm dependency, runtime API key or remote data request is added.

```sh
python scripts/prepare-globe-surfaces.py --cache /path/to/source-cache --snapshot 2026-11-14
```

An existing cache preserves exact historical input bytes. Use an empty cache and the actual retrieval date to refresh; inspect new input hashes and geographic registration before committing.

The preparation:

1. Assembles all 512 Mars matrix-4 tiles into an 8192 × 4096 equirectangular mosaic. Capabilities must specify the expected −180°, 90° upper-left corner, tile dimensions and matrix size. Missing tiles stop preparation.
2. Produces 2048, 4096 and 8192-pixel-wide sRGB WebP colour derivatives. The NASA Moon TIFF is reduced to 8-bit sRGB for browser delivery. Source colours are not re-painted or artificially sharpened.
3. Derives planet-fixed normal vectors using measured radius gradients and physical distances per angular sample. The X/Y/Z convention matches the existing globe geometry. Lossless WebP stores the quantized RGB normal data at widths 2048 and 4096. The normal maps are linear data, not sRGB colour.
4. Stores a 512 × 256 cell-centered grid of relative radii as little-endian float32 meters. The expanded mesh samples this grid bilinearly; seam lookup wraps and pole vertices use a shared row average. Mesh density adapts between 256 × 128 and 512 × 256. Object-space normals avoid adding the same terrain slope to the displaced mesh twice.

Each body's `surface/sources.json` contains input URLs, source byte sizes and SHA-256 hashes, derivative hashes, coordinate conventions, radius units, credits and all original Mars tile URLs/hashes. The report and manifest are part of the delivered files.

The colour resolution and terrain resolution are independent. LOLA and MOLA inputs here have 16 samples per degree, about 1.9 km/pixel on the lunar equator and 3.7 km/pixel on Mars. The mesh is coarser than the normal shading. These are detailed global globes, not landing-site digital terrain models or rover-scale ground reconstructions. More pixels do not imply better geolocation of mission markers. Their existing source coordinates and uncertainty notes remain separate.

Lighting direction is an inspection control, not a calculation of the real Sun's position on a particular date. The physical relief toggle changes the surface display, not any mission coordinates.

## UI and integration

- Compact page globes retain lightweight images. The Moon preview reuses the bundled 2K NASA colour derivative. Large surface resources are requested only in the expanded Globe view. Opening Opportunity's Journey directly does not download them.
- The current Mars explorer retains its updated layout and controls. Moon and stationary-lander pages use separate mission windows with the earlier animated window design. Both use the same NASA surface renderer, camera data, keyboard and pointer behavior.
- Canvas measurements use layout size rather than the opening animation's temporary transform scale, so the fully opened globe fills and centers in its actual viewport.
- The camera supports closer zoom, field of view, optional rotation, physical surface relief, adjustable light direction and reset. Controls scroll within short phone/landscape windows. Reduced-motion and native modal focus behavior remain supported.
- Landing and endpoint symbols retain a readable screen size when zooming so that they do not hide the crater detail. Their geographic positions and depth occlusion remain part of the globe.
- A suitable desktop GPU with sufficient reported memory receives 8K colour. Phones, limited/unknown memory and smaller GPUs receive 4K or 2K resources. The normal map is capped at 4K. This is a capability policy, not a guarantee of a particular device's frame rate.
- A standard globe stays available while detail loads. Detail failures offer Retry and keep camera and source controls usable. Stale results do not update an unmounted surface; partial failed textures are disposed. Decoded immutable assets are cached for reopening the window.
- NASA imagery and terrain links remain visible in the expanded window. Landing rings, separate Mars endpoint diamonds, all source-backed rover journeys and Opportunity's flight view are retained.

The compatibility revision starts directly from `feature/mars-explorer-v2` at `5a0e2920c708bf64c745317ac500eec03378b731`. Its current Mars explorer, animation, picker, comparison layout, leader helpers, journey crosshair and Locate it controls are retained. NASA terrain is added to that renderer rather than replacing its component with the earlier version. Separate `Mission*` components retain the earlier Moon and stationary-lander views without reverting the new Mars components or recreating obsolete file paths. The existing Mars rover catalogue supplies rover-page locations; a separate mission catalogue supplies the Moon and stationary landers. The Pathfinder simulator and shared rover viewer remain unchanged. No default-branch update or deployment is implied.

## Validation commands

```sh
npm run lint
node --test tests/mars-landing-sites.test.mjs tests/mars-journeys.test.mjs tests/globe-surfaces.test.mjs
python tests/globe-normal-preparation.test.py
npm run build
```

The Node tests check derivative hashes, complete source coverage, geographic wrapping and pole closure, decoder validation, device limits and known landmark registration. Analytic Python checks verify the spherical axes and the direction normals tilt on terrain that rises east or north. These establish the encoding contract, not independent scientific validation of the underlying missions' data. Desktop/mobile browser results and screenshots accompany the delivery index.

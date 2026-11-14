# Globe update compatibility review

Reviewed against GitHub branch **`feature/mars-explorer-v2`**, commit
**`5a0e2920c708bf64c745317ac500eec03378b731`**, on 2026-11-14.
The remote ref was checked again after the integration tests and still pointed
to this commit. Main/default remained at `d3d31f9`.

## Finding

The earlier surface update, local commit `7149cf5`, was based on Mars-feature
commit `2890df7` combined with generic Moon/Mars globe commit `d3d31f9`.
The newer v2 branch contains work that was not in those starting points.
Thirteen paths in that earlier ZIP have newer edits in v2. It also contains
legacy components/catalogue paths that v2 has removed or renamed.

Copying the earlier full files over v2 could overwrite the newer controls,
comparison layout and callout behavior. The earlier ZIP is therefore
**superseded for this branch**. Use the compatible replacement built directly
on `5a0e292`, rather than stacking both archives.

## Integration

Only four existing v2 files are modified:

- `components/site/LandingGlobeScene.tsx`: add NASA surface detail and adaptive
  marker sizing inside the current scene. Existing animated focus, cancellation,
  marker picking, reference projections and leader callbacks are retained.
- `components/site/MarsExplorerWindow.tsx`: add relief/lighting controls, closer
  zoom and detail loading/retry status to the current window and sidebar.
- `components/site/MarsExplorerWindow.module.css`: append scoped surface-credit
  styles; retain the current v2 layout, background, information and control panels.
- `app/explorers/[id]/page.tsx`: keep the current Mars component for rover pages
  and attach separate mission globes for Moon and stationary-lander pages.

New `Mission*` components keep those additional views separate from the updated
v2 Mars components. The canonical rover catalogue remains `lib/landing-sites.ts`.
The obsolete `MarsGlobeScene.tsx`, `MarsLandingGlobe.*` and
`lib/mars-landing-sites.ts` are not recreated. The Moon preview uses the existing
bundled 2K NASA derivative, so the removed legacy JPEG is not restored.

NASA textures, radius grids, provenance, preparation code and scientific data
tests are retained from the surface update. See [the source and surface report](globe-surface-detail.md).

## Preserved newer work

A byte comparison verified 26 newer-feature files against `5a0e292`, including:

- Pathfinder landing simulator, artwork, flight logic, images, game shell and menu.
- Shared rover viewer and its newer typed descriptions.
- Inline Mars comparison wrapper and CSS, including the original wiki callout,
  Locate it control and comparison card below the globe.
- Mars site picker, landing information, description component and leader helper.
- Gold selected-record crosshair and Zhurong explanation in the journey view.
- Canonical landing-site catalogue.

These files are unchanged. The delivery audit records their individual SHA-256
hashes. All other existing tracked files outside the four integration paths are
also retained from the same baseline.

## Verification

- TypeScript, 18 Node data/geography tests, 3 analytic preparation tests and the
  production Next.js build passed.
- Browser checks confirmed that the inline comparison stays below the globe,
  its leader remains anchored when the disclosure changes height, and the
  original landing card and Locate it remain available.
- Current modal site selection, animated focus, callout visibility and camera
  controls passed with detailed NASA terrain. Clicking the projected Spirit
  marker after focusing Curiosity selected Spirit correctly.
- The gold journey cursor and record navigation passed. The existing shared
  rover-part description remained available.
- Pathfinder menu navigation, Begin flight, Pause and Resume passed without
  page errors.
- Moon detail, 390/320 px layouts, sidebar scrolling, modal keyboard containment,
  failed-detail fallback and Retry passed.

Tests used Chromium with software WebGL. The review is tied to the exact GitHub
commit above; later or unpublished local edits need the normal hash/diff check
before a merge.

# Expanded Mars explorer window

## What changed

The top-left expand icon on the existing Mars globe opens a large, opaque
window. Mars stays centered in the available viewport. The window uses a dark
space background, rounded corners, a soft scale/fade entrance and a shorter
closing animation. The backdrop strongly dims and blurs the page. Reduced-motion
preferences disable both animations. No browser fullscreen permission is needed.

The upper-right Camera panel provides zoom, field of view, optional slow
rotation, and Reset camera. Rotation starts off; manual pointer interaction
stops it. Camera controls collapse initially on phone widths. Mouse/touch drag,
pinch/wheel zoom, arrow keys, +/- and Home are supported. Ctrl+wheel is left to
the browser. The landing-site menu shares selection with the inline globe;
all eight NASA-sourced markers remain available.

The native modal dialog handles background inertness and focus containment.
Escape, the close button and backdrop clicks dismiss it. Focus returns to the
expand button. Page scrolling is locked only while the modal is mounted and
restored during cleanup. The modal globe handles its own loading and WebGL
failure, leaving the original inline globe available after closing.

## Files and integration

- `components/site/MarsLandingGlobe.tsx`: lazy modal integration and expand icon.
- `components/site/MarsLandingGlobe.module.css`: scoped expand-button styles.
- `components/site/MarsExplorerWindow.tsx`: native dialog, camera panel, inputs,
  selection synchronization, and lifecycle.
- `components/site/MarsExplorerWindow.module.css`: opaque window/backdrop,
  animations and responsive layout.
- `components/site/MarsGlobeScene.tsx`: optional window-camera framing and
  demand-driven rotation. Omitting its view prop preserves the inline viewer.

No packages, global styles, route files, model assets, or geographic records
changed. The window shares the cached NASA texture and creates its own camera
and canvas. Idle scenes render on demand; only explicitly enabled rotation
requests continuous frames. Rotation uses elapsed seconds with a pause clamp.

## References

- Design/interaction reference: [Aberration](https://github.com/laberration/aberration),
  specifically `remaster` branch `src/three/moon3.jsx` Camera Options (field of
  view and camera/position reset). This is an original native React implementation;
  no source from that project was copied. Its unrelated Moonquake, date, light
  and map-layer panels are outside this change.
- The existing NASA texture, coordinates and reference links are retained. See
  [the complete NASA source report](mars-rover-sites.md). This UI change introduces
  no new planetary facts or non-NASA location sources.
- Installed Next.js docs were consulted for client boundaries and lazy loading.

## Validation

Run `npm run lint`, `npm run build`, and
`node --test tests/mars-landing-sites.test.mjs` from the repository root.
Browser validation uses Chromium with software WebGL, including desktop/mobile,
focus containment/return, Escape, camera inputs, selection synchronization,
repeated open/close, reduced motion, and context-loss fallback. Hardware mobile
Safari/Firefox are not covered by these environment checks.

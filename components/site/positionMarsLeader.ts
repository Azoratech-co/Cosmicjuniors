import type { LandingMarkerProjection } from "./LandingGlobeScene";

export function positionMarsLeader(svg: SVGSVGElement | null, viewport: HTMLElement | null,
  panel: HTMLElement | null, point: LandingMarkerProjection | null, clip?: HTMLElement | null) {
  const line = svg?.querySelector("line");
  const dot = svg?.querySelector("circle");
  const bounds = svg?.getBoundingClientRect();
  const canvas = viewport?.getBoundingClientRect();
  const card = panel?.getBoundingClientRect();
  const controls = clip?.getBoundingClientRect() ?? bounds;
  if (!line || !dot || !bounds?.width || !bounds.height || !canvas?.width || !card?.height || !controls) return;
  const y = card.top + 24;
  const connected = !!point && y >= controls.top && y < controls.bottom;
  svg?.setAttribute("data-connected", String(connected));
  if (!point || !connected) return;
  const x = canvas.left + canvas.width * point.x;
  const markerY = canvas.top + canvas.height * point.y;
  const startX = `${(x - bounds.left) / bounds.width * 100}%`;
  const startY = `${(markerY - bounds.top) / bounds.height * 100}%`;
  const beside = card.left >= canvas.right - 1;
  const endX = beside ? card.left : Math.min(card.right - 12, Math.max(card.left + 12, x));
  const endY = beside ? y : Math.max(card.top, controls.top);
  line.setAttribute("x1", startX);
  line.setAttribute("y1", startY);
  line.setAttribute("x2", `${(endX - bounds.left) / bounds.width * 100}%`);
  line.setAttribute("y2", `${(endY - bounds.top) / bounds.height * 100}%`);
  dot.setAttribute("cx", startX);
  dot.setAttribute("cy", startY);
}

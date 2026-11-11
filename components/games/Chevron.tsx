/** Arrow icon for the on-screen game controls. */
export function Chevron({ dir }: { dir: "up" | "down" | "left" | "right" }) {
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

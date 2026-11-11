// The team's painted planets from Figma (Mars, Earth, Moon), rebuilt from their original layers:
// a base disc, a brush-stroke texture masked to the disc, and an outline. Slowly turns.

const MASK: Record<string, { pos: number; size: number }> = {
  // mask offset and size as a share of the planet's width (from the Figma frames)
  mars: { pos: 10 / 160, size: 140 / 160 },
  earth: { pos: 11.063 / 177, size: 154.875 / 177 },
  moon: { pos: 9.688 / 155, size: 135.625 / 155 },
};

export default function Planet({ kind, size, className = "" }: { kind: "mars" | "earth" | "moon"; size: number; className?: string }) {
  const m = MASK[kind];
  return (
    <div className={`planet planet--${kind} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      {/* eslint-disable @next/next/no-img-element */}
      <img className="planet__base" src={`/figma/${kind}-1.svg`} alt="" />
      <div
        className="planet__texture"
        style={{
          maskImage: `url(/figma/${kind}-mask.svg)`,
          WebkitMaskImage: `url(/figma/${kind}-mask.svg)`,
          maskPosition: `${m.pos * size}px ${m.pos * size}px`,
          WebkitMaskPosition: `${m.pos * size}px ${m.pos * size}px`,
          maskSize: `${m.size * size}px ${m.size * size}px`,
          WebkitMaskSize: `${m.size * size}px ${m.size * size}px`,
        }}
      >
        <img src={`/figma/${kind}-2.svg`} alt="" />
      </div>
      <img className="planet__outline" src={`/figma/${kind}-3.svg`} alt="" />
    </div>
  );
}

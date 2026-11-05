import { useId } from "react";

// The Cosmo logo (Figma: "Cosmo · Logo" → Final · Planet O).
// The O's in COSMO are Mars with an orbit ring that wraps behind and in front of the planet.

export function PlanetO({ size = 64, star = true }: { size?: number; star?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={`p${id}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(26 24) rotate(52) scale(30)">
          <stop stopColor="#FFB27A" />
          <stop offset="1" stopColor="#C2410C" />
        </radialGradient>
      </defs>
      <g transform="rotate(-18 32 33)">
        <path d="M3 33A29 8.5 0 0 1 61 33" stroke="#3DD6F5" strokeWidth="3.6" strokeLinecap="round" />
      </g>
      <circle cx="32" cy="33" r="18" fill={`url(#p${id})`} />
      <g transform="rotate(-18 32 33)">
        <path d="M3 33A29 8.5 0 0 0 61 33" stroke="#3DD6F5" strokeWidth="3.6" strokeLinecap="round" />
      </g>
      {star && <path d="M54 6l1.7 3.5 3.8.6-2.7 2.7.6 3.8L54 14.8l-3.4 1.8.6-3.8-2.7-2.7 3.8-.6z" fill="#FFD166" />}
    </svg>
  );
}

/** The COSMO wordmark. `size` is the letter height in px. */
export default function CosmoLogo({ size = 28, className }: { size?: number; className?: string }) {
  const o = Math.round(size * 1.25); // planet body matches the letter height
  return (
    <span className={`cosmo-logo${className ? ` ${className}` : ""}`} style={{ fontSize: size }} role="img" aria-label="Cosmo">
      <span aria-hidden="true">C</span>
      <PlanetO size={o} star={false} />
      <span aria-hidden="true">SM</span>
      <PlanetO size={o} />
    </span>
  );
}

// Cosmo, the robot-astronaut mascot (Figma: Avatar/Cosmo).
export default function Cosmo({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Cosmo"
    >
      <circle cx="24" cy="24" r="24" fill="#7B5CFF" />
      <path d="M24 11V6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="5" r="3" fill="#FFD166" />
      <circle cx="24" cy="26" r="15" fill="#FFFFFF" />
      <rect x="12.5" y="19" width="23" height="14" rx="7" fill="#0B1026" />
      <circle cx="19.5" cy="25" r="2.6" fill="#3DD6F5" />
      <circle cx="28.5" cy="25" r="2.6" fill="#3DD6F5" />
      <path d="M21 29.3c1.8 1.2 4.2 1.2 6 0" stroke="#3DD6F5" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="14" cy="38" r="1.6" fill="#FFD166" />
      <circle cx="37" cy="13" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}

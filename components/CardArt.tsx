import type { CardImage } from "@/lib/types";

// Illustrations for the fact card image area (272×140 in Figma).
// Later these can be replaced with real NASA images (e.g. APOD).

const bgStars = (
  <>
    <circle cx="30" cy="22" r="1.5" fill="#FFFFFF" />
    <circle cx="62" cy="104" r="1" fill="#FFFFFF" />
    <circle cx="230" cy="30" r="1.8" fill="#FFD166" />
    <circle cx="246" cy="112" r="1.2" fill="#FFFFFF" />
    <circle cx="200" cy="80" r="1" fill="#3DD6F5" />
    <circle cx="84" cy="40" r="1" fill="#FFFFFF" />
    <circle cx="40" cy="70" r="1.2" fill="#FFFFFF" />
  </>
);

function Planet({ from, to, id }: { from: string; to: string; id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={id} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(122 56) rotate(45) scale(70)">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </radialGradient>
      </defs>
      <circle cx="136" cy="70" r="46" fill={`url(#${id})`} />
    </>
  );
}

const art: Record<CardImage, React.ReactNode> = {
  mars: (
    <>
      <Planet from="#FFA36C" to="#A8341A" id="g-mars" />
      <circle cx="118" cy="56" r="9" fill="#8E2C14" fillOpacity="0.45" />
      <circle cx="154" cy="88" r="12" fill="#8E2C14" fillOpacity="0.4" />
      <circle cx="150" cy="50" r="5" fill="#8E2C14" fillOpacity="0.35" />
      <ellipse cx="136" cy="27" rx="15" ry="4" fill="#FFFFFF" fillOpacity="0.75" />
    </>
  ),
  saturn: (
    <>
      <Planet from="#FFE3A3" to="#C98F3A" id="g-sat" />
      <ellipse cx="136" cy="70" rx="80" ry="16" stroke="#F4D58D" strokeWidth="6" strokeOpacity="0.85" fill="none" transform="rotate(-12 136 70)" />
      <path d="M100 62h72M96 76h80" stroke="#B57A2C" strokeOpacity="0.35" strokeWidth="4" />
    </>
  ),
  moon: (
    <>
      <Planet from="#F1F3FA" to="#8A90A8" id="g-moon" />
      <circle cx="120" cy="58" r="8" fill="#6E7491" fillOpacity="0.4" />
      <circle cx="150" cy="86" r="11" fill="#6E7491" fillOpacity="0.35" />
      <circle cx="152" cy="54" r="4" fill="#6E7491" fillOpacity="0.4" />
    </>
  ),
  sun: (
    <>
      <circle cx="136" cy="70" r="62" fill="#FFD166" fillOpacity="0.15" />
      <Planet from="#FFF3B0" to="#FF9F1C" id="g-sun" />
    </>
  ),
  earth: (
    <>
      <Planet from="#6FD3FF" to="#1F5FBF" id="g-earth" />
      <path d="M106 52c10-8 22-6 26 2s-4 14-14 14-16 8-12 16c-10-6-14-22 0-32Z" fill="#4ADE80" fillOpacity="0.85" />
      <path d="M150 80c8-6 18-2 18 6s-10 14-20 10 0-12 2-16Z" fill="#4ADE80" fillOpacity="0.85" />
    </>
  ),
  rocket: (
    <g transform="translate(136 70) rotate(35)">
      <path d="M0-52c14 12 18 34 14 58H-14c-4-24 0-46 14-58Z" fill="#FFFFFF" />
      <circle cx="0" cy="-16" r="7" fill="#3DD6F5" stroke="#7B5CFF" strokeWidth="3" />
      <path d="M-14 0l-12 18 14-4ZM14 0l12 18-14-4Z" fill="#FF6FB5" />
      <path d="M-8 8h16l-8 30Z" fill="#FFD166" />
    </g>
  ),
  blackhole: (
    <>
      <ellipse cx="136" cy="70" rx="84" ry="20" fill="none" stroke="#FF9F1C" strokeWidth="8" strokeOpacity="0.8" />
      <circle cx="136" cy="70" r="34" fill="#000000" stroke="#FFD166" strokeWidth="3" />
      <path d="M52 70a84 20 0 0 0 168 0" fill="none" stroke="#FFD166" strokeWidth="5" />
    </>
  ),
};

export default function CardArt({ image }: { image: CardImage }) {
  return (
    <svg viewBox="0 0 272 140" width="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <linearGradient id="card-bg" x1="0" y1="0" x2="272" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2A1B5C" />
          <stop offset="1" stopColor="#0B1026" />
        </linearGradient>
      </defs>
      <rect width="272" height="140" fill="url(#card-bg)" />
      {bgStars}
      {art[image]}
    </svg>
  );
}

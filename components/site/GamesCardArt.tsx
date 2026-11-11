/** Art for the "Games" card: a lander parachutes down and touches down on the pad, on a loop. */
export default function GamesCardArt() {
  return (
    <span className="games-art" aria-hidden="true">
      <svg viewBox="0 0 330 185" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ga-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b1f45" />
            <stop offset="1" stopColor="#5a173c" />
          </linearGradient>
          <linearGradient id="ga-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e07a45" />
            <stop offset="1" stopColor="#8a2f12" />
          </linearGradient>
          <radialGradient id="ga-flame" cx=".5" cy="0" r="1">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset=".5" stopColor="#ffb347" />
            <stop offset="1" stopColor="#ff6a2b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="330" height="185" fill="url(#ga-sky)" />
        <g className="games-art__stars" fill="#fff">
          <circle cx="30" cy="22" r="1.2" /><circle cx="92" cy="48" r=".9" /><circle cx="140" cy="14" r="1.1" />
          <circle cx="214" cy="36" r=".9" /><circle cx="300" cy="58" r="1.2" /><circle cx="262" cy="16" r=".8" />
        </g>
        {/* faraway Earth */}
        <circle cx="292" cy="30" r="9" fill="#3b82f6" />
        <path d="M286 27c3-2 6 0 8-2s4 1 5 3c-2 2-5 0-7 3s-5 0-6-4z" fill="#4ade80" />
        {/* hills and ground */}
        <path d="M0 132 C50 116 90 124 130 130 S230 112 330 126 V185 H0Z" fill="#b5532a" opacity=".7" />
        <path d="M0 148 C60 138 120 150 170 146 S270 138 330 146 V185 H0Z" fill="url(#ga-ground)" />
        <ellipse cx="60" cy="166" rx="16" ry="4" fill="#7a2a10" opacity=".6" />
        <ellipse cx="282" cy="160" rx="11" ry="3" fill="#7a2a10" opacity=".6" />
        {/* landing target */}
        <g className="games-art__pad">
          <ellipse cx="165" cy="158" rx="30" ry="7" fill="none" stroke="#ffe08a" strokeWidth="1.6" strokeDasharray="4 3" />
          <ellipse cx="165" cy="158" rx="13" ry="3" fill="#ffe08a" opacity=".55" />
        </g>
        <g className="games-art__dust" fill="#f4c49b">
          <circle cx="148" cy="154" r="5" /><circle cx="182" cy="154" r="5" /><circle cx="140" cy="156" r="3.5" /><circle cx="190" cy="156" r="3.5" />
        </g>
        {/* lander */}
        <g className="games-art__lander">
          <g className="games-art__chute">
            <path d="M143 64 Q165 34 187 64 Z" fill="#f2f2f2" />
            <path d="M154 64 Q165 46 176 64" fill="#e2626e" />
            <path d="M143 64 L160 96 M187 64 L170 96 M165 64 V96" stroke="#e5e7eb" strokeWidth=".8" />
          </g>
          <path className="games-art__flame" d="M157 122 Q165 146 173 122 Z" fill="url(#ga-flame)" />
          <path d="M152 117 L143 131 M178 117 L187 131" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="151" y="96" width="28" height="22" rx="4" fill="#e7d3a8" stroke="#fff" strokeWidth="1.4" />
          <rect x="157" y="101" width="16" height="6" rx="2" fill="#0b62c4" />
          <path d="M165 96 V88" stroke="#fff" strokeWidth="1.6" />
          <circle cx="165" cy="87" r="2.2" fill="#ffd166" />
        </g>
      </svg>
      <span className="games-art__hud">
        <i>Puzzle</i><i>Journey</i><i className="is-on">Landing</i>
      </span>
      <span className="games-art__stars-count">★ 12</span>
      <span className="games-art__win">Landed! ★ +3</span>
    </span>
  );
}

// Shared art for icons and link previews (rendered to PNG by next/og).
// Logo: Figma "Cosmo · Logo" → Final · Planet O.

export const OG_SIZE = { width: 1200, height: 630 };

const svgUri = (svg: string) => "data:image/svg+xml;utf8," + encodeURIComponent(svg);

/** The planet "O" from the Cosmo wordmark. */
export const planetSrc = (star: boolean) =>
  svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><defs><radialGradient id="p" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(26 24) rotate(52) scale(30)"><stop stop-color="#FFB27A"/><stop offset="1" stop-color="#C2410C"/></radialGradient></defs><g transform="rotate(-18 32 33)"><path d="M3 33A29 8.5 0 0 1 61 33" stroke="#3DD6F5" stroke-width="3.6" stroke-linecap="round"/></g><circle cx="32" cy="33" r="18" fill="url(#p)"/><g transform="rotate(-18 32 33)"><path d="M3 33A29 8.5 0 0 0 61 33" stroke="#3DD6F5" stroke-width="3.6" stroke-linecap="round"/></g>${star ? '<path d="M54 6l1.7 3.5 3.8.6-2.7 2.7.6 3.8L54 14.8l-3.4 1.8.6-3.8-2.7-2.7 3.8-.6z" fill="#FFD166"/>' : ""}</svg>`,
  );

/** Cosmo the robot, used for the iPhone home-screen icon (app/apple-icon.tsx). */
export const COSMO_SRC = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#7B5CFF"/><path d="M24 11V6" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="5" r="3" fill="#FFD166"/><circle cx="24" cy="26" r="15" fill="#FFFFFF"/><rect x="12.5" y="19" width="23" height="14" rx="7" fill="#0B1026"/><circle cx="19.5" cy="25" r="2.6" fill="#3DD6F5"/><circle cx="28.5" cy="25" r="2.6" fill="#3DD6F5"/><path d="M21 29.3c1.8 1.2 4.2 1.2 6 0" stroke="#3DD6F5" stroke-width="1.6" stroke-linecap="round"/><circle cx="14" cy="38" r="1.6" fill="#FFD166"/><circle cx="37" cy="13" r="1.2" fill="#FFFFFF"/></svg>`,
);

/** The Cosmo logo tile (planet on navy), used on the link-preview cards. */
export const ICON_SRC = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><defs><radialGradient id="q" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27 26) rotate(52) scale(27)"><stop stop-color="#FFB27A"/><stop offset="1" stop-color="#C2410C"/></radialGradient></defs><rect width="64" height="64" rx="16" fill="#0B1026"/><g transform="rotate(-18 32 34)"><path d="M5 34A27 8 0 0 1 59 34" stroke="#3DD6F5" stroke-width="4.5" stroke-linecap="round"/></g><circle cx="32" cy="34" r="16" fill="url(#q)"/><g transform="rotate(-18 32 34)"><path d="M5 34A27 8 0 0 0 59 34" stroke="#3DD6F5" stroke-width="4.5" stroke-linecap="round"/></g><circle cx="51" cy="13" r="3" fill="#FFD166"/></svg>`,
);

/** COSMO wordmark for previews. `size` is the letter height. */
export function OgWordmark({ size, prefix }: { size: number; prefix?: string }) {
  const o = Math.round(size * 1.25);
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: size, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
      {prefix && <div style={{ display: "flex", marginRight: size * 0.28 }}>{prefix}</div>}
      <div style={{ display: "flex" }}>C</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={planetSrc(false)} width={o} height={o} alt="" />
      <div style={{ display: "flex" }}>SM</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={planetSrc(true)} width={o} height={o} alt="" />
    </div>
  );
}

// Fixed star positions so every render looks the same.
const STARS = Array.from({ length: 60 }, (_, i) => {
  const a = (i * 9301 + 49297) % 233280;
  const b = (i * 4271 + 1237) % 233280;
  return { x: (a / 233280) * 1200, y: (b / 233280) * 630, r: 1 + (i % 3), o: 0.3 + (i % 5) * 0.12, gold: i % 7 === 0 };
});

/** A 1200×630 preview card in the Cosmic Juniors style. */
export function PreviewCard({ eyebrow, title, text, chips }: { eyebrow: string; title: React.ReactNode; text: string; chips?: string[] }) {
  return (
    <div
      style={{
        width: "100%", height: "100%", display: "flex", position: "relative",
        background: "linear-gradient(180deg, #1a1245 0%, #0b1026 70%)", color: "#ffffff", fontFamily: "sans-serif",
      }}
    >
      {STARS.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: 99, background: s.gold ? "#ffd166" : "#ffffff", opacity: s.o }} />
      ))}
      {/* Mars on the right */}
      <div style={{ position: "absolute", right: -140, bottom: -180, width: 520, height: 520, borderRadius: 999, background: "radial-gradient(circle at 35% 30%, #ffa36c 0%, #a8341a 70%)", opacity: 0.9 }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px", width: 820, gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ICON_SRC} width={84} height={84} alt="" />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#3dd6f5", letterSpacing: 2 }}>{eyebrow.toUpperCase()}</div>
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 32, lineHeight: 1.35, color: "#c9cff0" }}>{text}</div>
        {chips && (
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            {chips.map((c) => (
              <div key={c} style={{ display: "flex", padding: "10px 20px", borderRadius: 14, border: "2px solid #3dd6f5", color: "#3dd6f5", fontSize: 24, fontWeight: 700 }}>
                {c}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ position: "absolute", left: 80, bottom: 40, display: "flex", fontSize: 22, color: "#a9b1e0" }}>
        cosmic-juniors.vercel.app · NASA Space Apps 2026
      </div>
    </div>
  );
}

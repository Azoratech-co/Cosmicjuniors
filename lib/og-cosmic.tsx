import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";
import { ICON_SRC } from "./og";

// Link previews in the Cosmic style: deep-space navy with stars, purple and cyan, and a
// museum-style "left behind" tag for each machine. Abandoned, but not forgotten.

export const OG_SIZE = { width: 1200, height: 630 };

const BG = "#080D22";
const PANEL = "#172045";
const TEXT = "#EEF1FF";
const PURPLE = "#7C5CFF";
const CYAN = "#5BD4F5";
const MUTED = "#A3ACD1";
const LINE = "rgba(140,156,255,0.26)";

export async function ogFonts() {
  const f = (name: string) => readFile(join(process.cwd(), "lib/og-fonts", name));
  const [serif, mono, bold, regular] = await Promise.all([
    f("PlexSans-Bold.ttf"),
    f("PlexMono-Medium.ttf"),
    f("Inter-SemiBold.ttf"),
    f("Inter-Regular.ttf"),
  ]);
  return [
    { name: "Serif", data: serif, weight: 700 as const, style: "normal" as const },
    { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 600 as const, style: "normal" as const },
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
  ];
}

const svg = (s: string) => `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;

/** Little line drawings for the tags. */
export const DRAW = {
  rover: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="28" y="22" width="60" height="16" rx="3"/><path d="M40 22v-6h36v6M58 16V6M54 6h8"/><path d="M32 38l-10 14M58 38v14M84 38l12 14M22 52h74"/><circle cx="22" cy="56" r="7"/><circle cx="58" cy="56" r="7"/><circle cx="96" cy="56" r="7"/></svg>`),
  lander: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M44 18h32l8 18H36z"/><path d="M40 36l-14 24M80 36l14 24M60 36v24M18 60h16M86 60h16M52 60h16"/><path d="M60 18V6M54 6h12"/><path d="M84 22l20-10M104 12l6 6"/></svg>`),
  flag: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M40 64V6h44v26H40"/><path d="M48 14h8M48 22h8M62 14h16M62 22h16"/><path d="M14 64h92"/><path d="M78 56c2-3 6-3 8 0M92 60c2-3 6-3 8 0"/></svg>`),
  chat: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10h56a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H44l-14 12V46H20a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8z"/><path d="M28 24h40M28 34h26"/><circle cx="100" cy="22" r="10"/><path d="M86 26c8 4 20 2 28-6"/></svg>`),
  book: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M60 16c-10-6-26-8-40-6v48c14-2 30 0 40 6 10-6 26-8 40-6V10c-14-2-30 0-40 6z"/><path d="M60 16v48M30 24h18M30 34h18M72 24h18M72 34h18"/></svg>`),
  joystick: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="20" width="92" height="40" rx="20"/><path d="M38 32v16M30 40h16"/><circle cx="80" cy="34" r="4"/><circle cx="90" cy="46" r="4"/><path d="M60 20V8"/></svg>`),
};

const PATH = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 90"><path d="M30 62 C170 -4 390 -4 528 52" fill="none" stroke="${CYAN}" stroke-opacity=".55" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/><circle cx="24" cy="66" r="13" fill="#3E6FA8"/><path d="M16 62c4-3 8 1 12-2s6 2 8 4c-3 3-7 0-10 4s-8 0-10-6z" fill="#7FB77E"/><circle cx="532" cy="56" r="15" fill="#D9774A"/><circle cx="527" cy="51" r="3" fill="#A4523A"/><circle cx="538" cy="61" r="2.5" fill="#A4523A"/><g transform="translate(300 12) rotate(12)"><path d="M0 0l14 5-14 5 3-5z" fill="${CYAN}"/></g></svg>`,
);

const STARS = Array.from({ length: 70 }, (_, i) => {
  const r = (n: number) => {
    const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  return { x: Math.round(r(1) * 1200), y: Math.round(r(2) * 560), s: r(3) > 0.85 ? 3 : 2, o: 0.25 + r(4) * 0.55 };
});

/** Deep-space page with stars, soft purple glow, a dotted Earth-to-Mars path, and the footer. */
function Page({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: BG, backgroundImage: "radial-gradient(circle at 12% 0%, rgba(124,92,255,0.28), rgba(8,13,34,0) 55%), radial-gradient(circle at 100% 100%, rgba(79,124,255,0.22), rgba(8,13,34,0) 55%)", color: TEXT, fontFamily: "Inter" }}>
      {STARS.map((st, i) => (
        <div key={i} style={{ position: "absolute", left: st.x, top: st.y, width: st.s, height: st.s, borderRadius: 2, background: `rgba(255,255,255,${st.o})` }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, backgroundImage: `linear-gradient(180deg, ${PURPLE}, ${CYAN})` }} />
      {/* dotted path from a tiny Earth to a tiny Mars */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PATH} width={560} height={90} alt="" style={{ position: "absolute", left: 610, top: 18 }} />
      {children}
      <div style={{ position: "absolute", left: 64, right: 56, bottom: 28, display: "flex", alignItems: "center", gap: 14, borderTop: `2px solid ${LINE}`, paddingTop: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ICON_SRC} width={38} height={38} alt="" />
        <span style={{ fontFamily: "Serif", fontSize: 26 }}>Cosmic Juniors</span>
        <span style={{ display: "flex", flex: 1 }} />
        <span style={{ fontFamily: "Mono", fontSize: 18, color: MUTED }}>cosmic-juniors.vercel.app · NASA Space Apps 2026 · Beirut</span>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", fontFamily: "Mono", fontSize: 19, letterSpacing: 2, color: CYAN, textTransform: "uppercase" }}>{children}</div>;
}

function Left({ eyebrow, title, size = 104, text, list }: { eyebrow: string; title: string; size?: number; text: string; list?: string[] }) {
  return (
    <div style={{ position: "absolute", left: 64, top: 74, width: 600, display: "flex", flexDirection: "column" }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <div style={{ display: "flex", marginTop: 14, fontFamily: "Serif", fontSize: size, lineHeight: 1.0, letterSpacing: -2 }}>{title}</div>
      <div style={{ display: "flex", width: 90, height: 6, backgroundImage: `linear-gradient(90deg, ${PURPLE}, ${CYAN})`, marginTop: 24, borderRadius: 3 }} />
      <div style={{ display: "flex", marginTop: 22, fontSize: 27, lineHeight: 1.4, color: MUTED }}>{text}</div>
      {list && (
        <div style={{ display: "flex", marginTop: 22, gap: 12, alignItems: "center", fontSize: 21, fontWeight: 600 }}>
          {list.map((l, i) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {i > 0 && <div style={{ width: 7, height: 7, borderRadius: 4, background: PURPLE }} />}
              <span>{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface TagInfo {
  label: string;
  no: string;
  name: string;
  lines: string[];
  draw: string;
  stamp?: string;
}

/** The museum tag: deep-blue card with a punched hole and a string, tilted like it was just hung up. */
function Tag({ label, no, name, lines, draw, stamp = "Not forgotten" }: TagInfo) {
  return (
    <div style={{ position: "absolute", right: 70, top: 132, width: 410, height: 364, display: "flex", transform: "rotate(4deg)" }}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "34px 36px 30px 64px", background: PANEL, color: TEXT, border: `2px solid ${LINE}`, borderRadius: "16px 28px 28px 16px", boxShadow: "0 18px 50px rgba(2,4,16,0.6)" }}>
        <div style={{ position: "absolute", left: 32, top: -140, width: 3, height: 190, background: "rgba(163,172,209,0.7)" }} />
        <div style={{ position: "absolute", left: 22, top: 36, width: 24, height: 24, borderRadius: 12, background: BG, border: `4px solid ${PURPLE}` }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Mono", fontSize: 17, letterSpacing: 2, color: CYAN }}>
          <span>{label.toUpperCase()}</span>
          <span>{no}</span>
        </div>
        <div style={{ display: "flex", marginTop: 12, fontFamily: "Serif", fontSize: name.length > 11 ? 44 : 54, lineHeight: 1.02 }}>{name}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 14, gap: 8, fontSize: 21, lineHeight: 1.3, color: MUTED }}>
          {lines.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <div style={{ display: "flex", flex: 1 }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={draw} width={120} height={70} alt="" />
      </div>
      <div style={{ position: "absolute", right: -30, bottom: -44, width: 150, height: 150, borderRadius: 75, border: `4px solid ${CYAN}`, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-16deg)", background: "rgba(15,22,51,0.95)" }}>
        <div style={{ display: "flex", width: 124, height: 124, borderRadius: 62, border: `2px dashed ${CYAN}`, alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: "Mono", fontSize: 17, lineHeight: 1.2, color: CYAN, padding: 10 }}>
          {stamp.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

export function SitePreview() {
  return (
    <Page>
      <Left
        eyebrow="Field notes · Mars & the Moon"
        title="Cosmic Juniors"
        text="The machines NASA left behind on Mars and the Moon, and the stories they still tell."
        list={["Stories", "Explorers", "Ask Cosmo", "Games"]}
      />
      <Tag label="Left behind" no="No. 001" name="Sojourner" lines={["Ares Vallis, Mars", "Landed July 4, 1997", "Silent since Sept. 27, 1997"]} draw={DRAW.rover} />
    </Page>
  );
}

export function PagePreview({ eyebrow, title, text, list, tag }: { eyebrow: string; title: string; text: string; list?: string[]; tag: TagInfo }) {
  return (
    <Page>
      <Left eyebrow={eyebrow} title={title} size={title.length > 16 ? 76 : 96} text={text} list={list} />
      <Tag {...tag} />
    </Page>
  );
}

export function ChatPreview() {
  const bubble = { display: "flex", padding: "16px 22px", fontSize: 24, lineHeight: 1.35 } as const;
  return (
    <Page>
      <Left eyebrow="AI space guide" title="Ask Cosmo" text="Ask anything about the machines left on Mars and the Moon. Every answer links its NASA source." />
      <div style={{ position: "absolute", right: 64, top: 118, width: 450, display: "flex", flexDirection: "column", gap: 16, transform: "rotate(2deg)" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ ...bubble, backgroundImage: `linear-gradient(135deg, ${PURPLE}, #6250F2)`, color: "#fff", borderRadius: "22px 22px 6px 22px" }}>Where is Sojourner now?</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ICON_SRC} width={44} height={44} alt="" />
          <div style={{ ...bubble, background: PANEL, color: TEXT, border: `2px solid ${LINE}`, borderRadius: "22px 22px 22px 6px", width: 380 }}>
            It rests in Ares Vallis on Mars, silent since Sept. 27, 1997.
          </div>
        </div>
        <div style={{ display: "flex", alignSelf: "flex-start", marginLeft: 56, padding: "8px 16px", border: `2px solid ${CYAN}`, color: CYAN, borderRadius: 999, fontFamily: "Mono", fontSize: 17 }}>
          ✓ NASA source · Mars Pathfinder
        </div>
      </div>
    </Page>
  );
}

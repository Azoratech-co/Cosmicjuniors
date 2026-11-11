import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ICON_SRC, OG_SIZE, planetSrc } from "./og";

// Link previews (1200x630) in the team's "Juniors" style: deep navy, NASA-blue top bar,
// plum cards, pink accents, Irish Grover titles. Fonts and images are read from the project,
// so previews never depend on the network at build time.

export { OG_SIZE };

const C = { bg: "#06152f", accent: "#0b62c4", sky: "#62b6ff", text: "#d3e4fa", muted: "#c9daef", plum: "linear-gradient(125deg, #812d51 14%, #320d2b 86%)", burgundy: "#7c2847", pink: "#f7d3df", card: "#172944", line: "#425171" };

export async function ogFonts() {
  const f = (name: string) => readFile(join(process.cwd(), "lib/og-fonts", name));
  const [grover, x, sb, r] = await Promise.all([f("IrishGrover-Regular.woff"), f("Inter-ExtraBold.ttf"), f("Inter-SemiBold.ttf"), f("Inter-Regular.ttf")]);
  return [
    { name: "Grover", data: grover, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: x, weight: 800 as const, style: "normal" as const },
    { name: "Inter", data: sb, weight: 600 as const, style: "normal" as const },
    { name: "Inter", data: r, weight: 400 as const, style: "normal" as const },
  ];
}

/** A file from /public as a data URI (for images inside previews). */
export async function publicImage(path: string, type: string) {
  const buf = await readFile(join(process.cwd(), "public", path));
  return `data:${type};base64,${buf.toString("base64")}`;
}

const STARS = Array.from({ length: 70 }, (_, i) => {
  const a = (i * 9301 + 49297) % 233280;
  const b = (i * 4271 + 1237) % 233280;
  return { x: (a / 233280) * 1200, y: 10 + (b / 233280) * 620, r: 1 + (i % 3) * 0.7, o: 0.25 + (i % 5) * 0.13 };
});

/** Background, top bar, stars and footer shared by every preview. */
export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: C.bg, color: "#fff", fontFamily: "Inter" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 12, background: C.accent }} />
      <div style={{ position: "absolute", right: -160, top: -200, width: 560, height: 560, borderRadius: 999, background: "radial-gradient(circle, rgba(31,66,130,0.55) 0%, rgba(6,21,47,0) 70%)" }} />
      {STARS.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: 99, background: "#fff", opacity: s.o }} />
      ))}
      {children}
      <div style={{ position: "absolute", left: 64, bottom: 40, display: "flex", alignItems: "center", gap: 14, fontSize: 20, color: C.muted }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ICON_SRC} width={40} height={40} alt="" />
        <span style={{ fontWeight: 800, color: "#fff", letterSpacing: 1 }}>COSMIC JUNIORS</span>
        <span>·  cosmic-juniors.vercel.app  ·  NASA Space Apps 2026, Beirut</span>
      </div>
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", fontSize: 22, fontWeight: 800, letterSpacing: 1, color: C.sky, textTransform: "uppercase" }}>{children}</div>;
}

export function Chips({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
      {items.map((c) => (
        <div key={c} style={{ display: "flex", padding: "10px 20px", borderRadius: 999, background: C.burgundy, border: "2px solid #e0a3bb", fontSize: 20, fontWeight: 600, color: "#fff" }}>
          {c}
        </div>
      ))}
    </div>
  );
}

/** The whole-site preview. */
export function SitePreview({ photo }: { photo: string }) {
  return (
    <Frame>
      <div style={{ position: "absolute", left: 64, top: 74, width: 620, display: "flex", flexDirection: "column" }}>
        <Eyebrow>The next generation of space explorers</Eyebrow>
        <div style={{ display: "flex", marginTop: 14, fontSize: 104, fontWeight: 800, lineHeight: 0.95, letterSpacing: -2 }}>COSMIC</div>
        <div style={{ display: "flex", fontSize: 104, fontWeight: 800, lineHeight: 0.95, letterSpacing: -2 }}>JUNIORS</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 28, lineHeight: 1.4, color: C.text }}>
          Stories and facts about the machines NASA left on Mars and the Moon.
        </div>
        <Chips items={["Storyline", "Explorers", "Ask Cosmo", "Games"]} />
      </div>
      <div style={{ position: "absolute", right: 64, top: 78, width: 400, height: 430, display: "flex", flexDirection: "column", padding: 16, borderRadius: 28, background: C.plum, transform: "rotate(3deg)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} width={368} height={207} alt="" style={{ borderRadius: 18, objectFit: "cover" }} />
        <div style={{ display: "flex", marginTop: 22, fontSize: 18, fontWeight: 800, color: C.sky }}>01</div>
        <div style={{ display: "flex", marginTop: 4, fontSize: 34, fontWeight: 800 }}>STORYLINE</div>
        <div style={{ display: "flex", marginTop: 8, fontSize: 20, color: C.muted }}>Follow Sojourner on its adventure on Mars.</div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 20, fontWeight: 800, color: "#70bfff" }}>Explore the story →</div>
      </div>
    </Frame>
  );
}

/** Preview with a playful title, a line of text and an illustration on the right. */
export function TitlePreview({ eyebrow, title, text, art, artW, artH, chips }: { eyebrow: string; title: string; text: string; art?: string; artW?: number; artH?: number; chips?: string[] }) {
  return (
    <Frame>
      <div style={{ position: "absolute", left: 64, top: 84, width: art ? 560 : 1000, display: "flex", flexDirection: "column" }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <div style={{ display: "flex", marginTop: 18, fontFamily: "Grover", fontSize: title.length > 18 ? 72 : 88, lineHeight: 1.05 }}>{title}</div>
        <div style={{ display: "flex", width: 158, height: 6, marginTop: 22, borderRadius: 3, background: C.burgundy }} />
        <div style={{ display: "flex", marginTop: 26, fontSize: 28, lineHeight: 1.4, color: C.text }}>{text}</div>
        {chips && <Chips items={chips} />}
      </div>
      {art && (
        <div style={{ position: "absolute", right: 48, top: 112, width: 540, height: 360, display: "flex", alignItems: "flex-end", justifyContent: "center", borderRadius: 28, background: C.card, border: `2px solid ${C.line}`, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={art} width={artW} height={artH} alt="" />
        </div>
      )}
    </Frame>
  );
}

/** Ask Cosmo preview: a mini chat with a real, verified answer. */
export function ChatPreview() {
  const bubble = { display: "flex", padding: "18px 24px", borderRadius: 24, fontSize: 26, lineHeight: 1.35 } as const;
  return (
    <Frame>
      <div style={{ position: "absolute", left: 64, top: 84, width: 520, display: "flex", flexDirection: "column" }}>
        <Eyebrow>AI chatbot</Eyebrow>
        <div style={{ display: "flex", marginTop: 14, fontFamily: "Grover", fontSize: 96, lineHeight: 1 }}>Ask</div>
        <div style={{ display: "flex", alignItems: "center", fontFamily: "Grover", fontSize: 96, lineHeight: 1 }}>
          <span>C</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={planetSrc(false)} width={104} height={104} alt="" />
          <span>SM</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={planetSrc(true)} width={104} height={104} alt="" />
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 28, lineHeight: 1.4, color: C.text }}>
          Real NASA sources on every answer, and every number fact-checked.
        </div>
      </div>
      <div style={{ position: "absolute", right: 56, top: 92, width: 520, height: 420, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, padding: 28, borderRadius: 28, background: C.plum }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ ...bubble, background: C.burgundy, border: "2px solid #e0a3bb" }}>Where is Sojourner now?</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ICON_SRC} width={46} height={46} alt="" />
          <div style={{ ...bubble, flexDirection: "column", background: C.card, border: `2px solid ${C.line}`, width: 380 }}>
            <span>It rests in Ares Vallis on Mars, silent since Sept. 27, 1997.</span>
          </div>
        </div>
        <div style={{ display: "flex", alignSelf: "flex-start", marginLeft: 58, padding: "8px 16px", borderRadius: 999, background: "rgba(74,222,128,0.12)", border: "2px solid rgba(74,222,128,0.5)", color: "#4ade80", fontSize: 18, fontWeight: 600 }}>
          ✓ NASA source · Mars Pathfinder
        </div>
      </div>
    </Frame>
  );
}

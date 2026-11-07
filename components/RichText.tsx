// Lightweight formatter for Cosmo's answers (no extra libraries):
// paragraphs, "- " bullet lists, **bold**, and highlighted scientific facts
// (numbers with units, dates and years), so key facts stand out.

const MONTH = "(?:Jan|Feb|March|April|May|June|July|Aug|Sept|Oct|Nov|Dec)\\.?";
const FACT = new RegExp(
  [
    `${MONTH}\\s+\\d{1,2},\\s+\\d{4}`, // dates: July 4, 1997
    `\\d[\\d,.]*\\s?(?:km|kilometers?|kilometres?|miles?|meters?|metres?|cm|centimeters?|kg|kilograms?|pounds?|mph|kph|°C|°F|degrees|days|years|hours|minutes|times|percent|%|pictures|flights)\\b`,
    `\\b(?:1[89]|20)\\d{2}\\b`, // years
  ].join("|"),
  "g",
);

function inline(text: string, key: string) {
  // **bold** first, then fact highlights inside each piece.
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${key}b${i}`}>{part.slice(2, -2)}</strong>;
    const out: React.ReactNode[] = [];
    let last = 0;
    for (const m of part.matchAll(FACT)) {
      if (m.index! > last) out.push(part.slice(last, m.index));
      out.push(
        <mark key={`${key}f${i}-${m.index}`} className="fact-hl">
          {m[0]}
        </mark>,
      );
      last = m.index! + m[0].length;
    }
    out.push(part.slice(last));
    return out;
  });
}

export default function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, b) => {
        const lines = block.split("\n");
        const isList = lines.length > 1 && lines.every((l) => /^\s*[-•]\s+/.test(l) || !l.trim());
        if (isList) {
          return (
            <ul key={b} className="rt-list">
              {lines
                .filter((l) => l.trim())
                .map((l, i) => (
                  <li key={i}>{inline(l.replace(/^\s*[-•]\s+/, ""), `${b}-${i}`)}</li>
                ))}
            </ul>
          );
        }
        // A paragraph that ends in a list: "Intro:\n- a\n- b"
        const firstBullet = lines.findIndex((l) => /^\s*[-•]\s+/.test(l));
        if (firstBullet > 0) {
          return (
            <div key={b}>
              <p className="rt-p">{inline(lines.slice(0, firstBullet).join(" "), `${b}p`)}</p>
              <ul className="rt-list">
                {lines.slice(firstBullet).filter((l) => l.trim()).map((l, i) => (
                  <li key={i}>{inline(l.replace(/^\s*[-•]\s+/, ""), `${b}l${i}`)}</li>
                ))}
              </ul>
            </div>
          );
        }
        return (
          <p key={b} className="rt-p">
            {inline(lines.join(" "), `${b}`)}
          </p>
        );
      })}
    </>
  );
}

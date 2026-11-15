type ChapterText = { paragraphs: readonly string[] };
export type EmphasisRange = { start: number; end: number };

const firstMentions = [
  "Sojourner", "Mars Pathfinder", "Ares Vallis", "rocker-bogie",
  "Alpha Proton X-ray Spectrometer", "APXS", "Barnacle Bill", "Yogi", "Scooby Doo", "Chimp",
  "Spirit", "Opportunity", "Curiosity", "Perseverance",
];

const turningPoints = [
  ["flames roared beneath the rocket", "Mars grew closer"],
  ["Then came the parachute.", "bounced approximately fifteen times", "the landing was only the beginning"],
  ["failed to retract completely", "a wheeled robotic vehicle was operating on the surface of another planet"],
  ["could not communicate directly with Earth", "the lander's modem", "With communication restored"],
  ["ancient water had once moved through this part of Mars"],
  ["a radio signal could take several minutes to travel in one direction", "far longer than anyone had originally expected"],
  ["seven-day mission became an eighty-three-day exploration", "the rover would lose its normal communication link"],
  ["last successful data transmission cycle", "it contained no spacecraft data", "communication could not be restored"],
  ["its subsequent movements remained unknown", "mission was officially concluded", "without a final message from the explorer itself"],
  ["no spacecraft came to retrieve it", "its journey is still being told"],
];

function findRanges(text: string, phrases: Set<string>): EmphasisRange[] {
  const matches: EmphasisRange[] = [];
  for (const phrase of phrases) {
    const start = text.indexOf(phrase);
    if (start < 0) continue;
    matches.push({ start, end: start + phrase.length });
    phrases.delete(phrase);
  }
  return matches;
}

export function withNovelEmphasis<T extends ChapterText>(chapters: readonly T[]) {
  const introductions = new Set(firstMentions);

  return chapters.map((chapter, index) => {
    const changes = new Set(turningPoints[index]);
    const emphasis = chapter.paragraphs.map((paragraph) =>
      [...findRanges(paragraph, introductions), ...findRanges(paragraph, changes)]
        .sort((a, b) => a.start - b.start || b.end - a.end),
    );
    return { ...chapter, emphasis };
  });
}

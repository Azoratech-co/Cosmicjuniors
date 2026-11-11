/** Small moving touches laid over the Storyline and Wiki card pictures. */
export function StoryTouch() {
  return (
    <span className="card-touch card-touch--story" aria-hidden="true">
      <span className="card-touch__pill">
        <span className="card-touch__wave"><i /><i /><i /><i /></span>
        Chapter 1 · Read aloud
      </span>
      <span className="card-touch__progress"><i /></span>
    </span>
  );
}

const TAGS = ["Sojourner · 1997", "Spirit · 2004", "InSight · 2018"];

export function WikiTouch() {
  return (
    <span className="card-touch card-touch--wiki" aria-hidden="true">
      {TAGS.map((t, i) => (
        <span key={t} className="card-touch__tag" style={{ animationDelay: `${i * 3}s` }}>{t}</span>
      ))}
    </span>
  );
}

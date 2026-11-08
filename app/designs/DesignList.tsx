"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { THEMES, applyTheme, currentTheme, type ThemeId } from "@/lib/themes";

export default function DesignList() {
  const [on, setOn] = useState<ThemeId | null>(null);
  useEffect(() => setOn(currentTheme()), []);
  return (
    <>
      <p className="c-muted" style={{ marginBottom: 18 }}>
        All designs are live. Pick one to use it on this device, or share a link like <code>/?theme=ink-sand</code>.
      </p>
      <div className="designs">
        {THEMES.map((t) => (
          <div key={t.id} className={`design-card${on === t.id ? " is-on" : ""}`}>
            <button
              className="design-card__swatch"
              onClick={() => {
                applyTheme(t.id);
                setOn(t.id);
              }}
              aria-label={`Use the ${t.name} design`}
            >
              {t.swatch.map((c) => (
                <span key={c} style={{ background: c }} />
              ))}
            </button>
            <div className="design-card__body">
              <span className="design-card__name">
                {t.name}
                {on === t.id ? " · in use" : ""}
              </span>
              <span className="design-card__note">{t.note}</span>
              <span className="design-card__links">
                <Link href={`/?theme=${t.id}`}>Open chat</Link> · <Link href={`/games?theme=${t.id}`}>Open games</Link>
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

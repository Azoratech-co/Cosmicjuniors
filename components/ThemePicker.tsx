"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { THEMES, applyTheme, currentTheme, type ThemeId } from "@/lib/themes";

// Small "Design" switcher so the team can compare every live design.
export default function ThemePicker() {
  const [theme, setTheme] = useState<ThemeId | null>(null);
  useEffect(() => {
    const sync = () => setTheme(currentTheme());
    sync();
    window.addEventListener("cj-theme-changed", sync);
    return () => window.removeEventListener("cj-theme-changed", sync);
  }, []);
  if (!theme) return null;
  return (
    <span className="theme-picker">
      <label htmlFor="theme-select">Design</label>
      <select id="theme-select" value={theme} onChange={(e) => applyTheme(e.target.value as ThemeId)}>
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <Link href="/designs">All</Link>
    </span>
  );
}

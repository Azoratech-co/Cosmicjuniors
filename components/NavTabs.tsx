"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Main navigation, the same on every page. On phones the tabs shrink to icons
// (the current page keeps its label).

const ICON = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

const TABS = [
  { href: "/", label: "Home", match: (p: string) => p === "/", icon: <svg {...ICON}><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" /></svg> },
  { href: "/story/sojourner", label: "Story", match: (p: string) => p.startsWith("/story"), icon: <svg {...ICON}><path d="M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0z" /><path d="M12 5.5V19" /></svg> },
  { href: "/explorers", label: "Explorers", match: (p: string) => p.startsWith("/explorers"), icon: <svg {...ICON}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg> },
  { href: "/chat", label: "Ask Cosmo", match: (p: string) => p.startsWith("/chat"), icon: <svg {...ICON}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" /></svg> },
  { href: "/games", label: "Games", match: (p: string) => p.startsWith("/games"), icon: <svg {...ICON}><rect x="3" y="7" width="18" height="11" rx="4" /><path d="M8 10.5v4M6 12.5h4" /></svg> },
];

export default function NavTabs() {
  const path = usePathname() ?? "/";
  return (
    <nav className="nav-tabs" aria-label="Main">
      {TABS.map((t) => {
        const on = t.match(path);
        return (
          <Link key={t.href} href={t.href} className={`nav-tabs__tab${on ? " is-on" : ""}`} aria-current={on ? "page" : undefined} aria-label={t.label} title={t.label}>
            {t.icon}
            <span className="nav-tabs__label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

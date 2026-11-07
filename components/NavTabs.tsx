"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The two experiences: Ask Cosmo (main) and Games (secondary). Shown in every header.
export default function NavTabs() {
  const path = usePathname() ?? "/";
  const games = path.startsWith("/games");
  return (
    <nav className="nav-tabs" aria-label="Main">
      <Link href="/" className={`nav-tabs__tab${games ? "" : " is-on"}`} aria-current={games ? undefined : "page"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        Ask Cosmo
      </Link>
      <Link href="/games" className={`nav-tabs__tab${games ? " is-on" : ""}`} aria-current={games ? "page" : undefined}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="7" width="18" height="11" rx="4" stroke="currentColor" strokeWidth="2" />
          <path d="M8 10.5v4M6 12.5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="15.5" cy="11.5" r="1.2" fill="currentColor" />
          <circle cx="17.5" cy="14" r="1.2" fill="currentColor" />
        </svg>
        Games
      </Link>
    </nav>
  );
}

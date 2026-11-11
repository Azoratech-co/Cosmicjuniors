import Link from "next/link";
import CosmoLogo, { LogoTile } from "../CosmoLogo";
import NavTabs from "../NavTabs";
import { StarCount } from "./StarCount";

/** Header for the website pages (home, explorers, story, games). */
export default function SiteHeader() {
  return (
    <>
      <div className="top-accent" aria-hidden="true" />
      <header className="chat-header site-header">
        <Link href="/" className="site-header__brand" aria-label="Cosmic Juniors home">
          <LogoTile size={36} />
          <span className="site-header__name">Cosmic Juniors</span>
          <CosmoLogo size={17} className="site-header__word" />
        </Link>
        <NavTabs />
        <StarCount />
      </header>
    </>
  );
}

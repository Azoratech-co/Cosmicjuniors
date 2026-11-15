import type { Metadata } from "next";
import Starfield from "@/components/Starfield";
import BackLink from "@/components/site/BackLink";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Podcast · Cosmic Juniors",
  description: "Podcast episodes are coming soon.",
};

export default function PodcastPage() {
  return (
    <div className="site-page">
      <Starfield />
      <SiteHeader />
      <main className="site-main site-main--narrow">
        <div className="page-top">
          <div>
            <h1 className="display-title">Podcast</h1>
            <p className="page-tagline">Podcast episodes are coming soon.</p>
          </div>
          <BackLink href="/" label="Back to home" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

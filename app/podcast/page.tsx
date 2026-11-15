import type { Metadata } from "next";
import Starfield from "@/components/Starfield";
import BackLink from "@/components/site/BackLink";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { PODCAST_YOUTUBE_ID } from "@/lib/home";

export const metadata: Metadata = {
  title: "Podcast · Cosmic Juniors",
  description: "Watch the Cosmic Juniors podcast.",
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
            <p className="page-tagline">Watch the Cosmic Juniors podcast.</p>
          </div>
          <BackLink href="/" label="Back to home" />
        </div>
        <div className="video-card">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${PODCAST_YOUTUBE_ID}`}
            title="Cosmic Juniors podcast"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

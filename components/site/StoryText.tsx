import Link from "next/link";
import { notFound } from "next/navigation";
import Starfield from "@/components/Starfield";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import BackLink from "@/components/site/BackLink";
import StoryReader from "@/components/site/StoryReader";
import { SIGN_VIDEOS, STORY_IDS, getStory } from "@/lib/storyline";

/** The story as text: chapters, NASA photos, read-aloud and the sign language panel. */
export default function StoryText({ id }: { id: string }) {
  const story = getStory(id);
  if (!story) notFound();
  const next = id === "sojourner" ? getStory("spirit") : undefined;

  return (
    <div className="site-page">
      <Starfield />
      <SiteHeader />
      <main className="site-main site-main--narrow">
        <div className="page-top">
          <div>
            <p className="crumb">Storyline</p>
            <h1 className="display-title">{story.title.split(":")[0]}</h1>
            <p className="page-tagline">{story.title.split(":")[1]?.trim()}</p>
            <span className="title-accent" aria-hidden="true" />
          </div>
          <BackLink href="/" label="Back to main page" />
        </div>
        <div className="story-switch" role="tablist" aria-label="Stories">
          {STORY_IDS.map((sid) => (
            <Link key={sid} href={`/story/${sid}`} role="tab" aria-selected={sid === id} className={sid === id ? "is-on" : ""}>
              {sid === "sojourner" ? "Sojourner" : "Spirit"}
              {sid === "spirit" && <span className="story-switch__tag">in progress</span>}
            </Link>
          ))}
        </div>
        <StoryReader story={story} signVideos={SIGN_VIDEOS[id] ?? {}} nextStory={next ? { id: next.id, title: next.title.split(":")[0] } : undefined} />
      </main>
      <SiteFooter />
    </div>
  );
}

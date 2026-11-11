import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Starfield from "@/components/Starfield";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import BackLink from "@/components/site/BackLink";
import StoryReader from "@/components/site/StoryReader";
import { SIGN_VIDEOS, STORY_IDS, getStory } from "@/lib/storyline";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return STORY_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getStory((await params).id);
  if (!s) return {};
  return { title: `${s.title} · Cosmic Juniors Storyline`, description: `A story by ${s.authors}, the Cosmic Juniors team.` };
}

export default async function StoryPage({ params }: Props) {
  const { id } = await params;
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
            <p className="crumb">Storyline · by {story.authors}</p>
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

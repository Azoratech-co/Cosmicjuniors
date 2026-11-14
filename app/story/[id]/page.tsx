import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import StoryScroll from "@/components/site/StoryScroll";
import { STORY_IDS, getStory } from "@/lib/storyline";
import { SOJOURNER_SCENES } from "@/lib/story/sojourner";
import StoryText from "@/components/site/StoryText";

// The Storyline tab. Stories with scenes open as one continuous scroll (a framed picture on a
// starry stage, the story's lines rising through it). The others show their full text for now.

const SCENES = { sojourner: SOJOURNER_SCENES } as const;

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return STORY_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getStory((await params).id);
  if (!s) return {};
  return { title: `${s.title} · Cosmic Juniors Storyline`, description: "Scroll through the story with real NASA photos, and ask Cosmo about any moment." };
}

export default async function StoryPage({ params }: Props) {
  const { id } = await params;
  const story = getStory(id);
  if (!story) notFound();
  const scenes = SCENES[id as keyof typeof SCENES];
  if (!scenes) return <StoryText id={id} />;
  const [name, sub] = story.title.split(":");
  const chapters = Object.fromEntries(story.chapters.map((c) => [c.n, c.title]));
  return (
    <div className="site-page story-scroll-page">
      <SiteHeader />
      <StoryScroll scenes={scenes} storyTitle={name} storySubtitle={sub?.trim() ?? ""} chapters={chapters} folder={`/story/${id}/`} />
      <div className="ss-after">
        {id === "sojourner" && <Link className="btn-purple cta" href="/games/story-quiz">Take the story quiz · 10 questions</Link>}
        <Link className="btn-purple cta" href={`/story/${id}/text`}>Read the full story</Link>
        <Link className="btn-ghost cta" href="/chat?mode=story">Ask Cosmo about the story</Link>
        <Link className="btn-ghost cta" href="/story/spirit">Next: Spirit&apos;s story</Link>
      </div>
      <SiteFooter />
    </div>
  );
}

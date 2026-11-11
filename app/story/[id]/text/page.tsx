import type { Metadata } from "next";
import StoryText from "@/components/site/StoryText";
import { STORY_IDS, getStory } from "@/lib/storyline";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return STORY_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getStory((await params).id);
  if (!s) return {};
  return { title: `${s.title} · Full text · Cosmic Juniors`, description: "The full text of the story, with read-aloud and NASA photos." };
}

export default async function StoryTextPage({ params }: Props) {
  const { id } = await params;
  return <StoryText id={id} />;
}

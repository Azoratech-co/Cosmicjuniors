import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FilmPlayer from "@/components/film/FilmPlayer";
import { SOJOURNER_FILM } from "@/lib/film/sojourner";
import { getStory } from "@/lib/storyline";

// The story as a short scrolling film: animated scenes, captions and narration.

const FILMS = { sojourner: SOJOURNER_FILM } as const;

export const generateStaticParams = () => Object.keys(FILMS).map((id) => ({ id }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const s = getStory((await params).id);
  if (!s) return {};
  return {
    title: `Watch: ${s.title} · Cosmic Juniors`,
    description: "The story as a short film: real NASA photos and animated scenes, narrated, with Cosmo ready to answer questions.",
  };
}

export default async function FilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenes = FILMS[id as keyof typeof FILMS];
  const story = getStory(id);
  if (!scenes || !story) notFound();
  const chapters = Object.fromEntries(story.chapters.map((c) => [c.n, c.title]));
  return <FilmPlayer id={id} title={story.title} scenes={scenes} chapters={chapters} />;
}

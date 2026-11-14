import type { Metadata } from "next";
import GameShell from "@/components/games/GameShell";
import StoryQuiz from "@/components/games/StoryQuiz";
import styles from "@/components/games/StoryQuiz.module.css";

const description = "How well do you remember Sojourner's story? Try ten multiple-choice questions, one from each chapter, with answers explained from the story.";

export const metadata: Metadata = {
  title: "Sojourner Story Quiz · Cosmic Juniors",
  description,
  openGraph: { title: "Sojourner Story Quiz · Cosmic Juniors", description, url: "/games/story-quiz", type: "website" },
  twitter: { card: "summary_large_image", title: "Sojourner Story Quiz · Cosmic Juniors", description },
};

export default function StoryQuizPage() {
  return (
    <div className={styles.page}>
      <GameShell
        title="Sojourner Story Quiz"
        tagline="You followed the adventure. What do you remember?"
        showPlanet={false}
      >
        <StoryQuiz />
      </GameShell>
    </div>
  );
}

import { redirect } from "next/navigation";

// The homepage (Figma: "Cosmic Juniors | Homepage Desktop") isn't built yet.
// Until it is, send visitors straight to the chatbot.
export default function Home() {
  redirect("/chat");
}

import type { Metadata } from "next";
import ChatApp from "@/components/ChatApp";

export const metadata: Metadata = {
  title: "Ask Cosmo · Cosmic Juniors",
  description: "Ask Cosmo anything about Mars and space missions. Every answer comes from NASA.",
};

export default function ChatPage() {
  return <ChatApp />;
}

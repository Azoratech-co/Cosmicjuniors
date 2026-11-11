import type { Metadata } from "next";
import ChatApp from "@/components/ChatApp";

export const metadata: Metadata = {
  title: "Ask Cosmo · Cosmic Juniors",
  description: "Ask Cosmo about the machines NASA left on Mars and the Moon. Every answer has NASA sources and fact-checked numbers.",
};

export default function ChatPage() {
  return <ChatApp />;
}

import Image from "next/image";
import { LogoTile } from "@/components/CosmoLogo";

/** AI Chatbot card picture: Perseverance's selfie on Mars, with Cosmo saying hello. */
export default function ChatCardArt() {
  return (
    <>
      <Image
        src="/home/chatbot-perseverance.jpg"
        alt="NASA's Perseverance rover takes a selfie on Mars, with the Ingenuity helicopter behind it"
        width={1536}
        height={864}
        sizes="(max-width: 700px) 92vw, 360px"
      />
      <span className="chat-card-bubble" aria-hidden="true">
        <LogoTile size={26} />
        <span>
          Hi! I&apos;m Cosmo.
          <br />
          Ask me about Mars.
        </span>
      </span>
    </>
  );
}

import CosmoLogo from "@/components/CosmoLogo";

/** The AI Chatbot card picture: Cosmo's own wordmark on its navy logo tile. */
export default function ChatCardArt() {
  return (
    <span className="chat-card-art" aria-hidden="true">
      <span className="chat-card-art__ring" />
      <span className="chat-card-art__title">
        <span>Ask</span> <CosmoLogo size={40} />
      </span>
      <span className="chat-card-art__line">Real NASA sources on every answer</span>
    </span>
  );
}

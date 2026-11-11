import { LogoTile } from "@/components/CosmoLogo";

/** Art for the "AI Chatbot" card: a tiny chat that plays on a loop. */
export default function ChatCardArt() {
  return (
    <span className="chat-art" aria-hidden="true">
      <span className="chat-art__stars" />
      <span className="chat-art__mars" />
      <span className="chat-art__head">
        <LogoTile size={22} />
        <b>Cosmo</b>
        <i>online</i>
      </span>
      <span className="chat-art__q">Where is Sojourner now?</span>
      <span className="chat-art__row">
        <LogoTile size={20} />
        <span className="chat-art__dots"><i /><i /><i /></span>
        <span className="chat-art__a">
          It rests in <mark>Ares Vallis</mark> on Mars, silent since <mark>Sept. 27, 1997</mark>.
        </span>
      </span>
      <span className="chat-art__src">✓ NASA source · Mars Pathfinder</span>
    </span>
  );
}

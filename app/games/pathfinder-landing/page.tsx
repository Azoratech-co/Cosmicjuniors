import { permanentRedirect } from "next/navigation";

// The Pathfinder simulator is now game 3, "Mars Pathfinder Landing".
export default function PathfinderLandingPage() {
  permanentRedirect("/games/landing");
}

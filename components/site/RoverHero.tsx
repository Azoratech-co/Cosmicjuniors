import type { World } from "@/lib/explorers";

/** The team's big explorer illustration (Mars or Moon version) with its badge. Gently floats. */
export default function RoverHero({ world, badge }: { world: World; badge: string }) {
  return (
    <div className={`rover-hero rover-hero--${world}`}>
      <span className="rover-hero__badge">{badge}</span>
      <span className="rover-hero__twinkle rover-hero__twinkle--a" aria-hidden="true" />
      <span className="rover-hero__twinkle rover-hero__twinkle--b" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="rover-hero__art"
        src={world === "moon" ? "/figma/hero-moon.svg" : "/figma/hero-mars.svg"}
        alt={world === "moon" ? "Illustration of a rover on the Moon" : "Illustration of a rover waving on Mars"}
        width={world === "moon" ? 626 : 622}
        height={world === "moon" ? 350 : 389}
      />
    </div>
  );
}

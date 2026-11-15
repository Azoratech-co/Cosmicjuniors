"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { World } from "@/lib/explorers";
import styles from "./JourneyPanel.module.css";

const trackWidth = 220;
const trackHeight = 280;
const route = "M110 0 V56 C110 83 58 87 58 110 C58 148 162 136 162 173 C162 199 110 200 110 224 V280";

function JourneyPlanet({ world, name }: { world: World | "earth"; name: string }) {
  return (
    <div className={styles.planet} data-world={world}>
      <Image src={"/explorer-art/" + world + ".webp"} alt="" width={512} height={512} unoptimized />
      <span>{name}</span>
    </div>
  );
}

export default function JourneyPanel({ destination }: { destination: World }) {
  const panelRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const rocketRef = useRef<HTMLImageElement>(null);
  const name = destination === "mars" ? "Mars" : "Moon";

  useEffect(() => {
    const panel = panelRef.current;
    const path = pathRef.current;
    const track = path?.ownerSVGElement;
    const rocket = rocketRef.current;
    if (!panel || !path || !track || !rocket) return;

    const routeLength = path.getTotalLength();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const placeRocket = () => {
      frame = 0;
      const bounds = panel.getBoundingClientRect();
      const trackBounds = track.getBoundingClientRect();
      const viewport = window.innerHeight;
      const panelTop = bounds.top + window.scrollY;
      const firstScroll = Math.max(0, panelTop - viewport * 0.88);
      // The Moon panel sits near the footer and can reach its destination at the end of the page.
      const lastScroll = Math.min(document.documentElement.scrollHeight - viewport, panelTop + bounds.height - viewport * 0.35);
      const progress = reducedMotion.matches || lastScroll <= firstScroll
        ? 0.5
        : Math.max(0, Math.min(1, (window.scrollY - firstScroll) / (lastScroll - firstScroll)));
      const scaleX = trackBounds.width / trackWidth;
      const scaleY = trackBounds.height / trackHeight;
      if (scaleY <= 0) return;

      // The straight ends let the exhaust touch Earth and the nose touch the destination.
      const endInset = Math.min(routeLength / 2, rocket.offsetHeight / (2 * scaleY));
      const distance = endInset + (routeLength - endInset * 2) * progress;
      const point = path.getPointAtLength(distance);
      const from = path.getPointAtLength(Math.max(0, distance - 1));
      const to = path.getPointAtLength(Math.min(routeLength, distance + 1));
      const x = point.x * scaleX - trackBounds.width / 2;
      const y = point.y * scaleY - trackBounds.height / 2;
      const angle = Math.atan2((to.x - from.x) * scaleX, (from.y - to.y) * scaleY);

      rocket.style.transform = "translate3d(" + x + "px," + y + "px,0) translate(-50%, -50%) rotate(" + angle + "rad)";
    };

    function schedule() {
      if (!frame) frame = requestAnimationFrame(placeRocket);
    }

    const observer = new ResizeObserver(schedule);
    observer.observe(panel);
    observer.observe(track);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
    schedule();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <figure className={styles.panel} ref={panelRef} role="img" aria-label={"Illustrated rocket route from Earth to " + (destination === "moon" ? "the Moon" : "Mars")}>
      <JourneyPlanet world="earth" name="Earth" />
      <div className={styles.course} aria-hidden="true">
        <svg className={styles.track} viewBox={"0 0 " + trackWidth + " " + trackHeight} preserveAspectRatio="none">
          <path ref={pathRef} d={route} vectorEffect="non-scaling-stroke" />
        </svg>
        <Image className={styles.rocket} ref={rocketRef} src="/figma/rocket.svg" alt="" width={68} height={166} />
      </div>
      <JourneyPlanet world={destination} name={name} />
    </figure>
  );
}

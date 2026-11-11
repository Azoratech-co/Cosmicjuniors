"use client";

import { useEffect, useState } from "react";
import { STARS_EVENT, getStars } from "@/lib/stars";

export function StarCount() {
  const [stars, setStars] = useState(0);
  useEffect(() => {
    const sync = () => setStars(getStars());
    sync();
    window.addEventListener(STARS_EVENT, sync);
    return () => window.removeEventListener(STARS_EVENT, sync);
  }, []);
  return (
    <span className="stars-badge t-label" aria-label={`${stars} stars collected`}>
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" />
      </svg>
      {stars}
    </span>
  );
}

"use client";

import { useEffect, useState } from "react";
import { SOUND_EVENT, isMuted, setMuted, unlock } from "@/lib/sound";

/** Sound on/off button for the games. The choice is remembered on this device. */
export default function SoundToggle() {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const sync = () => setOff(isMuted());
    sync();
    window.addEventListener(SOUND_EVENT, sync);
    return () => window.removeEventListener(SOUND_EVENT, sync);
  }, []);
  return (
    <button
      type="button"
      className="btn-ghost t-label sound-toggle"
      aria-pressed={!off}
      onClick={() => {
        unlock();
        setMuted(!off);
      }}
      title={off ? "Turn sound on" : "Turn sound off"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9z" />
        {off ? <path d="M17 9l4 6M21 9l-4 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
      </svg>
      <span>{off ? "Sound off" : "Sound on"}</span>
    </button>
  );
}

import type { CardImage } from "../types";

// The AI never writes links itself. Each card picture maps to a fixed,
// trusted NASA page here, so kids can only be sent to these sites.

export const CARD_IMAGES: CardImage[] = ["mars", "saturn", "moon", "sun", "earth", "rocket", "blackhole"];

export const CARD_LINKS: Record<CardImage, { label: string; href: string }> = {
  mars: { label: "See real Mars photos 📸", href: "https://science.nasa.gov/mars/" },
  saturn: { label: "Explore Saturn 🪐", href: "https://science.nasa.gov/saturn/" },
  moon: { label: "Visit the Moon 🌙", href: "https://science.nasa.gov/moon/" },
  sun: { label: "See the Sun up close ☀️", href: "https://science.nasa.gov/sun/" },
  earth: { label: "See Earth from space 🌍", href: "https://science.nasa.gov/earth/" },
  rocket: { label: "Watch NASA launches 🚀", href: "https://www.nasa.gov/missions/" },
  blackhole: { label: "Learn about black holes 🕳️", href: "https://science.nasa.gov/universe/black-holes/" },
};

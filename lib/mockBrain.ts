import type { ChatReply } from "./types";

// Placeholder "AI" with canned answers, so the UI can be built and demoed
// before the real model is connected. Replace `mockReply` in
// app/api/chat/route.ts with a real model call when ready.

interface Topic {
  keywords: string[];
  reply: ChatReply;
}

const topics: Topic[] = [
  {
    keywords: ["mars", "red planet", "rover"],
    reply: {
      text: "Great question! 🤩 Mars is covered in dust full of iron oxide — that's rust! So the whole planet is like a giant rusty ball.",
      card: {
        title: "Mars, the Red Planet",
        body: "A day on Mars lasts 24 hours and 37 minutes — almost like Earth! But a year there is 687 days long.",
        image: "mars",
        button: { label: "See real Mars photos 📸", href: "https://science.nasa.gov/mission/mars-2020-perseverance/raw-images/" },
      },
      suggestions: ["Can I visit Mars? 🚀", "Show me rovers 🤖", "Quiz me! 🧠"],
    },
  },
  {
    keywords: ["saturn", "ring"],
    reply: {
      text: "Saturn's rings are made of billions of chunks of ice and rock 🧊 — some as small as a grain of sand, some as big as a house!",
      card: {
        title: "Saturn, the Ringed Giant",
        body: "Saturn is so light for its size that it would float in a giant bathtub! It has more than 140 moons.",
        image: "saturn",
        button: { label: "Explore Saturn 🪐", href: "https://science.nasa.gov/saturn/" },
      },
      suggestions: ["How many moons? 🌙", "Could I stand on Saturn?", "Quiz me! 🧠"],
    },
  },
  {
    keywords: ["moon", "shape", "phase"],
    reply: {
      text: "The Moon doesn't really change shape! 🌙 The Sun always lights up half of it, and as it travels around Earth we see different amounts of that bright half.",
      card: {
        title: "Our Moon",
        body: "Only 12 people have ever walked on the Moon. Their footprints are still there because there's no wind to blow them away!",
        image: "moon",
        button: { label: "Meet the Artemis missions 🚀", href: "https://www.nasa.gov/humans-in-space/artemis/" },
      },
      suggestions: ["Who walked on the Moon? 👨‍🚀", "Why is it gray?", "Quiz me! 🧠"],
    },
  },
  {
    keywords: ["rocket", "fly", "launch"],
    reply: {
      text: "Rockets push hot gas down really, really fast 🔥 — and that pushes the rocket up! It's like letting go of a balloon, but way more powerful.",
      card: {
        title: "Blast off!",
        body: "To escape Earth's gravity, a rocket has to go about 40,000 km/h. That's 30 times faster than a jet plane!",
        image: "rocket",
        button: { label: "Watch a NASA launch 🎥", href: "https://plus.nasa.gov/" },
      },
      suggestions: ["How big is a rocket? 📏", "Where do rockets go?", "Quiz me! 🧠"],
    },
  },
  {
    keywords: ["astronaut", "eat", "food", "space station", "iss"],
    reply: {
      text: "Astronauts eat lots of normal food — like tortillas, fruit and even pizza 🍕! But no bread, because crumbs would float around and get into machines.",
      card: {
        title: "Life on the Space Station",
        body: "Astronauts on the ISS see 16 sunrises and 16 sunsets every single day!",
        image: "earth",
        button: { label: "Visit the Space Station 🛰️", href: "https://www.nasa.gov/international-space-station/" },
      },
      suggestions: ["How do they sleep? 😴", "How do they shower? 🚿", "Quiz me! 🧠"],
    },
  },
  {
    keywords: ["sun", "star"],
    reply: {
      text: "The Sun is a star! ⭐ It's a giant ball of super-hot gas, mostly hydrogen and helium, and it makes light and heat by squishing atoms together.",
      card: {
        title: "Our Star, the Sun",
        body: "About 1.3 million Earths could fit inside the Sun! Its light takes about 8 minutes to reach us.",
        image: "sun",
        button: { label: "See the Sun up close ☀️", href: "https://science.nasa.gov/sun/" },
      },
      suggestions: ["Will the Sun burn out?", "What's the biggest star?", "Quiz me! 🧠"],
    },
  },
  {
    keywords: ["black hole"],
    reply: {
      text: "A black hole is a place where gravity is SO strong that nothing can escape — not even light! 🌌 That's why it looks black.",
      card: {
        title: "Black Holes",
        body: "In 2019, scientists took the very first picture of a black hole. It's 55 million light-years away!",
        image: "blackhole",
        button: { label: "Learn about black holes 🕳️", href: "https://science.nasa.gov/universe/black-holes/" },
      },
      suggestions: ["Can a black hole eat Earth?", "How are they made?", "Quiz me! 🧠"],
    },
  },
  {
    keywords: ["quiz"],
    reply: {
      text: "Quiz time! 🧠 Which planet is the biggest in our Solar System?",
      suggestions: ["Jupiter 🟠", "Saturn 🪐", "Earth 🌍"],
    },
  },
  {
    keywords: ["jupiter"],
    reply: {
      text: "Correct! 🎉 Jupiter is the biggest — more than 1,300 Earths could fit inside it. You earned a star! ⭐",
      suggestions: ["Another quiz! 🧠", "Tell me about Jupiter's storm 🌀"],
    },
  },
];

const fallback: ChatReply = {
  text: "Ooh, that's a fun one! 🤔 I'm still learning about that. Want to explore one of these instead?",
  suggestions: ["Why is Mars red? 🔴", "How do rockets fly? 🚀", "What is a black hole? 🌌"],
};

export function mockReply(question: string): ChatReply {
  const q = question.toLowerCase();
  if (/^(earth|saturn)\b/.test(q) && q.length < 12) {
    return { text: "Good guess, but not quite! 😊 The answer is Jupiter — over 1,300 Earths could fit inside it!", suggestions: ["Another quiz! 🧠"] };
  }
  const hit = topics.find((t) => t.keywords.some((k) => q.includes(k)));
  return hit ? hit.reply : fallback;
}

// Starter questions for the welcome screen and the sidebar topic list.

export interface Starter {
  topic: string;
  label: string;
  question: string;
}

export const STARTERS: Starter[] = [
  { topic: "Mars · Rovers", label: "Mars & rovers", question: "What did the first Mars rover discover?" },
  { topic: "Moon · Artemis", label: "Moon & Artemis", question: "Who flew around the Moon on Artemis II?" },
  { topic: "Saturn", label: "Saturn", question: "Why does Saturn have rings?" },
  { topic: "The Sun", label: "The Sun", question: "How hot is the Sun?" },
  { topic: "Space Station", label: "Space Station", question: "How fast does the space station fly?" },
  { topic: "Deep space", label: "Deep space", question: "What can the Webb telescope see?" },
];

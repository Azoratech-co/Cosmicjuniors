export interface StoryQuizQuestion {
  id: string;
  chapter: number;
  question: string;
  choices: readonly [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  /** Exact manuscript evidence, checked by tests; paragraph numbers are one-based. */
  evidence: { paragraph: number; quote: string };
}

// One question per chapter of the team's published Sojourner story. Keep the
// evidence in sync with content/stories.json rather than adding outside trivia.
export const SOJOURNER_QUIZ: readonly StoryQuizQuestion[] = [
  {
    id: "journey",
    chapter: 1,
    question: "About how long did Sojourner's journey from Earth to Mars take?",
    choices: ["Seven days", "Nearly seven months", "Three years", "One afternoon"],
    correctIndex: 1,
    explanation: "Sojourner travelled for nearly seven months, folded safely inside the lander while engineers on Earth guided the spacecraft.",
    evidence: { paragraph: 6, quote: "For nearly seven months the spacecraft travelled through space." },
  },
  {
    id: "airbags",
    chapter: 2,
    question: "Why did enormous airbags inflate around the Pathfinder lander?",
    choices: ["To help it float on a lake", "To collect Martian air", "To lift it back into space", "To cushion its impact with the ground"],
    correctIndex: 3,
    explanation: "The airbags absorbed the force of impact. Pathfinder bounced about fifteen times before coming to rest.",
    evidence: { paragraph: 6, quote: "These protective cushions were designed to absorb the force of impact." },
  },
  {
    id: "blocked-ramp",
    chapter: 3,
    question: "What blocked Sojourner's ramp after the lander's petals opened?",
    choices: ["An airbag that had not fully pulled back", "A broken rover wheel", "A pile of snow", "A missing solar panel"],
    correctIndex: 0,
    explanation: "An airbag had not retracted completely. Engineers studied the pictures and resolved the obstruction so Sojourner could roll onto Mars.",
    evidence: { paragraph: 3, quote: "One of the large airbags had failed to retract completely, obstructing the ramp that Sojourner needed to use." },
  },
  {
    id: "radio-relay",
    chapter: 4,
    question: "How did Sojourner send its information back to Earth?",
    choices: ["Through a cable stretching to Earth", "By sending messages directly to Earth", "Through the Pathfinder lander, which relayed it", "By sending a rocket home each day"],
    correctIndex: 2,
    explanation: "Sojourner could not communicate directly with Earth. Pathfinder relayed the rover's information to the large radio antennas back home.",
    evidence: { paragraph: 6, quote: "It depended on the Pathfinder lander to receive its information and relay it to the large radio antennas on Earth." },
  },
  {
    id: "apxs",
    chapter: 5,
    question: "What did Sojourner use its APXS instrument to investigate?",
    choices: ["The speed of the Martian wind", "The chemical elements in rocks and soil", "The distance to the Sun", "The sounds made by other rovers"],
    correctIndex: 1,
    explanation: "The APXS measured chemical elements in rocks and soil, helping scientists work out what the materials were made of.",
    evidence: { paragraph: 3, quote: "This instrument was designed to investigate the chemical elements present in rocks and soil." },
  },
  {
    id: "signal-delay",
    chapter: 6,
    question: "Why couldn't engineers instantly watch Sojourner respond to a command?",
    choices: ["Mars had no gravity", "The rover only worked at night", "The cameras could only see Earth", "Radio signals took several minutes to travel one way"],
    correctIndex: 3,
    explanation: "Earth and Mars are far apart. Radio signals could take several minutes one way, so the team had to plan activities and wait for information to return.",
    evidence: { paragraph: 5, quote: "Depending on the planets' positions, a radio signal could take several minutes to travel in one direction." },
  },
  {
    id: "longer-mission",
    chapter: 7,
    question: "How did Sojourner's mission compare with its original seven-day plan?",
    choices: ["It kept exploring for eighty-three days", "It stopped after one day", "It ended exactly as planned", "It lasted only seven hours"],
    correctIndex: 0,
    explanation: "The story describes a planned seven-day mission that became an eighty-three-day exploration—far longer than expected.",
    evidence: { paragraph: 5, quote: "Its planned seven-day mission became an eighty-three-day exploration." },
  },
  {
    id: "last-rock",
    chapter: 8,
    question: "Which rock had Sojourner studied when it was last heard from?",
    choices: ["Yogi", "Barnacle Bill", "Chimp", "Scooby Doo"],
    correctIndex: 2,
    explanation: "Sojourner had completed an APXS study of Chimp. The story then describes the loss of communication through the lander.",
    evidence: { paragraph: 3, quote: 'One of the rocks it had been investigating was "Chimp".' },
  },
  {
    id: "last-listen",
    chapter: 9,
    question: "What happened when NASA listened one last time on March 10, 1998?",
    choices: ["Sojourner sent a new photograph", "Pathfinder launched back to Earth", "Astronauts repaired the lander", "No signal came"],
    correctIndex: 3,
    explanation: "NASA heard no signal. The story is careful to say that Sojourner's movements after communication was lost remained unknown.",
    evidence: { paragraph: 10, quote: "No signal came, and the mission was over." },
  },
  {
    id: "legacy",
    chapter: 10,
    question: "Why does Sojourner's journey still matter, even though its radio is silent?",
    choices: ["It brought Martian rocks back to Earth", "It prepared the way for more advanced Mars rovers", "It proved that people had already lived on Mars", "It is still sending new photographs every day"],
    correctIndex: 1,
    explanation: "Sojourner showed that a wheeled robot could explore another planet. Its work helped prepare the way for Spirit, Opportunity, Curiosity and Perseverance.",
    evidence: { paragraph: 6, quote: "Its work also helped prepare the way for more advanced rovers that would follow." },
  },
];

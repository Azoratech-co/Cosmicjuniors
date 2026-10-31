# Cosmic Juniors · Sojourner

**Sojourner** is a space guide for young explorers, built for the **NASA Space Apps Challenge 2026
(Beirut)**. It is named after Sojourner, the first rover to drive on Mars (Mars Pathfinder, 1997).
Kids ask about planets, missions and rovers. Sojourner answers in clear, simple language using
**verified facts from NASA** and shows the NASA page and photo each answer comes from.

- **Live site:** https://cosmic-juniors.vercel.app
- **Design (Figma):** https://www.figma.com/design/xlAc0KK9rGCb5eSgOFLlaP (page **v2 · Sojourner**)
- **Stack:** Next.js (App Router) + TypeScript on Vercel, Groq for the language model

## Run it locally

```bash
npm install
cp .env.example .env.local   # then paste your Groq key (optional)
npm run dev                  # http://localhost:3000
npm run build                # production build (what Vercel runs)
npm run lint                 # type check
```

Without a key the app still works: it answers straight from the NASA notes.

## How the project is split

The **frontend** (what kids see) and **Sojourner's brain** (the AI) are separate.

```
app/
  page.tsx                → the chat page
  layout.tsx              → fonts: Public Sans, Newsreader, IBM Plex Mono
  globals.css             → all styles; tokens match the Figma variables
  api/chat/route.ts       → POST /api/chat: origin check, rate limit, input validation
components/               → UI pieces, one per Figma component
lib/
  types.ts                → the API contract (shared by UI and API)
  starters.ts             → starter questions and sidebar topics
  sojourner/              → 🧠 SOJOURNER'S BRAIN (server only)
    knowledge.ts          →   verified NASA facts, source links and photos  ← add topics here
    prompt.ts             →   personality and rules (tune the tone here)
    brain.ts              →   the flow: safety → NASA notes → model → source card
    sources.ts            →   builds the source card under each answer
    safety.ts             →   kid-safety checks and the careful pre-written replies
    config.ts             →   which models to use, limits
    groq.ts               →   tiny Groq client
  mockBrain.ts            → answers from the NASA notes when the AI is unavailable
  rateLimit.ts            → per-visitor request limit
```

## Where the facts come from

`lib/sojourner/knowledge.ts` holds facts copied from these NASA pages (checked October 2026).
For each question, the matching notes are given to the model, which may only use numbers, dates
and names from them. The page is then shown under the answer, with a public-domain photo from the
[NASA Image and Video Library](https://images.nasa.gov).

| Topic | NASA source | Photo |
| --- | --- | --- |
| Mars Pathfinder & Sojourner | [science.nasa.gov/mission/mars-pathfinder](https://science.nasa.gov/mission/mars-pathfinder/) | PIA04318 |
| Mars | [science.nasa.gov/mars/facts](https://science.nasa.gov/mars/facts/) | PIA00407 |
| Perseverance & Ingenuity | [science.nasa.gov/mission/mars-2020-perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/) | PIA24542 |
| The Moon | [science.nasa.gov/moon/facts](https://science.nasa.gov/moon/facts/) | as11-40-5903 |
| Artemis | [nasa.gov/humans-in-space/artemis](https://www.nasa.gov/humans-in-space/artemis/) | art002e021278 |
| Saturn | [science.nasa.gov/saturn/facts](https://science.nasa.gov/saturn/facts/) | PIA06193 |
| Jupiter | [science.nasa.gov/jupiter/facts](https://science.nasa.gov/jupiter/facts/) | PIA22965 |
| The Sun | [science.nasa.gov/sun/facts](https://science.nasa.gov/sun/facts/) | PIA26681 |
| Space Station | [nasa.gov/…/space-station-facts-and-figures](https://www.nasa.gov/international-space-station/space-station-facts-and-figures/) | s118e09341 |
| Black holes | [science.nasa.gov/universe/black-holes](https://science.nasa.gov/universe/black-holes/) | PIA23122 |
| James Webb Space Telescope | [science.nasa.gov/mission/webb](https://science.nasa.gov/mission/webb/) | carina_nebula |

**To add a topic:** copy facts from a NASA page into a new entry in `knowledge.ts`, add the page
URL and keywords, and pick a photo ID from images.nasa.gov.

## Running with the real AI

The key is **only** read on the server from the `GROQ_API_KEY` environment variable. It is never in
the code and never sent to the browser. On Vercel it is set in Project → Settings → Environment
Variables (type: Sensitive).

## How Sojourner keeps kids safe

1. **Front door** (`app/api/chat/route.ts`): blocks calls from other websites, limits each visitor
   to 10 questions a minute, rejects malformed or overly long messages.
2. **Instant pattern check:** catches phone numbers, emails, addresses and self-harm phrases
   before any AI is called, and answers with a careful pre-written reply.
3. **Trick check:** Meta's Prompt Guard model spots attempts to make Sojourner break its rules.
4. **The model labels every question** as ok / self_harm / personal_info / unsafe; anything
   not "ok" gets a pre-written reply instead of the AI's text.
5. **Answer filter:** replies are scanned for bad words or links. The model can't write links;
   source cards only point to the NASA pages in `knowledge.ts`.
6. **Fail safe:** if anything breaks, Sojourner answers from the NASA notes. Kids' messages are
   never logged.

**Groq free tier:** about 8,000 tokens a minute per model (roughly 5 questions a minute).
Sojourner uses `gpt-oss-120b` and switches to `gpt-oss-20b` when the first is busy. Upgrade to
Groq's Dev Tier for a busy demo day.

## The chat API contract

`POST /api/chat`

```jsonc
// request
{ "messages": [ { "role": "user", "text": "Why is Mars red?" } ] }

// response
{
  "text": "Mars looks red because iron minerals in its dirt rust…",
  "source": {                              // optional: the NASA page the answer is based on
    "id": "mars",
    "title": "Mars: Facts",
    "publisher": "NASA Science",
    "url": "https://science.nasa.gov/mars/facts/",
    "fact": "Olympus Mons on Mars is the largest volcano in the solar system…",
    "image": { "src": "https://images-assets.nasa.gov/…", "alt": "…", "credit": "NASA/JPL", "nasaId": "PIA00407" }
  },
  "suggestions": ["How tall is Olympus Mons?", "How long is a day on Mars?"]
}
```

## Design → code mapping

| Figma component (v2 · Sojourner) | Code |
| --- | --- |
| Avatar/Sojourner | `Avatar` in `components/ChatParts.tsx` (`RoverIcon` in `Icons.tsx`) |
| Top Bar | `TopBar` |
| Message/Assistant, Message/User | `MessageRow` |
| Card/Source | `SourceCard` |
| Button/Follow-up | `FollowUps` |
| Row/Prompt | `Welcome` |
| Message/Typing | `Typing` |
| Composer | `components/Composer.tsx` |

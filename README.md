# Cosmic Juniors · Ask Cosmo 🚀

**Cosmo** is the AI guide of Cosmic Juniors, built in Beirut for the **2026 NASA Space Apps Challenge**
**"Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars."**

Cosmo tells school-age explorers the stories of the machines NASA left behind: Sojourner and the
Pathfinder lander, the Viking landers, Spirit, Opportunity, InSight, Ingenuity, the Apollo lunar rovers
and the laser mirrors still used on the Moon. Every answer is based on **verified facts from NASA** and
shows a **source card** with the NASA page and a real NASA photo.

- **Live site:** https://cosmic-juniors.vercel.app
- **Design (Figma):** https://www.figma.com/design/xlAc0KK9rGCb5eSgOFLlaP (page **v4 · Cosmo (pro)**)
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

```
app/
  page.tsx                → the chat page
  layout.tsx              → fonts: Space Grotesk (headings) + Inter (text)
  globals.css             → all styles; tokens match the Figma variables
  api/chat/route.ts       → POST /api/chat: origin check, rate limit, input validation
components/               → UI pieces, one per Figma component
  ChatApp.tsx             → state: messages, stars, calling the API
  ChatParts.tsx           → header, messages, NASA source card, chips, welcome screen
  Composer.tsx            → text box + mic (voice input) + send
  Sidebar.tsx             → desktop sidebar: new conversation, recent, Explorer level
  Cosmo.tsx, Starfield.tsx → mascot and background
lib/
  types.ts                → the API contract (shared by UI and API)
  cosmo/                  → 🧠 COSMO'S BRAIN (server only)
    knowledge.ts          →   verified NASA facts, source links and photos  ← add topics here
    prompt.ts             →   personality, challenge focus and rules
    brain.ts              →   the flow: safety → NASA notes → model → source card
    sources.ts            →   builds the source card under each answer
    safety.ts             →   kid-safety checks and the careful pre-written replies
    config.ts / groq.ts   →   models, limits, tiny Groq client
  mockBrain.ts            → answers from the NASA notes when the AI is unavailable
  rateLimit.ts            → per-visitor request limit
```

## Where the facts come from

`lib/cosmo/knowledge.ts` holds facts copied from these NASA pages (checked Oct–Nov 2026). For each
question, the matching notes are given to the model, which may only use numbers, dates and names from
them. The page is shown under the answer with a public-domain photo from the
[NASA Image and Video Library](https://images.nasa.gov).

**Equipment left on Mars and the Moon (the challenge):**

| Topic | NASA source | Photo |
| --- | --- | --- |
| Mars Pathfinder & the Sojourner rover | [science.nasa.gov/mission/mars-pathfinder](https://science.nasa.gov/mission/mars-pathfinder/) | PIA04318 |
| Viking 1 & 2 landers | [science.nasa.gov/mission/viking](https://science.nasa.gov/mission/viking/) | PIA00381 |
| Spirit rover | [science.nasa.gov/mission/mer-spirit](https://science.nasa.gov/mission/mer-spirit/) | PIA04413 |
| Opportunity rover | [science.nasa.gov/mission/mer-opportunity](https://science.nasa.gov/mission/mer-opportunity/) | PIA17759 |
| InSight lander | [science.nasa.gov/mission/insight](https://science.nasa.gov/mission/insight/) | PIA25287 |
| Ingenuity helicopter | [science.nasa.gov/…/ingenuity-mars-helicopter](https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/) | PIA25970 |
| Apollo Lunar Roving Vehicles | [nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html](https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html) | as15-86-11603 |
| Apollo retroreflectors | [nasa.gov/image-article/retroreflectors-from-apollo-mars](https://www.nasa.gov/image-article/retroreflectors-from-apollo-mars/) | as11-40-5948 |

**General space topics:** Mars, Perseverance, the Moon, Artemis, Saturn, Jupiter, the Sun, the Space
Station, black holes and the Webb telescope, each from its NASA Science / NASA.gov facts page.

**To add a topic:** copy facts from a NASA page into a new entry in `knowledge.ts`, add the page URL and
keywords, and pick a photo ID from images.nasa.gov.

## Running with the real AI

The key is **only** read on the server from the `GROQ_API_KEY` environment variable. It is never in the
code and never sent to the browser. On Vercel it is set in Project → Settings → Environment Variables
(type: Sensitive).

## How Cosmo keeps kids safe

1. **Front door** (`app/api/chat/route.ts`): blocks calls from other websites, limits each visitor to
   10 questions a minute, rejects malformed or overly long messages.
2. **Instant pattern check:** catches phone numbers, emails, addresses and self-harm phrases before any
   AI is called, and answers with a careful pre-written reply.
3. **Trick check:** Meta's Prompt Guard model spots attempts to make Cosmo break its rules.
4. **The model labels every question** as ok / self_harm / personal_info / unsafe; anything not "ok"
   gets a pre-written reply instead of the AI's text.
5. **Answer filter:** replies are scanned for bad words or links. Source cards only point to the NASA
   pages in `knowledge.ts`.
6. **Fail safe:** if anything breaks, Cosmo answers from the NASA notes. Kids' messages are never logged.

**Groq free tier:** about 8,000 tokens a minute per model (roughly 5 questions a minute). Cosmo uses
`gpt-oss-120b` and switches to `gpt-oss-20b` when the first is busy.

## The chat API contract

`POST /api/chat`

```jsonc
// request
{ "messages": [ { "role": "user", "text": "Where is Sojourner now?" } ] }

// response
{
  "text": "Sojourner is still sitting on Mars, in the Ares Vallis plain…",
  "source": {                              // optional: the NASA page the answer is based on
    "id": "pathfinder",
    "title": "Mars Pathfinder",
    "publisher": "NASA Science",
    "url": "https://science.nasa.gov/mission/mars-pathfinder/",
    "fact": "The mission made more than 15 chemical analyses of Martian rocks and soil.",
    "image": { "src": "https://images-assets.nasa.gov/…", "alt": "…", "credit": "NASA/JPL", "nasaId": "PIA04318" }
  },
  "suggestions": ["How big was Sojourner?", "What did Viking find?"]
}
```

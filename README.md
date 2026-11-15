# Cosmic Juniors 🚀

**Cosmic Juniors** is a kids' website built in Beirut for the **2026 NASA Space Apps Challenge**,
**"Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars."**

It tells school-age explorers the stories of the machines NASA left behind, starting with **Sojourner**,
the first rover to drive on Mars. Kids can scroll through the story, read it as a comic or a novel, watch
it in sign language, explore the rovers and landers on 3D globes, play mission games, and ask **Cosmo**,
an AI guide whose answers are based on **verified facts from NASA**.

- **Live site:** https://cosmic-juniors.vercel.app
- **Repository:** https://github.com/Azoratech-co/Cosmicjuniors (every push to `main` deploys to Vercel automatically)
- **Vercel project:** https://vercel.com/azoratech-team/cosmic-juniors
- **Design (Figma):** https://www.figma.com/design/xlAc0KK9rGCb5eSgOFLlaP
- **Stack:** Next.js (App Router) + TypeScript + React Three Fiber on Vercel, Groq for the language model

## What's on the site

| Page | Address | What it does |
| --- | --- | --- |
| Home | `/` | Mission cards for every section, the team videos and About us. |
| Storyline | `/story/sojourner` | *Sojourner: The Journey Through the Stars* as a scrolling story with real NASA photos, live 3D models, sound, sign language videos and a ten-question quiz at the end. |
| Full text | `/story/sojourner/text`, `/story/spirit/text` | The stories as text with NASA photos and read-aloud. Sojourner is complete (10 chapters); Spirit is in progress (4 chapters). |
| Comic Book | `/story/sojourner/comic` | Sojourner's journey in eight illustrated comic pages. |
| Novel | `/novel` | The Sojourner novel in a book-style reader with pinned chapter navigation and read-aloud. |
| Wiki | `/explorers` | Sojourner, Spirit, Opportunity, InSight, Phoenix, the Lunar Roving Vehicle, Surveyor 3 and the Apollo 11 site, each with a 3D model. Detailed Mars and Moon globes show landing sites, and a Journey view shows recorded rover routes. |
| Ask Cosmo | `/chat` | The AI chatbot. Every answer shows a source card with the NASA page and a real NASA photo. Voice input is supported. |
| Games | `/games` | Sojourner Puzzle, Journey to Mars, Mars Pathfinder Landing (3D) and Dust Storm Entry. |
| Podcast | `/podcast` | The Cosmic Juniors podcast episode. |
| Designs | `/designs` | The six live themes side by side: Cosmic (default), Ink & Sand, Juniors, Beige, Mission control and Original. |

**Sign language:** the scrolling Sojourner story has ASL videos for its narrated scenes, in
`public/sign/sojourner/`, played in a panel that follows the scene being read.

**Videos:** the 2-minute team video is on the home page and the podcast is on `/podcast`. Both show our
own cover picture and load YouTube only when play is pressed. To change a video or cover, edit
`lib/home.ts`.

**Stars and levels:** kids earn stars by asking Cosmo questions and winning games. Progress is saved in
the browser only; there are no accounts.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then paste your Groq key (optional)
npm run dev                  # http://localhost:3000
npm run build                # production build (what Vercel runs)
npm run lint                 # type check
```

Without a key the app still works: Cosmo answers straight from the NASA notes.

## How the project is split

```
app/
  page.tsx                → home: mission cards, team videos, About us
  story/                  → scrolling story, full text and the Sojourner comic
  novel/                  → the novel reader (manuscripts.json holds the text)
  explorers/              → the Wiki: list page and one page per rover or lander
  chat/                   → Ask Cosmo
  games/                  → puzzle, dodge (Journey to Mars), landing, dust-storm-landing
  podcast/, designs/      → podcast page and the theme gallery
  api/chat/route.ts       → POST /api/chat: origin check, rate limit, input validation
  site.css, themes.css, globals.css → styles; each theme sets its own colours and fonts
components/
  ChatApp.tsx, ChatParts.tsx, Composer.tsx, Sidebar.tsx → the chat screen
  NavTabs.tsx, ThemePicker.tsx, Starfield.tsx           → navigation, theme switch, background
  site/                   → story reader, sign language panel, quiz, globes, journey panels, video cover
  games/                  → the four games
  rovers/                 → the 3D rover viewer and parts picker
content/
  stories.json            → the team's stories, as readers see them
lib/
  home.ts                 → home page content the team can edit: video ids, covers, About us
  storyline.ts, story/    → story chapters and the scrolling story's scenes
  explorers.ts            → the Wiki entries
  landing-sites.ts, mars-journeys.ts, mission-flights.ts → globe data
  themes.ts               → the six designs
  stars.ts, progress.ts   → stars, levels and badges
  types.ts                → the chat API contract (shared by UI and API)
  cosmo/                  → 🧠 COSMO'S BRAIN (server only)
    knowledge.ts          →   verified NASA facts, source links and photos  ← add topics here
    prompt.ts             →   personality, challenge focus and rules
    brain.ts              →   the flow: safety → NASA notes → model → source card
    sources.ts            →   builds the source card under each answer
    safety.ts             →   kid-safety checks and the careful pre-written replies
    config.ts / groq.ts   →   models, limits, tiny Groq client
  mockBrain.ts            → answers from the NASA notes when the AI is unavailable
  rateLimit.ts            → per-visitor request limit
public/
  story/, sign/, models/  → story pictures and comic pages, ASL videos, 3D models and globe surfaces
scripts/                  → builds the 3D models and prepares globe and journey data
docs/                     → notes on the globes, rover sites and journeys, the story quiz and the design brief
```

## Where Cosmo's facts come from

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

**Groq free tier:** about 8,000 tokens a minute per model (roughly 5 questions a minute). Cosmo tries
`gpt-oss-120b` first and moves down the backup list in `lib/cosmo/config.ts` when a model is busy.

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

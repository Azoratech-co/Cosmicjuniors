# Cosmic Juniors 🚀

**Cosmo** is a friendly AI space buddy for kids, built for the NASA Space Apps Challenge.
Kids ask questions about planets, stars, rockets and astronauts. Cosmo answers in simple
words, shows NASA fact cards, and rewards curiosity with ⭐ stars.

- **Live site:** https://cosmic-juniors.vercel.app
- **Design (Figma):** https://www.figma.com/design/xlAc0KK9rGCb5eSgOFLlaP
- **Stack:** Next.js (App Router) + TypeScript, hosted on Vercel

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (what Vercel runs)
npm run lint       # type check
```

## How the project is split

The **frontend** (what kids see) and **Cosmo's brain** (the AI) are separate, so they can be
worked on in parallel.

```
app/
  page.tsx                → the chat page
  layout.tsx              → fonts (Fredoka + Nunito) and page metadata
  globals.css             → all styles; color tokens match the Figma variables
  api/chat/route.ts       → POST /api/chat: origin check, rate limit, input validation
components/               → UI pieces, one per Figma component
lib/
  types.ts                → the API contract (shared by UI and API)
  cosmo/                  → 🧠 COSMO'S BRAIN (server only)
    brain.ts              →   the flow: safety checks → Groq model → clean reply
    prompt.ts             →   Cosmo's personality and rules (tune the "human touch" here)
    safety.ts             →   kid-safety checks and the gentle pre-written replies
    links.ts              →   the only links Cosmo can show (trusted NASA pages)
    config.ts             →   which models to use, limits
    groq.ts               →   tiny Groq client
  mockBrain.ts            → canned answers, used when there is no API key or Groq is down
  rateLimit.ts            → per-visitor request limit
```

## Running with the real AI

The AI uses [Groq](https://console.groq.com). The key is **only** read on the server from the
`GROQ_API_KEY` environment variable. It is never in the code and never sent to the browser.

- **On Vercel:** already set in Project → Settings → Environment Variables (type: Sensitive).
- **Locally:** copy `.env.example` to `.env.local` and paste your key. `.env.local` is git-ignored.
- **No key?** The app still works, using the canned answers in `lib/mockBrain.ts`.

## How Cosmo keeps kids safe

Every question goes through these layers (see `lib/cosmo/brain.ts`):

1. **Front door** (`app/api/chat/route.ts`): blocks calls from other websites, limits each visitor
   to 10 questions a minute, rejects malformed or overly long messages.
2. **Instant pattern check:** catches phone numbers, emails, addresses and self-harm phrases
   before any AI is called, and answers with a caring pre-written reply.
3. **Trick check:** Meta's Prompt Guard model spots attempts to make Cosmo break its rules.
4. **The model labels every question** as ok / self_harm / personal_info / unsafe; anything
   not "ok" gets a pre-written reply instead of the AI's text.
5. **Answer filter:** Cosmo's reply is scanned for bad words or links before kids see it.
   Cosmo can't write links at all; fact-card buttons only point to fixed NASA pages.
6. **Fail safe:** if anything breaks, Cosmo falls back to canned answers. Kids' messages are
   never logged.

**Groq free-tier note:** each model allows about 8,000 tokens a minute (roughly 5 questions a
minute). Cosmo uses `gpt-oss-120b` and switches to `gpt-oss-20b` when the first one is busy.
For a busy demo day, upgrade to Groq's Dev Tier. For a hard, shared rate limit across all
servers, add a Vercel Firewall rate-limit rule.

## The chat API contract

`POST /api/chat`

```jsonc
// request
{ "messages": [ { "role": "user", "text": "Why is Mars red?" } ] }

// response
{
  "text": "Mars is covered in dust full of iron oxide — that's rust!",
  "card": {                       // optional NASA fact card
    "title": "Mars, the Red Planet",
    "body": "A day on Mars lasts 24 hours and 37 minutes…",
    "image": "mars",              // mars | saturn | moon | sun | earth | rocket | blackhole
    "button": { "label": "See real Mars photos 📸", "href": "https://science.nasa.gov/mars/" }
  },
  "suggestions": ["Can I visit Mars? 🚀", "Quiz me! 🧠"]   // optional follow-up chips
}
```

## Design → code mapping

| Figma component     | Code                                  |
| ------------------- | ------------------------------------- |
| Avatar/Cosmo        | `components/Cosmo.tsx`                |
| Chat Header         | `ChatHeader` in `ChatParts.tsx`       |
| Message/Bot, User   | `MessageRow` in `ChatParts.tsx`       |
| Message/Typing      | `Typing` in `ChatParts.tsx`           |
| Card/Space Fact     | `FactCardView` in `ChatParts.tsx`     |
| Chip/Quick Reply    | `QuickReplies` in `ChatParts.tsx`     |
| Card/Suggestion     | `Welcome` in `ChatParts.tsx`          |
| Composer            | `components/Composer.tsx`             |

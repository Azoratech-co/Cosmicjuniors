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

The **frontend** (what kids see) and the **chat API** (Cosmo's brain) are separate,
so they can be worked on in parallel.

```
app/
  page.tsx              → the chat page
  layout.tsx            → fonts (Fredoka + Nunito) and page metadata
  globals.css           → all styles; color tokens match the Figma variables
  api/chat/route.ts     → POST /api/chat  ← the API team works here
components/             → UI pieces, one per Figma component
  ChatApp.tsx           → state: messages, stars, calling the API
  ChatParts.tsx         → header, bubbles, fact card, chips, welcome screen
  Composer.tsx          → text box + mic (voice input) + send
  Sidebar.tsx           → desktop sidebar with history and Explorer Level
  Cosmo.tsx, CardArt.tsx, Starfield.tsx → illustrations
lib/
  types.ts              → the API contract (shared by UI and API)
  mockBrain.ts          → fake answers used until the real AI is connected
```

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
    "button": { "label": "See real Mars photos 📸", "href": "https://…" }
  },
  "suggestions": ["Can I visit Mars? 🚀", "Quiz me! 🧠"]   // optional follow-up chips
}
```

Right now the API answers with canned replies from `lib/mockBrain.ts`. To connect a real
AI model, replace the `mockReply(...)` call in `app/api/chat/route.ts` and keep returning
the same shape. The UI won't need any changes.

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

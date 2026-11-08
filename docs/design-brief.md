# Cosmic Juniors — UI/UX Design Improvement Brief

Page: https://cosmic-juniors.vercel.app
Scope: Dedicated AI Chatbot & Games Page

## 1. Overall Design Direction

Improve the existing interface to feel more polished, modern, immersive and professional while preserving its current identity and purpose.

This page has two primary functions:

- **Ask Cosmo** — the AI-powered space exploration chatbot.
- **Games** — interactive educational space games.

Do not redesign this page into a general educational website. Its current structure and purpose should remain intact. The objective is to refine the existing experience, not replace it.

## 2. Ask Cosmo Interface

The chatbot should remain the main focus of the page. Recommended improvements:

- Improve visual hierarchy between the welcome section, chatbot and suggested prompts.
- Make the chat interface feel more immersive and less like a conventional chatbot.
- Refine message bubbles, spacing, typography and alignment.
- Give AI responses a polished layout with clear headings, paragraphs, lists and highlighted scientific facts.
- Improve the appearance of Explain Mode and Story Mode.
- Make suggested questions visually engaging and interactive.
- Add subtle animations when messages appear or when Cosmo is thinking.
- Improve the input field, send button and attachment or voice controls if supported.
- Make the conversation experience comfortable on smaller screens.

## 3. Visual Identity

Strengthen the existing space-themed aesthetic. Design direction:

- Deep navy and dark cosmic backgrounds.
- Subtle gradients and atmospheric lighting.
- Carefully placed stars and space elements.
- Consistent cyan, blue and purple accents.
- Clean typography with strong readability.
- Refined borders, shadows and rounded corners.
- Subtle transitions and hover effects.

Avoid excessive glow effects, unnecessary gradients, overcrowded backgrounds or generic AI-generated-looking visuals. The result should feel like a professionally designed space exploration product.

## 4. Games Section

Keep all three existing games and their current functionality. Improve their presentation through:

- More visually appealing game cards.
- Consistent image proportions and card dimensions.
- Clear titles, descriptions and difficulty indicators.
- Better hover and interaction states.
- More prominent Play buttons.
- Consistent spacing and alignment.

The games section should feel like a curated collection of space missions rather than a basic list of activities.

## 5. Explorer Progression

Improve the visual presentation of the existing explorer level and star system. Potential enhancements:

- More polished explorer profile.
- Progress bars and level indicators.
- Better visual representation of earned stars.
- Achievement badges.
- Clear progress feedback.

Keep these elements visually lightweight so they do not compete with Ask Cosmo.

## 6. Navigation and Layout

Refine the page structure without introducing unnecessary sections. Focus on:

- Clear navigation between Ask Cosmo and Games.
- Consistent header and footer.
- Better spacing between major sections.
- Logical content hierarchy.
- Smooth navigation and transitions.
- A responsive layout across desktop, tablet and mobile.

Ask Cosmo should remain the primary experience, with Games as the secondary experience.

## 7. Mobile Responsiveness

Give special attention to mobile devices. Requirements:

- Chat interface should use available screen space efficiently.
- Input field should remain easy to access.
- Suggested prompts should adapt to smaller screens.
- Game cards should stack or rearrange naturally.
- No horizontal overflow.
- Buttons and interactive elements should have comfortable touch targets.
- Text should remain readable without excessive scrolling.

## 8. Implementation Guidelines

- Preserve existing functionality and routes.
- Do not remove existing features.
- Do not replace working components unnecessarily.
- Maintain the current technology stack and architecture.
- Use reusable components and consistent design tokens.
- Avoid unnecessary dependencies.
- Optimize animations and assets for performance.
- Ensure accessibility and keyboard navigation.

## 9. Final Design Objective

The finished page should feel like a premium, dedicated AI-powered space exploration experience. The chatbot should be the visual centerpiece, the games should be an attractive secondary experience, and the entire interface should feel cohesive, polished and intuitive.

**Important:** Improve the existing product rather than creating an entirely different one.

---

## Live designs

All designs run on the same site as themes (see `app/themes.css` and `lib/themes.ts`).
Open one with `?theme=<id>` or pick it on `/designs`; the choice is remembered on each device.

| id | Design |
|---|---|
| `ink-sand` | Ink & Sand: sand #E8DCC8, midnight navy #1E2633, terracotta #C0674A (default) |
| `cosmic` | Polished dark navy from this brief |
| `beige` | Warm paper with star-chart dots |
| `mission` | Flat near-black mission control |
| `original` | The first purple + cyan look |

Older full snapshots are also on git branches: `backup/before-de-slop`, `backup/light-beige`, `backup/cosmic-dark`.

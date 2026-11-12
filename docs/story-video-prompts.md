# Sojourner story — video prompt pack (Higgsfield, unlimited only)

How to use:

1. Open **Claude chat** (claude.ai) or **Claude Cowork** with the **Higgsfield** connector on, signed in to the
   Cosmic Juniors Higgsfield account (the one on the Ultra plan). Unlimited generations do **not** work from
   Claude Code, which is why this runs there.
2. Paste **everything in the box below** (the master prompt + the scene list) as your first message.
3. Then say: **"Do scenes 06 to 10."** When they're done, **"Do scenes 11 to 15"**, and so on up to 27.
   At the end, say **"Redo scenes 01 to 05 in the storybook look"** (the first batch was made in a photo look).
   Small batches keep the chat from getting too long.
4. When all 27 are done, tell Claude Code (the website session): **"the clips are ready"**. It will find them
   in the Higgsfield library by their `[CJ-Sxx]` tag, download them and put them into the story.

---

```text
You are making the pictures and short video clips for "Sojourner: The Journey Through the Stars",
a kids' story website for the NASA Space Apps Challenge. Use the Higgsfield tools.

=== MONEY RULE (most important) ===
We pay NOTHING. Every image and video MUST be paid with the free UNLIMITED allowance, never with credits.
- On EVERY generate call, set use_unlim: true. Never omit it, never set it to false.
- Before the first image and the first video, call models_explore (unlim: true) and read the "Unlim configs":
  only use a model, resolution, duration and mode that the unlimited allowance actually covers.
- If any generation is rejected for unlimited, or would cost even 1 credit, STOP and tell me.
  Do NOT retry with credits, do NOT pick a paid setting, do NOT buy anything, do NOT start a trial.
- Use count 1 per generation (no variants).

=== WHERE THINGS GO ===
- Put everything in one Higgsfield project called "Cosmic Juniors – Sojourner Story" (create it once, reuse it).
- Start EVERY prompt with the scene tag, e.g. "[CJ-S05]" for scene 05. This is how the website finds the files.

=== THE LOOK (match the reference: a painted storybook) ===
Every still and clip must look like a page from a beautiful children's picture book, painted in oils/gouache:
visible soft brush strokes, rich colour, warm glowing light, gentle and magical, never scary.
Palette for the whole film: deep navy night skies full of small stars, soft lavender/purple clouds lit gold,
warm amber firelight; on Mars, rusty orange ground, butterscotch haze and pink-tan skies; Martian sunsets
glow blue around the Sun. Wide, calm, well-composed shots, like an establishing shot in an animated film.
Keep it TRUE to the real NASA photo: same hardware, same layout, same landscape, just repainted.
Never add: text, captions, watermarks, extra rovers, astronauts on Mars, aliens, faces on machines, or
invented machines. Real logos already on the hardware (like NASA on the rocket) are fine.
Hardware must stay accurate:
- Sojourner: small six-wheeled rover, flat dark solar panel on top, metal wheels with cleats, about knee-high.
- Pathfinder lander: a low three-sided (tetrahedral) lander whose three petals open flat, covered in solar
  cells, with a small mast camera; white multi-lobed airbags around it during landing.
- The launch: a Delta II rocket (teal-green first stage, white side boosters) at night at Cape Canaveral
  (it launched at 1:56 am), bright flame, billowing smoke.
- Mars sky: pale butterscotch / hazy pinkish-tan by day; Martian sunsets glow blue near the Sun.

=== MOTION ===
Like the reference: the camera stays almost still (a very slow push-in at most), and the SUBJECT moves:
the rocket lifts off, smoke billows, the parachute sways, dust drifts, the Sun sinks, stars twinkle,
clouds slide slowly. Smooth and gentle. Nothing morphs, melts, or changes shape.

=== FOR EACH SCENE (do them in order) ===
1. Import the scene's NASA photo with media_import_url (URL in the list below).
2. STILL: generate one 16:9 image with an image model the unlimited allowance covers (prefer Nano Banana Pro),
   the imported photo as the image reference, prompt = "[CJ-Sxx] " + the scene's STILL prompt + "Repaint this
   photo as a painted children's storybook illustration in the look described above, keeping the same
   composition and hardware."
3. CLIP: generate one video with a video model the unlimited allowance covers (prefer Seedance 2.0 or 2.5),
   the still from step 2 as the start image, 16:9, 5 seconds, NO audio (generate_audio: false),
   the highest resolution the unlimited allowance covers, prompt = "[CJ-Sxx] " + the scene's CLIP prompt.
   Follow the MOTION rules above.
4. After each batch, reply with a short table: scene | still job id | video job id | OK or problem.

=== SCENES ===
Photos are at https://cosmic-juniors.vercel.app/story/sojourner/<file> unless a full path is given.

S01 photo: prep.jpg
  STILL: Engineers in white cleanroom suits take a final look at the Mars Pathfinder spacecraft inside the
  launch tower, just before it is sealed in the rocket's nose; warm work lights, sense of a big moment.
  CLIP: Slow push-in toward the spacecraft; a worker steps back; lights hum; dust motes float in the beams.

S02 photo: spacecraft.jpg
  STILL: The Mars Pathfinder spacecraft standing in a bright Kennedy Space Center cleanroom, cone-shaped
  aeroshell on top, cruise stage ring below; it looks precious and ready.
  CLIP: Slow orbit of the camera around the spacecraft; soft reflections slide across the metal.

S03 photo: launch.jpg
  STILL: The Delta II rocket lifting off at night from Cape Canaveral on Dec. 4, 1996, blinding flame,
  huge clouds of white smoke lit orange from below.
  CLIP: The rocket rises out of frame; smoke billows outward; flickering firelight; camera tilts up following it.

S04 photo: earth.jpg
  STILL: Earth from space, a blue sphere wrapped in swirling white clouds against deep black space.
  CLIP: Earth slowly turns and recedes into the darkness as the camera drifts away; stars hold still.

S05 photo: mars.jpg
  STILL: Mars, orange-red with dark markings, hanging in black space, growing closer.
  CLIP: Very slow push-in toward Mars; the planet gently rotates; it fills more of the frame.

S06 photo: mars-canyon.jpg
  STILL: Mars seen from high above, with the great canyon system, as a spacecraft arrives at the edge of the
  thin atmosphere; a faint orange glow of entry heat in the upper corner.
  CLIP: Camera dives slowly toward the planet; a soft fiery glow streaks across the top of the frame.

S07 photo: parachute-test.jpg
  STILL: A giant white disk-gap-band parachute fully open, cinematic, dramatic lighting.
  CLIP: The parachute breathes and sways gently; lines tighten; slight camera drift.

S08 photo: airbags-test.jpg
  STILL: Pathfinder's huge white multi-lobed airbags fully inflated, a cluster of round lobes, engineers
  dwarfed beside them; strong sunlight.
  CLIP: Slow dolly around the airbag cluster; fabric ripples slightly in the wind.

S09 photo: landed.jpg
  STILL: The Pathfinder lander resting on the rocky red surface of Ares Vallis on July 4, 1997, airbags
  partly pulled in, Sojourner still folded on a petal, hazy butterscotch sky.
  CLIP: A drift of red dust settles; very slow push-in; light shifts as thin clouds pass.

S10 photo: panorama.jpg (wide panorama: keep the full width feel)
  STILL: Ares Vallis, a wide plain of reddish dust and scattered rocks under a pale hazy sky, two low hills
  on the horizon, untouched by time.
  CLIP: Slow sideways pan across the landscape; fine dust blows low over the ground.

S11 photo: lander-airbags.jpg
  STILL: Sojourner sitting on the lander's open petal, a deflated airbag bunched up beside its ramp,
  blocking the way; rocky Mars beyond.
  CLIP: Very slow push-in on the bunched airbag; a breath of wind lifts its edge slightly.

S12 photo: petals-test.jpg
  STILL: A lander with three open petals and deflated airbags on a red rocky test field, like Mars.
  CLIP: Slow crane move over the lander; shadows slide across the petals.

S13 photo: tracks.jpg (a black-and-white rover photo: paint it in colour)
  STILL: Fresh six-wheel rover tracks pressed into fine Martian soil, first tracks ever on another planet,
  painted in warm Martian colours.
  CLIP: Camera glides slowly along the tracks toward the horizon.

S14 photo: /figma/home-storyline.png  (full URL: https://cosmic-juniors.vercel.app/figma/home-storyline.png)
  STILL: Sojourner, a small six-wheeled rover with a flat solar panel, on rocky red ground, shot low and
  close so it feels small but brave.
  CLIP: The rover rolls forward very slowly, wheels turning; camera tracks beside it at ground level.

S15 photo: rock-garden.jpg (black-and-white: paint it in colour)
  STILL: Sojourner driving carefully through a field of rocks, the "Rock Garden".
  CLIP: The rover inches forward very slowly; camera stays still; a little dust lifts.

S16 photo: dsn.jpg
  STILL: A giant NASA Deep Space Network radio dish at Goldstone, California, under a night sky full of stars.
  CLIP: The dish turns slowly to point at the sky; stars glide; a faint glow on the horizon.

S17 photo: mosaic.jpg
  STILL: Sojourner on the lander looking out over the rocky terrain of Ares Vallis.
  CLIP: Slow push-in over the rocks; sunlight warms the scene.

S18 photo: yogi.jpg
  STILL: Sojourner right next to a big rounded boulder named Yogi, touching it with its instrument at the back.
  CLIP: Very slow circle around rover and rock; soft light; tiny dust in the air.

S19 photo: twin-peaks.jpg
  STILL: Large boulders and rounded pebbles in a dry flood channel on Mars, distant hills, hazy sky.
  CLIP: Slow push-in; for a moment a ghostly shimmer of ancient water flows between the rocks, then fades
  away to dry ground.

S20 photo: yogi-view.jpg (black-and-white wide-angle photo: paint it in colour)
  STILL: The big rock Yogi seen up close from rover height, as if through Sojourner's own eyes.
  CLIP: Gentle wobble as if the rover's camera is adjusting; very slow zoom.

S21 photo: panorama.jpg
  STILL: Ares Vallis landscape as the days pass, long shadows of late afternoon.
  CLIP: Time-lapse: the light moves across the landscape and shadows sweep around, like many days passing.

S22 photo: sunset.jpg (very wide)
  STILL: A Martian sunset over Ares Vallis, the Sun small with a blue glow around it, hills in silhouette.
  CLIP: The Sun slowly sinks; the blue glow fades; the land darkens.

S23 photo: sunset-peaks.jpg (very wide)
  STILL: Sunset over the Twin Peaks of Mars, last light fading, quiet and lonely.
  CLIP: The last light fades to dusk; first stars appear; camera completely still.

S24 photo: dsn.jpg
  STILL: The NASA radio dish at night, listening, a lonely silhouette against the Milky Way.
  CLIP: Very slow push-in on the dish; stars wheel overhead; complete stillness, waiting.

S25 photo: orbit.jpg (grey orbital photo: paint it in Mars colours)
  STILL: The Pathfinder landing region seen from Mars orbit, cratered rusty plains seen from high above.
  CLIP: Slow zoom down toward the surface, as if from a passing spacecraft.

S26 photo: /figma/home-wiki.png  (full URL: https://cosmic-juniors.vercel.app/figma/home-wiki.png)
  STILL: The rovers that followed Sojourner (Spirit, Opportunity, Curiosity, Perseverance) on Mars at golden
  hour, keep each rover's real shape.
  CLIP: Slow sideways dolly across the rovers; warm sunlight flares softly.

S27 photo: landed.jpg
  STILL: The Pathfinder lander and little Sojourner on Mars at night, silent, under a sky full of stars,
  Earth a tiny bright blue dot.
  CLIP: Camera slowly pulls back and up; the stars glitter; the little rover stays still. Abandoned, not forgotten.
```

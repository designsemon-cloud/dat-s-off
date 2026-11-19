# Organism → Scenery (engraved illustrations)

## 1. Overview

**Component**: [`Scenery.tsx`](../../src/components/landing/Scenery.tsx) exports `HeroScene` and `CtaScene`. **Art**: [`public/illustrations/`](../../public/illustrations/) `hero-scene.webp`, `cta-scene.webp`.

Full-bleed, 19th-century-engraving style scenery in the IdeaApe manner. The two scenes tell one story, a ship launch, as a metaphor for shipping UI: makers build fast, someone inspects before the users come aboard, then it sails.

- **Hero, "Launch day"**: a harbour shipyard. Left: shipwrights sawing and hammering, a crane lifting a beam (the people we serve: builders shipping every week, often without a designer). Right: a new ship's hull in scaffolding, and an inspector with a magnifying glass pinning a small flag on each flaw in the planks (the critique: every issue pinned). Lower middle: passengers with luggage queuing at the gangway behind a rope (the users, about to step on board). The sky in the middle stays empty for the title and composer.
- **CTA, "Setting sail"**: the harbour mouth. Left: a lighthouse on rocks, its keeper watching through a telescope (spotting hazards before they hit). Right: the end of a pier with a lamp post and townspeople waving. Bottom centre: the finished ship heading out to sea. The centre stays open for the closing headline.

The scenes say _who_ and _why_ without drawing the product: no screens, cursors or UI. Earlier art (a surveyor in a landscape; columns with a magnifier and a map-pin monument) used product symbols directly but told no story.

Landing page only. Use one scene per section, never behind dense content.

## 2. Tokens

- Ink color: `bg-ink` → `--ink` (light `#1E2022`, dark `#8E949E`). The art is an **alpha mask**, not a picture, so the ink is always a palette token.
- Two masks per scene, swapped by `.ink-art` / `.dark .ink-art` in `styles.css` via `--art-light` / `--art-dark`: `name.webp` (the ink strokes) and `name-dark.webp` (scratchboard). Using the stroke mask on dark paper turns the drawing into a photo negative: the darkest hatching (coats, shadows) becomes the brightest thing on screen. The dark mask instead lights the paper between strokes, so lit surfaces are light and shadows stay dark, like a moonlit print.
- Paper: whatever is behind it (`bg-background` + `.bg-grain`), so the grain reads through the drawing.
- Edge fades: a second mask layer intersected with the art (`FADES.bottom` for the hero, `FADES.both` for the CTA).
- Aspect `1536 / 864`. Width `max(100%, 700px)` (hero) / `max(100%, 900px)` (CTA), centred, so narrow screens crop the sides rather than shrink the drawing.

## 3. Anatomy & variants

| Variant     | Layers                                                                                                                     | Content overlay                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `HeroScene` | one ink layer, bottom-anchored, bottom edge faded                                                                          | badge, H1, lede, composer, centred; `pb-[max(21vw,190px)]` keeps the foreground visible below the composer |
| `CtaScene`  | three `clip-path` strips (left 0–38%, centre 38–62%, right 62–100%, overlapping 0.2%), then one unsplit layer once settled | H2, line, two buttons, centred; `pt-[11vw] pb-[18vw]`                                                      |

**Pipeline** (for new art, sharp in Node): generate black ink on white paper at 1536×864 →

1. Light mask: alpha = `clamp((236 − L) / 130) ^ 0.65` → WebP with alpha, ~210–320 KB. The curve keeps strokes near-solid black like the original pure-ink art; a straight linear ramp turns the generator's grey tones semi-transparent and the whole drawing looks faded. A hard threshold goes too far the other way (shadows block up, hatching is lost).
2. Dark mask: stroke density `D` = blur(σ 6) of `L < 175` → `d = smoothstep(min(1, D / 120))`; alpha = `d × (L / 255)^1.5` → `name-dark.webp`.
3. Reference both via `inkMask("name", fade)` on an `.ink-art bg-ink` element. The originals live in the Figma file "Dats Off. — engraved illustrations" (personal team), generated with Figma AI (`gpt-image-2.5-flare`).

## 4. States & interactions

| Scene                                             | Motion                                                                                                                                                                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hero, on load                                     | sharpens from `blur(14px)`, scale 1.04 → 1, 1.4s                                                                                                                                                                                                             |
| Hero, scrolling away                              | blur 0 → 10px, sinks 0 → 120px, scale 1 → 1.08, opacity → 0.35. The section uses `overflow-x-clip` so the blurred scene can drift past the hero instead of being cut off                                                                                     |
| Hero copy, scrolling away                         | lifts 0 → −60px, fades out by 70% progress                                                                                                                                                                                                                   |
| CTA, scrolling in (`start end` → `center center`) | lighthouse and pier strips slide in from ±90px while the centre strip (the ship) rises 36px; all blur 12 → 0px, opacity 0.15 → 1, settling by 85% progress. At 85% the strips are swapped for the single unsplit drawing, so no hairline seams cross the sea |

Decorative and non-interactive (`pointer-events-none`).

## 5. Accessibility

- `aria-hidden`; the copy carries the meaning.
- Reduced motion: no load blur, no scroll blur, parallax or curtain; the scene renders static and sharp.
- Contrast: all text sits on the empty sky / centre, never on the hatching. Keep it that way when changing copy length; long headlines must wrap inside the open area.

## 6. Content guidelines

Scenes tell the product story through people and situations (makers, an inspector, waiting passengers, a send-off), never with words or UI: no text in the art. Keep the centre empty in any new scene; prompt for "the middle X% must be blank white". Anything at the exact centre of the CTA art must sit inside the centre strip (38–62%).

## 7. Anti-patterns

- Shipping the art as a normal `<img>` with a white background: it can't follow the theme and the white paper fights the grain. Always convert to an alpha mask.
- `mix-blend-mode` tricks instead of the mask: they break inside isolated stacking contexts (`.bg-grain` isolates).
- `overflow-hidden` on the hero: it guillotines the blurred scene mid-scroll.
- A scene behind cards or long text.
- More than two scenes on the page: they're the page's set pieces.

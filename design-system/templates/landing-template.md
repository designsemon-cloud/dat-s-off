# Template → Landing (marketing)

**Component**: [`Landing.tsx`](../../src/components/uxcc/Landing.tsx) at `/`, sections in [`src/components/landing/`](../../src/components/landing/). The product itself lives in the `/app` shell ([`app-shell-template.md`](app-shell-template.md)).

v2 follows the IdeaApe page structure: a grey grain page, a full-bleed engraved hero, textured paper cards, every section in one 960px left-aligned column, and an engraved closing scene. The content and order of v1 stayed; the styling and motion changed.

## Page background (rule)

The whole page is `bg-background` + `.bg-grain` (one continuous surface, no section bands). Sections are transparent; content sits on textured `Card`s. The hero and final CTA have no panel: their engravings ([`scenery.md`](../organisms/scenery.md)) are ink masks drawn straight onto the page paper and fade into it at the edges. `GradientWaves` is no longer used.

## Structure

```
Nav (fixed, floats over the page)
  left: Logo, glossy "Dats off." (sheen on hover; turns to liquid glass after 24px of scroll).
        Click: the page scrolls up, then reloads "/" at the top (`<Logo reload />`).
  right: pill  [Examples · How it works · Resources · Pricing · FAQ] [Sign in] [ThemeToggle] [Open app ◎ cosmic sm]
         (solid pill at the top; after 24px of scroll both the logo chip and the pill turn to `.liquid-glass`:
          iOS-style liquid glass. A thin fill, blur + saturate, a specular sheen (::before) and a bright masked
          rim (::after). In Chromium (`html.lg-refract`) the backdrop also goes through the SVG filter
          `#liquid-glass` (landing/LiquidGlass.tsx): the edges refract what's behind them, red, green and blue
          by slightly different amounts, for a faint chromatic fringe. Safari and Firefox keep the frosted
          glass. No progress line under the nav.)
         links hide below md, Sign in below sm; "Open app" is the small CosmicButton

Hero  — full-bleed HeroScene (engraved shipyard on launch day: makers, an inspector pinning flags on
         the hull's flaws, passengers queuing at the gangway)
  centred in the open sky: BeamChip [ShieldCheck] "5 free reviews, no sign-up" (border beam, landing only)
         H1 Forum 46/72px "The design review your AI never did." (glossy words blur in)
         lede 16/18px "Drop a screenshot of what you built. See what's off, why it matters, and get a
           prompt to paste into" + ToolStack (Cursor, v0, Lovable, Claude, ChatGPT marks
           in 28px round chips, overlapping −2px; names in sr-only text)
         PromptComposer, Claude-style input (starts a real session → /app/s/$id)
  scroll: scene blurs, sinks and fades; copy lifts and fades

Tools row       Eyebrow "Fix prompts written for" + 6 textured Tiles with monochrome marks: Cursor,
                v0, Lovable, bolt.new (text wordmark), Claude, ChatGPT — blurring in one by one
WhyDatsOff      #why              "Not another UX critique tool." Ruled list (whole flows · fix, re-check,
                                  repeat · a prompt and the why) beside a dark video player: a scripted
                                  film per point, subtitles, chapter bars, play/pause, sound off until
                                  turned on (cues + voice-over) (organisms/why-dats-off.md)
WhatItCatches   #what-it-catches  3 × 2 grid of cards, each with a themed stage looping problem → fix
                                  (chromatic snap, radar, sheen, scramble, spinner → check, flow path),
                                  a status chip, and a hover spotlight (organisms/what-it-catches.md)
Showcase        #examples         ProductDemo, full-bleed (100vw, square edges): a Mac-style desktop
                                  (vintage cloud wallpaper, menu bar) with a browser window holding the real
                                  app (the actual components, scaled and inert: organisms/product-demo.md)
                                  looping input → analyzing → output on the two samples; video controls
                                  sit centred under the window. "Not a vibe check. A real review." Then a centred
                                  CTA row: CosmicButton "Review your screenshot" + SolidButton "Open a sample
                                  review" + "5 free reviews · no sign-up"
HowItWorks      #how-it-works     01 / 02 cards side by side, 03 full width; each MockFrame loops its step
                                  (drag-drop-send, pick an answer, copy → pasted into a real AI-tool logo row, cycling Cursor / v0 / Lovable / Claude / ChatGPT)
Learn           #learn            "Learn the why behind every fix." A learning library: direction-aware topic
                                  tabs (sliding pill) and two auto-scrolling rows, in the column, of cutout cards,
                                  Watch (18 NN/g videos, play in a lightbox) drifting left and Read (38
                                  articles and tools) drifting right; hover stops both. Footer: sources line
                                  + "See it in a sample review →" (patterns/learning.md)
Engine          #engine           4 count-up stats (12 rule checks, 8 judgment calls, 3 questions max,
                                  1 prompt per issue) + Pass 1 / Pass 2 cards
Pricing         #pricing          one textured panel of three plans, each with a plain "For …" line:
                                  Free ($0, 5 credits, black CTA → /app) | white Pro card (Monthly|Yearly
                                  PillTabs, $10/month ↔ $99/year + "Save $21", orange CosmicButton) |
                                  Credit pack ($5, black CTA) (organisms/pricing-panel.md)
FAQ             #faq              ruled accordion (no cards), bare 20px + icon (tertiary) that turns to ×, no container
Final CTA       full-bleed CtaScene (lighthouse, waving pier, the ship sailing out) closing in like a
                curtain; centred Forum 60px glossy "Something's off. Find out what.", CosmicButton + SolidButton
Footer          centred logo, tagline, large section links, small app links with dividers, ©,
                                then a full-width glossy "Dats off." wordmark (29vw) cropped by the page end
```

## Accent budget

On any one viewport there is at most: the eyebrow dot, one accent phrase, and one orange CTA (now the `CosmicButton` border) or critical pin. The demo wallpaper is the one large colour field, contained inside the demo. Selected tabs, the nav CTA, persona icons, and the problem labels in the What it catches loops are greyscale. The one deliberate exception is the pricing panel's check icons, which copy the reference layout and sit next to its single orange button.

## Motion

Lenis smooth scroll (skipped under reduced motion), `BlurIn` reveals, drawn eyebrow rules, `CountUp`, hero parallax, the Why Dats Off. films, the What it catches stage loops, the product demo, looping mocks, the GSAP scroll effects (header drift, tile wave, demo tilt, Learn rows sliding in, every card rising into place by column, mocks floating inside their cards) and the wordmark sheen. Details in [`foundations/motion.md`](../foundations/motion.md) and [`molecules/landing-primitives.md`](../molecules/landing-primitives.md).

## Rules

- New sections use `Section` (left-aligned header in the 960px `COLUMN`), `Card`, `BlurIn`. Don't center headers (the CTA row under the demo and the footer are centred by design).
- Don't give a section its own background color; only the two inset panels differ.
- Numbers on the page must be true of the product.
- Must work at 390px with no horizontal scroll (verified with Playwright in both themes).

## Buttons (rule)

Type: every text role comes from `TYPE` in `landing/type.ts` (Forum display → sans 600 titles → muted 15px body → tertiary 13px labels); see [`foundations/typography.md`](../foundations/typography.md#landing-type-system).

The landing uses exactly two button components from [`cosmic-button.tsx`](../../src/components/ui/cosmic-button.tsx): `CosmicButton` for the one primary action in view, `SolidButton` (foreground fill) for secondaries. Both come in `sm` (nav) and `md` (50px, 15px radius). Don't hand-roll button classes in landing sections.

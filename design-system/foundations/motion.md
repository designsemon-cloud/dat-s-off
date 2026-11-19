# Foundations → Motion

Motion reveals content as it arrives and makes scroll feel physical. It never loops for decoration; the only landing loops are demo mocks that show what a feature does (see "Looping mocks"). The vocabulary is borrowed from the IdeaApe site: blur-in reveals, scroll-scrubbed text, drawn lines, count-ups and a smooth scroll.

## Smooth scroll (landing only)

[`Landing.tsx`](../../src/components/uxcc/Landing.tsx) runs [Lenis](https://github.com/darkroomengineering/lenis) (`lenis@1.3.4`, `anchors: { offset: -88 }` so anchor links clear the nav), driven from GSAP's ticker (`autoRaf: false`, `gsap.ticker.add(t => lenis.raf(t * 1000))`, `lagSmoothing(0)`, and `lenis.on("scroll", ScrollTrigger.update)`) so the smooth scroll and the GSAP scroll effects read the same frame and imports `lenis/dist/lenis.css`. It is created on mount, destroyed on unmount, and **skipped when the user prefers reduced motion**. The `/app` shell scrolls natively; don't add Lenis there (inner scroll panes and chat auto-scroll fight it).

## Scroll-triggered reveals (framer-motion)

All live in [`landing/primitives.tsx`](../../src/components/landing/primitives.tsx); reuse them instead of hand-writing `whileInView`.

| Primitive             | Motion                                                                                                                  | Timing                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `BlurIn`              | `opacity 0→1`, `y 16→0`, `blur(8px)→0`                                                                                  | 0.7s, ease `[0.22, 1, 0.36, 1]`, once, 30% visible; stagger siblings by `0.07–0.1s` |
| `Eyebrow` rule        | `scaleX 0→1` from the left                                                                                              | 1s, same ease, 0.1s delay                                                           |
| `ScrubText`           | each character `opacity 0.18→1`, driven by scroll progress (`start 85%` → `end 45%`), `[[accent]]` spans fill to orange | scroll-linked, no duration                                                          |
| `CountUp`             | integer 0 → value                                                                                                       | 1.4s `easeOut`, once, 60% visible                                                   |
| Hero words            | per word `y 14→0`, blur 8→0                                                                                             | 0.6s, 0.08s stagger, on load                                                        |
| Hero scene            | (shipyard) sharpens from blur 14px on load; blurs to 10px, sinks 120px, fades to 35% as the hero scrolls out            | load 1.4s, then scroll-linked                                                       |
| CTA scene             | two halves slide in ±90px → 0 and sharpen 12px → 0                                                                      | scroll-linked (`start end` → `center center`)                                       |
| Footer wordmark sheen | sheen layer `background-position` 100% → 45%                                                                            | scroll-linked (`start end` → `end end`)                                             |

## Scroll-scrubbed depth (GSAP)

[`landing/scroll-fx.ts`](../../src/components/landing/scroll-fx.ts) (`gsap@3.15`, ScrollTrigger) adds depth and direction on top of the framer reveals (Nov 2026). Each effect targets its **own wrapper**, marked `data-fx`, never an element framer already animates, or the two fight over `transform`. All are scrubbed to scroll, run only under `prefers-reduced-motion: no-preference` (`gsap.matchMedia`), and re-measure when the page changes height (a `ResizeObserver` calls `ScrollTrigger.refresh()`).

| `data-fx` | Where                                                                | Motion                                                                                                                                                                                    | Range                                           |
| --------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `drift`   | Every `Section` header (eyebrow, title, lede)                        | `y 18→-18`: the header lags the content                                                                                                                                                   | `top bottom` → `bottom top`                     |
| `wave`    | "Fix prompts written for" tiles                                      | `y 44→0`, staggered 0.12, so they settle in a wave                                                                                                                                        | `top bottom` → `top 62%`, scrub 0.8             |
| `tilt`    | Product demo                                                         | `rotateX 12°→0`, `scale 0.92→1`, `y 36→0` from the bottom edge (perspective 1800): it rises off the table and lays flat                                                                   | `top 98%` → `top 30%`, scrub 0.8                |
| `row-in`  | Learn rows                                                           | `x ±72→0`, from the side each row then drifts to (Watch from the right, Read from the left)                                                                                               | `top bottom` → `top 55%`, scrub 0.8             |
| `card`    | Every landing `Card` (set by the primitive itself)                   | `y 64→0`, `scale 0.97→1` from the bottom edge. Each card measures its column in its grid (0 left … 1 right) and starts 8% of the viewport later per full column, so a row lands as a wave | `top 100%−8%·col` → `top 66%−8%·col`, scrub 0.9 |
| `float`   | The mock inside a card (`MockFrame`, the "Why it's different" wells) | `y 10→-10`: the mock drifts against its card (inner parallax), clipped by the frame                                                                                                       | `top bottom` → `bottom top`, scrub              |

The nav's page-progress hairline was removed (Nov 2026): it read as a tab underline. Don't bring it back.

Sections an `x` effect touches clip x-overflow (`overflow-x-clip`) so nothing makes the page scroll sideways. Don't add effects that loop or move on their own; GSAP here only follows the scroll.

**Rule:** anything hidden by a transform or clip inside an `overflow-hidden` box never intersects, so `whileInView` won't fire. Drive it from `useInView` on the visible container (see `HowItWorks.tsx`).

**Dashed strokes:** framer's `pathLength` overwrites `stroke-dasharray`, so a dashed path drawn with `pathLength` comes out solid. Wipe dashed paths in with `clipPath: inset(0 100% 0 0) → inset(0 0 0 0)` or fade them.

## App transitions

| Transition     | Duration                                                | Where                                       |
| -------------- | ------------------------------------------------------- | ------------------------------------------- |
| Fade, `y 6→0`  | 0.2s                                                    | Messages, cards entering                    |
| Modal backdrop | 0.15s fade                                              | All modals, identical                       |
| Modal card     | 0.2s `easeOut`, scale 0.96→1, y 8→0                     | All modals, identical                       |
| Accordion      | 0.25s height + opacity; FAQ's bare `+` rotates 45° to × | FAQ, `FixCard`                              |
| Tab fill       | `layoutId` spring 500 / 35–38                           | `PillTabs`, results tabs, segmented control |

## CSS keyframes (continuous)

Only for things that genuinely run continuously; defined once in `styles.css`.

| Class                | Effect                                                                                                                                                      | Use                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `.animate-scan`      | Vertical beam sweep, 2s                                                                                                                                     | Screenshot being analyzed |
| `.animate-pulse-dot` | Opacity pulse, 1.2s                                                                                                                                         | Active step dot           |
| `.animate-shimmer`   | Light sweep, 2s                                                                                                                                             | Skeletons                 |
| `.animate-float`     | 6px bob, 3s                                                                                                                                                 | "Scroll" hint only        |
| `.cosmic-border`     | Lighter band drifts along the orange ring (`background-position`, 6s linear); no rotation, width constant at rest. Hover grows the ring 2px (0.5s ease-out) | `CosmicButton` ring only  |
| `.catch-radar`       | Ring scales 0.6 → 2.8 and fades, 2.1s                                                                                                                       | Tap-target stage only     |
| `.catch-dash`        | Dashed stroke flows (`stroke-dashoffset`), 0.9s linear                                                                                                      | Flow dead-end stage only  |
| `.why-caption`       | Subtitle fades up from a 3px blur, once                                                                                                                     | Why Dats Off. player      |

## Looping mocks (landing)

`useLoopStep(steps, ms)` in `primitives.tsx` advances a step counter every `ms` **only while its element is at least 50% on screen**, and returns the last step under reduced motion. The mocks in How it works (drop → send, pick an answer, copy → applied) and What it catches (contrast, tap target, hierarchy, copy, states, flow) use it. Rules:

- The last step is the resolved, "fixed" state, so reduced motion shows the answer rather than the problem.
- Each loop is 3–6s and tells one before → after story; no idle wiggles.
- Reset jumps (back to step 0) use `duration: 0` so the restart doesn't animate backwards.

The use-case stage (`UseCaseStage` in `Audience.tsx`) is a before → after wipe: 1.5s on "Before" with the pin pulsing, a 1.1s divider wipe to "After", a 2.4s hold with the fix line lit, then reset. Reduced motion rests the divider at 50%.

Step 03 of How it works (`PromptVisual`) is a 6-step loop at 0.9s: the prompt writes in → "Copied" → one AI tool's logo lifts ("Pasting into Cursor", spinner) → "Applied in Cursor". Each loop moves to the next tool (Cursor, v0, Lovable, Claude, ChatGPT).

The "Why Dats Off." films are scripted on a scene clock instead: `t` (ms) advances on `requestAnimationFrame` only while the player is in view and playing, and every frame is a pure function of `t` (`prog`, ease and `lerp` helpers), so sound cues fire on exact beats. See [`why-dats-off.md`](../organisms/why-dats-off.md).

`ProductDemo` runs its own 15s timeline on a 50ms interval with the same rules: it plays only in view, can be paused, and starts on the final output under reduced motion. See [`product-demo.md`](../organisms/product-demo.md).

## Reduced motion

- `styles.css` disables `.animate-float`, `.animate-scan`, `.animate-shimmer`, `.why-caption`, `.catch-radar`, `.catch-dash` and the `.cosmic-border` drift under `prefers-reduced-motion: reduce` (the border then holds still).
- Lenis is skipped; the engraved scenes render static and sharp, with no load blur, scroll blur, parallax or curtain (`useReducedMotion`).
- Looping mocks hold their final step; the product demo opens paused on the finished critique; the wordmark sheen rests in place.
- Reveal primitives still fade (no large movement), which is acceptable under the guideline.

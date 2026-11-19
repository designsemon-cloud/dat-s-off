# Dats Off. — Design System (v2)

The source of truth for UI decisions in this codebase, for people and for AI agents. v2 replaces the original dark, multi-hue system with a calm, paper-like system **adapted from the IdeaApe `DESIGN.md`**: warm greys carry the hierarchy, one orange carries the emphasis, and a serif display face does the talking.

Light is the source theme. Dark is derived from it: same roles, inverted luminance. Both ship.

## Principles

1. **Greys first, orange last.** Hierarchy comes from size, weight and grey value. Orange is reserved for the one thing on screen that matters most: a primary CTA, a critical finding, the accent phrase in a heading, the eyebrow dot. If two orange things compete on one screen, one of them is wrong.
2. **Serif speaks, sans works.** Headlines and big numbers use the display serif. Everything you read or click uses the system sans.
3. **Paper, not glass.** The page is grey (`bg-background`) with grain; landing cards are textured paper (`.surface-card` + `.bg-grain`: color-9 fill, white hairline edge, `shadow-sm`); the UI mocks inside them are clean white. App cards are plain white. No glass, no backdrop blur, no gradients except the faint glow inside feature mocks and the glossy footer wordmark.
4. **Motion reveals; it never decorates.** Things blur into focus as they arrive, lines draw in, statements fill as you read them. Nothing loops for attention except the landing's primary CTA (the `CosmicButton` border shimmer, by request). The other loops are progress indicators and the small demo mocks inside landing cards, which replay what a step does while they are on screen (`useLoopStep`) and hold still under reduced motion.
5. **Sentence case everywhere.** No all-caps labels, no tracked-out uppercase. Acronyms (UX, CTA, WCAG, PDF) are the only capitals mid-sentence.

## Hard rules

- **No color outside the palette.** Every color in a component is a token from [`foundations/tokens.md`](foundations/tokens.md). No raw hex, no Tailwind palette colors (`text-green-400`, `bg-red-500`), no new hues for severity or status.
- **Radii come from the set:** 12 · 14 · 16 · 24 · full. Spacing is on the 4px grid.
- **Type comes from the scale:** 12 · 14 · 16 · 18 · 24 · 32 · 48, weights 400 / 500 / 600 / 700. See [`foundations/typography.md`](foundations/typography.md).
- **Every interactive element defines every state:** default, hover, focus-visible, active/selected, disabled (and loading where it applies). Focus is always the 2px orange outline from the base layer; never remove it.
- **Both themes, always.** Build with tokens and the dark theme comes for free. Check new UI in both before calling it done.

## Component doc structure (required)

Every component doc written from v2 onward uses these seven sections, in this order:

1. **Overview** — what it is, where it lives, when to use it (and when not to)
2. **Tokens** — the exact tokens and utilities it uses
3. **Anatomy & variants** — parts, and each variant with its use
4. **States & interactions** — every state, plus motion
5. **Accessibility** — roles, labels, keyboard, contrast, reduced motion
6. **Content guidelines** — copy rules for the labels inside it
7. **Anti-patterns** — what not to do, with the reason

Older docs predate this and use freer structures; bring them into the seven sections when you next touch them.

## How to use this

1. **Before building UI**, check whether an atom / molecule / organism / template already covers it.
2. **If something new is needed**, build it from the foundations, then add a `.md` for it in the right folder using the seven-section structure. An undocumented pattern isn't reusable.
3. **If the answer isn't in the code or here, ask.** Open questions live in [`known-issues.md`](known-issues.md).
4. **Keep docs in sync the same day** the code changes.

## Structure (Atomic Design)

```
design-system/
  Design system.md        ← you are here
  foundations/            tokens, type, motion, layout, icons
  atoms/                  smallest reusable primitives
  molecules/              small compositions of atoms
  organisms/              self-contained UI sections
  templates/              page-level compositions
  patterns/               non-visual conventions (state machines, gating)
  known-issues.md         tracked gaps and open decisions
```

### Foundations

- [`tokens.md`](foundations/tokens.md) — the 10-color palette, light + dark mapping, severity, radii, elevation, grain
- [`typography.md`](foundations/typography.md) — display serif + system sans, the scale, weights, recipes
- [`motion.md`](foundations/motion.md) — scroll reveals, scroll-scrubbed text, line draw, count-up, Lenis, keyframes, reduced motion
- [`layout-and-spacing.md`](foundations/layout-and-spacing.md) — 4px grid, page column, card padding, responsive rules
- [`iconography.md`](foundations/iconography.md) — lucide-react sizes and stroke
- [`voice-and-naming.md`](foundations/voice-and-naming.md) — positioning (design review for AI builders), names (review, "What's off", fix prompt), voice

### Atoms

- [`button.md`](atoms/button.md) — `GlowButton` (primary orange / outline white / ghost)
- [`icon-button.md`](atoms/icon-button.md) — circular icon-only button
- [`glass-icon.md`](atoms/glass-icon.md) — clear liquid-glass app-icon tile with a chromatic rim (the "Rate this review" FAB)
- [`copy-button.md`](atoms/copy-button.md) — `CopyButton`: copy icon + label, swaps to check + "Copied"
- [`theme-toggle.md`](atoms/theme-toggle.md) — _new in v2_, light/dark switch
- [`badge-severity.md`](atoms/badge-severity.md) — critical / medium / low chip
- [`section-label.md`](atoms/section-label.md) — sentence-case field-group label
- [`input-textarea.md`](atoms/input-textarea.md)
- [`filter-chip.md`](atoms/filter-chip.md)
- [`segmented-control.md`](atoms/segmented-control.md)
- [`option-dropdown-pill.md`](atoms/option-dropdown-pill.md)
- ~~[`tab-switch.md`](atoms/tab-switch.md)~~ — superseded

### Molecules

- [`landing-primitives.md`](molecules/landing-primitives.md) — _new in v2_: `COLUMN`, `Section`, `Eyebrow`, `BlurIn`, `ScrubText`, `useLoopStep`, `CountUp`, `Card`, `Tile`, `MockFrame`, `PillTabs` (+ `ToolLogos`)
- [`cosmic-button.md`](atoms/cosmic-button.md) — the landing's two buttons: `CosmicButton` (primary, fixed-width orange border with a slow colour shimmer) and `SolidButton` (secondary)
- [`border-beam.md`](atoms/border-beam.md) — the `border-beam` package (cult-ui): the app's "What's off" tile while closed, and `BeamChip` on the landing only
- [`annotated-screenshot.md`](molecules/annotated-screenshot.md) — numbered pins + region box; owns the severity/score maps
- [`analysis-card.md`](molecules/analysis-card.md) — sample / session card
- [`stat-card.md`](molecules/stat-card.md)
- [`filmstrip-thumbnail.md`](molecules/filmstrip-thumbnail.md)
- [`upload-slot.md`](molecules/upload-slot.md)
- [`modal-header.md`](molecules/modal-header.md)

### Organisms

- [`scenery.md`](organisms/scenery.md) — _new in v2_, full-bleed engraved hero and CTA scenes (alpha-mask ink, scroll blur / curtain)
- [`product-demo.md`](organisms/product-demo.md) — the real app (actual components, scaled and inert) looping input → analyzing → output, with video-style chapter controls
- [`why-dats-off.md`](organisms/why-dats-off.md) — "Not another UX critique tool.": ruled list (whole flows, fix → re-check, prompt + why) beside a dark video player of scripted films, with subtitles and opt-in sound cues + voice-over (`lib/sfx.ts`)
- [`what-it-catches.md`](organisms/what-it-catches.md) — six kinds of problem in a 3 × 2 grid, each card a themed stage looping problem → fix, with a status chip and hover spotlight
- [`pricing-panel.md`](organisms/pricing-panel.md) — Free · Pro (Monthly/Yearly toggle) · Credit pack in one textured panel, each plan saying who it's for
- [`footer.md`](organisms/footer.md) — centred logo, link rows, and the full-width glossy "Dats off." wordmark
- [`app-sidebar.md`](organisms/app-sidebar.md), [`app-top-bar.md`](organisms/app-top-bar.md)
- [`chat-pane.md`](organisms/chat-pane.md), [`question-card.md`](organisms/question-card.md)
- [`results-canvas.md`](organisms/results-canvas.md), [`fix-card.md`](organisms/fix-card.md)
- [`prompt-composer.md`](organisms/prompt-composer.md)
- [`modal-shell.md`](organisms/modal-shell.md)
- Superseded, kept for reference: ~~[`mesh-background.md`](organisms/mesh-background.md)~~, ~~[`header.md`](organisms/header.md)~~, ~~[`context-intake.md`](organisms/context-intake.md)~~, ~~[`config-panel.md`](organisms/config-panel.md)~~, ~~[`upload-zone.md`](organisms/upload-zone.md)~~, ~~[`analyzing-state.md`](organisms/analyzing-state.md)~~, ~~[`results-view.md`](organisms/results-view.md)~~, ~~[`use-case-scroller.md`](organisms/use-case-scroller.md)~~

### Templates

- [`landing-template.md`](templates/landing-template.md) — `/`: pill nav, full-bleed engraved hero, narrow-column sections, engraved CTA
- [`app-shell-template.md`](templates/app-shell-template.md) — `/app` sidebar + top bar
- [`session-template.md`](templates/session-template.md) — chat first; the "What's off" document opens beside it on request

### Patterns

- [`session-lifecycle.md`](patterns/session-lifecycle.md)
- [`credit-and-auth-gating.md`](patterns/credit-and-auth-gating.md)
- [`listen.md`](patterns/listen.md) — read the review aloud (free Web Speech API): speaker toggle, floating player (±30s, speed, seek), sentence + word highlighting
- [`fix-prompts.md`](patterns/fix-prompts.md) — the one structured prompt template (task, context, where, steps, don't change, constraints, done when) for any AI tool
- [`recheck-loop.md`](patterns/recheck-loop.md) — Fix → Re-check: each re-check marks the previous issues fixed / partly / open / not visible
- [`input-check.md`](patterns/input-check.md) — before any credit: is the upload an interface, and is a re-check the same product? If not, ask (Upload the updated screen / Compare anyway)
- [`annotation-accuracy.md`](patterns/annotation-accuracy.md) — markers are detected elements, picked and then verified on a close-up; unconfirmed issues say where they are in words
- [`learning.md`](patterns/learning.md) — learn the why: each issue links its principle to a checked article or video (curated catalog, never model URLs); "Keep learning" at the end; landing section
- [`feedback.md`](patterns/feedback.md) — in-app feedback: one-tap rating after a review, expands to a short form; minimise / close and get reminded; stored server-side, read at /admin/feedback
- ~~[`app-state-machine.md`](patterns/app-state-machine.md)~~ — superseded

## Mapping from the IdeaApe DESIGN.md

| IdeaApe            | Dats Off. token                           | Notes                                    |
| ------------------ | ----------------------------------------- | ---------------------------------------- |
| color-1 `#1E2022`  | `--foreground`                            | Primary text, black buttons              |
| color-2 `#5B616E`  | `--muted-foreground`, `--severity-medium` | Body copy, idle controls                 |
| color-3 `#6B7280`  | `--text-tertiary`                         | Captions, metadata                       |
| color-4 `#EA580C`  | `--primary`, `--severity-high`            | The one accent                           |
| color-5 `#FF6C0A`  | `--primary-hover`                         | Accent hover (light); accent base (dark) |
| color-6 `#CFD2D6`  | `--border-strong`, `--severity-low`       |                                          |
| color-7 `#D8DBDF`  | `--border`                                |                                          |
| color-8 `#F3F3F5`  | `--background`, `--bg-elevated`           | Page, hover fills                        |
| color-9 `#F9F9FA`  | `--bg-secondary`                          | Hero panel, sidebar, wells               |
| color-10 `#FFFFFF` | `--bg-tertiary`, `--card`                 | Cards                                    |
| `Forum`            | `--font-display`                          | Google Fonts, single weight 400          |
| system-ui          | `--font-sans`                             |                                          |
| shadow-sm          | `--elevation-sm` → `shadow-sm`            |                                          |

## Provenance

v1 was written from an audit of the codebase on branch `dats-off-flow-analysis`. v2 (this version) re-bases the foundations on the IdeaApe `DESIGN.md` the product owner supplied, plus a study of ideaape.com's live page (layout, scroll behaviour, component styling). Every value here traces to `src/styles.css` or a component file.

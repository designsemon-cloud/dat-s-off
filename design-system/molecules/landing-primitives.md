# Molecule → Landing primitives

## 1. Overview

**File**: [`src/components/landing/primitives.tsx`](../../src/components/landing/primitives.tsx)

The shared building blocks of every landing section, so each section looks and moves the same way. Use them for any new marketing content. They're landing-only: the `/app` shell uses denser components.

| Export                    | What it is                                                                                                                                                                                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `COLUMN`                  | The one page column class: `mx-auto w-full max-w-[960px]`                                                                                                                                                                                                                                                               |
| `Section`                 | Section shell: `Eyebrow` + serif H2 (+ optional accent phrase) + lede, then content, in `COLUMN`                                                                                                                                                                                                                        |
| `Eyebrow`                 | "• Label ————": orange dot, label, a rule that draws in                                                                                                                                                                                                                                                                 |
| `BlurIn` (`Reveal` alias) | Rises out of a soft blur when scrolled into view                                                                                                                                                                                                                                                                        |
| `ScrubText`               | A statement that fills letter by letter as you scroll                                                                                                                                                                                                                                                                   |
| `useLoopStep`             | Hook: a step counter that loops only while its element is on screen; holds the last step under reduced motion                                                                                                                                                                                                           |
| `CountUp`                 | An integer that counts up once in view                                                                                                                                                                                                                                                                                  |
| `GlossText`               | Glossy heading text; the sheen sweeps across as it scrolls into view (`Section` titles use it)                                                                                                                                                                                                                          |
| `IconBadge`               | 36px raised white key on the card paper: `rounded-[10px] border-border bg-bg-tertiary`, top highlight + soft contact shadow (dark: `bg-bg-elevated`, faint highlight), 17px lucide icon in `text-foreground` at stroke 1.6. Neutral by design; the orange gradient version read as busy and broke "one accent per view" |
| `CheckDot`                | Filled orange circle with a white tick, no outline (pricing features)                                                                                                                                                                                                                                                   |
| `ShieldCheck`             | Filled orange shield with a white tick, 16px (hero "5 free critiques" badge)                                                                                                                                                                                                                                            |
| `Card`                    | Textured paper card: 24px radius, grain, hairline edge + top highlight, `shadow-sm`                                                                                                                                                                                                                                     |
| `Tile`                    | Small textured tile (the tools row), lifts 2px on hover                                                                                                                                                                                                                                                                 |
| `MockFrame`               | The clean white UI-mock panel inside a card, with a faint accent glow                                                                                                                                                                                                                                                   |
| `PillTabs`                | Pill tab track; the selected tab is filled with the text color                                                                                                                                                                                                                                                          |

## 2. Tokens

- Column: `COLUMN` = `max-w-[960px]` for every section (no wide variant); section padding `px-4 sm:px-6 py-16 sm:py-24`; `Section` takes `accent="learn"` for a violet eyebrow dot (Learn only).
- H2: `font-display` (Forum) 34/44px wrapped in `GlossText`; lede 16/18px `text-muted-foreground`, `max-w-[560px]`.
- Eyebrow: dot `bg-primary` 6px; label 14px `text-foreground`; rule `h-px bg-border-strong`.
- `Card`: `bg-grain surface-card rounded-3xl`. `Tile`: `bg-grain surface-card rounded-2xl`.
- `MockFrame`: `rounded-2xl border-border bg-bg-tertiary shadow-sm`, glow `radial-gradient(… var(--mock-glow) …)`. White mock on a paper card is the IdeaApe pairing.
- `PillTabs`: track `rounded-lg border-border bg-bg-tertiary p-1 shadow-sm`; tab `h-8 rounded-md px-3.5 text-[14px] font-medium`; selected fill `bg-foreground`, text `text-background`.
- `ScrubText`: unfilled characters at 18% opacity; `[[…]]` segments fill to `text-primary`.

## 3. Anatomy & variants

- `Section`: props `id`, `eyebrow`, `title` (ReactNode; wrap the second clause in `text-primary`), `lede?`, `children?`, `className?`.
- `ScrubText`: `text` string; mark the accent with `[[` and `]]`. Words never break mid-word.
- `CountUp`: `to`, `className`. Pair with a serif 48px number and a 14px label.
- Card layouts: two up (`md:grid-cols-2 gap-4`), with a full-width third (`md:col-span-2`) when one card needs a wider mock.
- Feature-card recipe (How it works, What it catches): `Card p-2` → `MockFrame` full width (inset 8px, `rounded-2xl` = 24 − 8) → text block `px-4 pt-4/5 pb-4`. The wide third card puts text left and the mock right, same 8px inset.

## 4. States & interactions

| Primitive     | Behaviour                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `BlurIn`      | once, at 30% visibility; 0.7s; stagger siblings 0.07–0.1s                                                  |
| `Eyebrow`     | rule draws in over 1s at 80% visibility                                                                    |
| `ScrubText`   | scroll-linked from `start 85%` to `end 45%`; reverses if you scroll back up                                |
| `CountUp`     | once, at 60% visibility, 1.4s                                                                              |
| `useLoopStep` | `const { ref, step } = useLoopStep(5, 800)`; attach `ref` to the mock's visible wrapper; pauses off screen |
| `PillTabs`    | hover: `text-foreground`; selected: fill slides with `layoutId` spring; focus: global outline              |
| `Card`        | static; add hover lift only where the card is a target (persona cards lift 4px)                            |

## 5. Accessibility

- `PillTabs` sets `role="tablist"`, `role="tab"`, `aria-selected`. Arrow-key navigation isn't implemented yet (tracked in known issues); Tab + Enter works.
- `ScrubText` renders the full text in the DOM at all times, so screen readers read it regardless of scroll.
- Faded `ScrubText` characters at 18% fail contrast by design while unread; the sentence reaches full contrast as it enters the reading zone.
- Under reduced motion, reveals still fade but Lenis and big transforms are off (see [`motion.md`](../foundations/motion.md)).

## 6. Content guidelines

- Eyebrow: 1–3 words, sentence case ("How it works", "Under the hood").
- H2: one short sentence or two fragments ("Screenshot in. Fixes out."). No orange accent spans: emphasis comes from the gloss.
- Lede: one or two sentences, under 40 words.
- `ScrubText`: one statement, 30–45 words; accent only the closing payoff.
- Stats: only real, checkable numbers (the 12 / 8 / 3 / 1 in `Engine` come from the analysis prompt). No invented social proof.

## 7. Anti-patterns

- Centered section headers: v2 headers are left-aligned in the column.
- Orange for a selected tab: selection uses the foreground fill.
- `ring-*` / `border-*` to highlight a `Card`: `.surface-card` owns `box-shadow`; use `outline outline-1 outline-foreground` (the white inner card in the pricing panel is a separate element, not a highlighted `Card`).
- Writing a new `whileInView` reveal by hand: use `BlurIn` so timings stay consistent.
- `pathLength` on a dashed SVG path: it erases the dashes (see motion doc).
- Fabricated logo rows or testimonials: the tools row shows the real marks of tools the prompts are written for, under "Fix prompts written for", never a "Used by" / "Trusted by" claim.

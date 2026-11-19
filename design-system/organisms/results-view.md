# Organism → Results View

> **Superseded by [`results-canvas.md`](results-canvas.md)** (inside the session template). `ResultsView`/`FlowResultsView` remain on disk but are no longer routed. Export logic moved to `lib/export.ts`.

**Components**: [`ResultsView.tsx`](../../src/components/uxcc/ResultsView.tsx) (single-screen) and [`FlowResultsView.tsx`](../../src/components/uxcc/FlowResultsView.tsx) (flow). The results screen: score/summary sidebar + action bar + list of [`organisms/fix-card.md`](fix-card.md).

## Spec

- Content wrapper: `mx-auto max-w-7xl px-6 py-6`, two-column `grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]`.
- Left column (`lg:sticky lg:top-6`): image/filmstrip → score badge card ([`molecules/stat-card.md`](../molecules/stat-card.md) 2×2 grid inside a summary card) → (flow only) filter panel.
- Right column: action bar (title + issue count on the left, `GlowButton variant="outline"` Export PDF / Copy MD on the right) → the `FixCard` list.
- Export: `jsPDF` for PDF (manual `y`-cursor pagination, `helvetica` font, page-break check at `y > 720`), `navigator.clipboard.writeText` for Markdown — both reuse the exact same field set (`title`, `severity`, `principle`, `problem`, `why`, `solution`, `code`, `language`). Any new field added to a finding type (e.g. `FlowFix`'s `category`/`heuristic`) should be added to **both** export paths together, not just the on-screen `FixCard` — `FlowResultsView`'s PDF/MD export already does this (interpolates `FLOW_ISSUE_CATEGORY_LABELS[fix.category]` and the anchor label into both), keep that discipline for the next field.

## `FlowResultsView`'s structural additions (all new, all documented in their own doc)

- A [`molecules/filmstrip-thumbnail.md`](../molecules/filmstrip-thumbnail.md) strip above the two-column grid, clickable to filter findings to a screen.
- A `flowCoherent === false` banner (`border-severity-high/25 bg-severity-high/10`, `AlertTriangle` icon) — reuses the severity-high tint recipe from `atoms/badge-severity.md` at card scale instead of chip scale, rather than inventing a new "warning banner" color treatment.
- A filter panel using [`atoms/filter-chip.md`](../atoms/filter-chip.md) for severity + category, inserted below the score card in the same left-column card stack.
- `Stat`'s `Goal Achieved` value branches its `tone` three ways (`yes`/`no`/`unclear`) — the first place in the app a stat's tone is data-driven rather than fixed per-label; any future three-state (or more) semantic value should follow this same "map the value to a tone, not the label" approach rather than hardcoding tone per field.

## Wins section and consolidated prompt card (`ResultsView` only)

- **"What You Got Right"**: sits above "Recommended Fixes", with the same uppercase section heading and count readout. Each win card uses the `FixCard` container (`rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur`) plus a green left accent, `border-l-2 border-l-green-500/60`. Use `border-l-green-*`, not `border-green-*`, which would turn the whole border green. The card shows the title (`text-base font-semibold text-foreground`), the principle as a neutral badge (the same recipe as `FixCard`'s flow category chip), and the explanation (`text-sm text-muted-foreground`). The green is a raw Tailwind palette color rather than the `severity-low` token, as requested; switch to `border-l-severity-low/60` if this should follow the token rule.
- **"Fix Everything at Once"**: below all fix cards, in the same container. It has a heading, a "Copy Prompt" `GlowButton` with the same copied-state recipe, and a read-only `textarea` styled like `FixCard`'s code block (`bg-[oklch(0.08_0.01_280)]`, `font-mono text-[12.5px]`, `rounded-lg`).
- Both only render when their data is present, using `result.wins ?? []` and `result.consolidatedFixPrompt?.trim()`. Saved recent analyses and unvalidated model output can be missing these fields even though the type marks them as required.
- `FlowResultsView` doesn't have either section; flow results have no wins or consolidated prompt.

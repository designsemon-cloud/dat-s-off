# Molecule → Analysis Card

> **Now also `SessionCard`** ([`SessionCard.tsx`](../../src/components/uxcc/SessionCard.tsx)): same anatomy (16:9 top image, text below) used by the Library, Samples, and New-critique screens, plus a score dot, mode/issue/time meta line, and a hover delete button. `SampleAnalysis.tsx` is no longer rendered.

**Status: new molecule** (the existing card markup was undocumented until now). Component: the private `AnalysisCard` function inside [`SampleAnalysis.tsx`](../../src/components/uxcc/SampleAnalysis.tsx) — shared by both of that component's modes (hardcoded "Sample Analysis" pair, and the real "Recent Analysis" list once a signed-in user has history).

## Spec

```tsx
<button className="group flex flex-col overflow-hidden rounded-xl border border-border bg-bg-tertiary text-left transition-all hover:border-border-strong hover:bg-bg-elevated/70 ...">
  <div className="aspect-[16/9] w-full shrink-0 overflow-hidden border-b border-border/50 bg-bg-secondary">
    <img className="h-full w-full object-cover object-top" />
  </div>
  <div className="flex flex-1 flex-col gap-2 p-3.5">
    {/* title, subtitle, up to 2 issue bullets, keyword pills, "View analysis" link */}
  </div>
</button>
```

- **Image always on top, fixed `aspect-[16/9]`.** This replaced a side-by-side layout (a 36%-width image column to the left of the text content) where the image's own aspect ratio drove the card's shape — a near-square source image (e.g. the Amazon sample, ~1:1) and a wide one (the Salesforce sample, ~16:9 natively) produced visibly different card proportions sitting next to each other in the same grid. Forcing every card's image into the same horizontal frame (`object-cover object-top`) makes the two-column grid read as one consistent set regardless of what the source screenshot's native ratio is.
- `rounded-xl` (16px) on the outer card, matching this doc's cards generally — the image's top corners inherit this via the card's own `overflow-hidden`, not a separate radius on the `<img>`.
- Content block below: title (`text-[13px] font-semibold`), subtitle (`text-tertiary`), up to 2 issue bullets (`muted-foreground`, each with a small primary-tinted dot), keyword pills (bordered, `text-tertiary`), and a "View analysis" link (`text-primary`) pinned to the bottom via `mt-auto`.

## Rules

- Don't reintroduce the side-by-side image+content layout — the whole point of this card is a uniform frame across heterogeneous source images, which only works with a fixed-ratio top image.
- If a future card needs a _taller_ image (e.g. a mobile-screen sample where `16:9` would crop too aggressively), that's a real new variant — ask before changing the shared `aspect-[16/9]`, since both existing call sites (sample + recent) depend on the grid reading as one consistent set.
- `object-top` (not `object-center`) — screenshots are most informative at their top edge (nav/header), so cropping keeps that rather than centering on arbitrary page content.

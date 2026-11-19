# Organism → Mesh Background

> **No longer used.** The landing uses a fixed `GradientWaves` background and the app uses plain `bg-background`. `MeshBackground.tsx` remains on disk.

**Component**: [`MeshBackground.tsx`](../../src/components/uxcc/MeshBackground.tsx). Fixed, full-viewport ambient background sitting behind every screen state — a lazy-loaded WebGL particle layer (`PixelBlast`) plus a radial vignette.

## Spec

- Rendered once per screen-level component (`Landing`, `AnalyzingState`'s/`FlowAnalyzingState`'s wrapper, `ResultsView`'s/`FlowResultsView`'s wrapper) at the top of the tree: `<MeshBackground />` as the first child inside `<div className="relative min-h-screen ...">`.
- `PixelBlast` is lazy-loaded and gated behind a `mounted` state flip in a `useEffect` — this is **required**, not optional styling: it avoids an SSR/hydration mismatch for a WebGL canvas. Any future full-screen canvas/WebGL layer should copy this exact `lazy()` + `Suspense` + post-mount-flag pattern.
- Color (`#F97316`) is the one place in the codebase a raw hex appears instead of an oklch token — this is because `PixelBlast` is a third-party-style prop, not a Tailwind class; it should still visually match `--primary` (`oklch(0.70 0.20 45)` ≈ `#F97316`) if the primary token ever changes, update this prop too.
- The vignette (`bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0.14_0.02_250/0.7)_85%)]`) sits above the WebGL layer to focus attention toward the center of the viewport — keep this on any new full-bleed background treatment.

## Rules

- Always `pointer-events-none`, `fixed inset-0`, `-z-10` — it must never intercept clicks or scroll.
- Don't duplicate `MeshBackground` per nested component — it's mounted once per top-level screen state in `src/routes/index.tsx`, not per sub-component.

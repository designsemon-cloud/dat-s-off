# Molecule → Filmstrip Thumbnail

**Status: new molecule, introduced by Flow Analysis.** Component: [`FlowFilmstrip.tsx`](../../src/components/uxcc/FlowFilmstrip.tsx). A horizontally-scrolling row of selectable screen thumbnails — no prior "select one of a horizontal row of images" pattern existed in the codebase (the closest relative, `SampleAnalysis`'s card grid, is a 2-column grid of clickable cards, not a scroll-strip of thumbnails, and isn't a _selectable/active-state_ control).

## Spec

```tsx
<button
  className={cn(
    "group relative flex shrink-0 flex-col overflow-hidden rounded-xl border bg-bg-tertiary transition-colors",
    active ? "border-primary shadow-glow" : "border-border hover:border-border-strong",
  )}
  style={{ width: 128 }}
>
  <div className="h-20 w-full overflow-hidden bg-bg-secondary">
    <img className="h-full w-full object-cover object-top" />
  </div>
  <div className="flex items-center justify-between px-2 py-1.5">
    <span className="text-[11px] font-medium text-foreground">Screen {n}</span>
    {score !== undefined && (
      <span className="text-[10px] font-mono text-text-tertiary">{score}</span>
    )}
  </div>
</button>
```

## Rules

- Active/selected state = `border-primary` + `.shadow-glow` — this is the app's general "this is the selected one" idiom (compare to `ConfigPanel`'s selected stack/device button, which uses `border-border-strong` + `bg-bg-elevated` instead — filmstrip selection deliberately uses the _stronger_, glow-based signal because the thumbnail itself is small and needs a more visible cue than a background swap would give at that size).
- Image crop is always `object-cover object-top` — screenshots are cropped from the top down, never centered, so the most information-dense part of a UI screenshot (usually the top nav/header) stays visible in a short thumbnail. This matches `UploadZone`'s and `SampleAnalysis`'s existing image treatment — don't switch to `object-center` for a new thumbnail context.
- Fixed width (`128px` / `w-20` height for the image), not responsive — filmstrips scroll horizontally (`overflow-x-auto` on the parent) rather than wrap or shrink, by design.
- The score readout uses `font-mono` — the one place outside a code block that monospace appears, because it's a number that benefits from tabular alignment as the user scans across several thumbnails.

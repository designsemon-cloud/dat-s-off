# Atom → Filter Chip

**Status: new atom, introduced by Flow Analysis.** No prior toggleable-chip pattern existed in the codebase before this feature (the closest relative, [`atoms/badge-severity.md`](badge-severity.md), is read-only/non-interactive). Documented here per the rule that any genuinely new pattern gets written down before reuse. Any future toggle/filter UI should reuse this spec rather than re-deriving it.

**Component**: inline `FilterChip` inside [`FlowResultsView.tsx`](../../src/components/uxcc/FlowResultsView.tsx) — small enough that it isn't (yet) worth extracting to its own file, but the spec below is the contract if/when it is extracted or reused elsewhere.

## Spec

```tsx
<button
  className={cn(
    "rounded-md border px-2 py-1 text-[11px] font-medium capitalize transition-colors",
    active
      ? "border-primary/40 bg-primary/10 text-primary"
      : "border-border bg-bg-secondary/60 text-muted-foreground hover:border-border-strong hover:text-foreground",
  )}
>
  {label}
</button>
```

## Rules

- Reuses the same **three-tier opacity idiom** as `SeverityBadge` (tinted background at low opacity, tinted border at a mid opacity, full-opacity text for the active/"on" state) — this is the app's one general-purpose recipe for "semantic-colored chip on a dark surface," now used by two atoms. Any third one should follow it too.
- Inactive state uses the same `bg-bg-secondary/60` / `border-border` / `hover:border-border-strong` recipe as most other idle interactive surfaces in the app (matches `ConfigPanel`'s unselected stack/device buttons) — don't invent a different idle-state treatment for chips.
- Size: `caption` (11px) text, `rounded-md`, `px-2 py-1` — deliberately smaller/denser than `GlowButton`, since chips appear in multi-select rows, not as standalone actions.

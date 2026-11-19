# Molecule → Stat Card

**Component**: `Stat` (local helper in [`ResultsView.tsx`](../../src/components/uxcc/ResultsView.tsx) and duplicated identically in [`FlowResultsView.tsx`](../../src/components/uxcc/FlowResultsView.tsx)). Small 2×2 grid item showing a label + value, used inside the score/summary panel.

## Spec

```tsx
<div className="rounded-lg border border-border bg-bg-secondary/60 p-2.5">
  <div className="text-[12px] font-medium text-text-tertiary">{label}</div>
  <div className={`mt-0.5 text-sm font-semibold capitalize ${tone}`}>{value}</div>
</div>
```

`tone` defaults to `text-foreground`, overridden per-stat for semantic emphasis (e.g. `text-severity-high` for a "Critical" count, or a three-way branch for `FlowAnalysisResult.goalAchieved` — foreground/`text-severity-low` for `"yes"`, red/`text-severity-high` for `"no"`, default for `"unclear"`).

## Rules

- Label is the `caption` type step (12px), sentence case, tertiary — same recipe family as `atoms/section-label.md` but smaller, since this is a data label, not a form-field label.
- Value is Tailwind's own `text-sm font-semibold`, **not** a bracket value — this is the one place the app uses the default Tailwind scale instead of a `text-[Npx]` literal, and that's fine (14px maps to the `body` step anyway).
- Radius is `rounded-lg`, one step down from the card it sits inside (`rounded-2xl`) — nested surfaces should always step the radius down, never repeat the parent's.
- **Currently duplicated verbatim between `ResultsView.tsx` and `FlowResultsView.tsx`.** This is an acceptable, deliberate duplication for now (two small local helpers, no shared import), but if a third results view is ever built, extract it to its own component instead of copying a third time.

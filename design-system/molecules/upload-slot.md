# Molecule → Upload Slot (numbered, reorderable)

**Status: new molecule, introduced by Flow Analysis.** Component: [`FlowUploadZone.tsx`](../../src/components/uxcc/FlowUploadZone.tsx). A single row representing one uploaded screen in an ordered list — numbered badge, thumbnail, filename, reorder/remove controls. The prior [`organisms/upload-zone.md`](../organisms/upload-zone.md) pattern only ever handled a single file with no ordering; this is the multi-file extension of it.

## Spec

```tsx
<div className="flex items-center gap-3 rounded-xl border border-border-strong bg-bg-tertiary p-2.5">
  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-bg-elevated text-[12px] font-semibold text-foreground">
    {index + 1}
  </span>
  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-bg-secondary">
    <img className="h-full w-full object-cover object-top" />
  </div>
  <div className="min-w-0 flex-1 flex items-center gap-1.5 text-sm text-muted-foreground">
    <ImageIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
    <span className="truncate">{name}</span>
  </div>
  <div className="flex shrink-0 items-center gap-1">
    {/* up / down / remove — each an icon-only button, icon-control size (h-4 w-4), h-7 w-7 hit target */}
  </div>
</div>
```

## Rules

- Reuses `border-border-strong` (not the default `border-border`) at rest — a deliberate escalation from `UploadZone`'s filled state (which also uses `border-border-strong`), since a filled upload slot is a "committed" surface, not an idle one.
- The ordinal badge (`h-7 w-7`, `rounded-lg`, `bg-bg-elevated`) is this molecule's one genuinely new visual element — no prior "numbered badge" existed. If a third numbered-list UI is ever built, reuse this exact badge spec rather than inventing another.
- Reorder is via up/down icon buttons, deliberately **not drag-and-drop** — there is no drag-and-drop library in this project's dependencies, and adding one for a list that tops out at 8 items isn't worth the dependency. If a future list needs to scale past a couple dozen items, that trade-off should be revisited (ask before adding a DnD library).
- Icon buttons in the control cluster: `h-7 w-7` hit target (matches the ordinal badge size, keeping the row's right edge visually aligned with its left edge), `h-4 w-4` icon (`icon-control`), `disabled:opacity-30` for the boundary case (can't move the first item up / last item down).

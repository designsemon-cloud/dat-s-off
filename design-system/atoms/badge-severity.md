# Atom → Severity Badge

**Defined inline** in [`FixCard.tsx`](../../src/components/uxcc/FixCard.tsx) as `SEVERITY_META` — not (yet) its own exported component, but a fixed enough shape that any new severity-colored badge should copy this exact spec rather than invent a new one. (The shadcn `badge.tsx` primitive is unused and has no severity variant — see `known-issues.md`.)

## Spec

```tsx
const SEVERITY_META: Record<Severity, {...}> = {
  high:   { label: "Critical", color: "text-severity-high",   bg: "bg-severity-high/10",   border: "border-severity-high/25",   icon: AlertCircle },
  medium: { label: "Medium",   color: "text-severity-medium", bg: "bg-severity-medium/10", border: "border-severity-medium/25", icon: AlertTriangle },
  low:    { label: "Low",      color: "text-severity-low",    bg: "bg-severity-low/10",     border: "border-severity-low/25",    icon: Info },
};
```

Markup:

```tsx
<span
  className={cn(
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium",
    sev.bg,
    sev.border,
    sev.color,
  )}
>
  <Icon className="h-3 w-3" />
  {sev.label}
</span>
```

## Rules

- Background is always the token **at 10% opacity** (`/10`), border at **25% opacity** (`/25`), text at full opacity — this three-tier opacity pattern is the standard way this app tints a semantic color onto a dark surface. Reuse it for any new semantic-colored chip (see [`atoms/filter-chip.md`](filter-chip.md) for a non-severity variant of the same idea).
- Text size is `caption` (11px, see `foundations/typography.md`), radius `rounded-md`.
- Icon is `h-3 w-3` here specifically (smaller than the general `icon-inline` 3.5 — badges are dense, this is the one place a sub-3.5 icon carries real meaning rather than being purely decorative).

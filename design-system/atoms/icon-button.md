# Atom → Icon Button (circular)

**Status: new atom**, introduced by the composer's icon-footer redesign (attach / voice / send). Every prior button in this app is `GlowButton` — a rectangular, `12px`-radius, icon+label pill (`atoms/button.md`). This is the first **icon-only, fully circular** button in the codebase, needed specifically for a dense chat-composer-style footer where a labeled button would be too wide for three controls to sit comfortably in one row.

**This does not replace `GlowButton`.** `GlowButton` is still the only button for any labeled action anywhere else in the app (forms, modals, results-view actions, etc.). Reach for this circular variant only in the same narrow context it was built for: a compact row of 2-3 icon-only actions where a label isn't needed because the icon alone is unambiguous (a `+` for attach, a mic for voice, an arrow for send) — not as a general icon-button replacement.

## Spec

Neutral (attach, voice):

```tsx
<button
  aria-label="..."
  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-bg-secondary text-muted-foreground transition-colors hover:border-border-strong hover:bg-bg-elevated hover:text-foreground"
>
  <Icon className="h-4 w-4" />
</button>
```

Idle color is `text-muted-foreground`, not `text-text-tertiary` (changed from the original build — see `foundations/tokens.md`'s "muted-foreground vs. text-tertiary" rule). Any control with a hover state uses `muted-foreground` for its resting state; `text-tertiary` is reserved for non-interactive captions/metadata.

Primary (the one commit action — e.g. send/submit):

```tsx
<button
  aria-label="..."
  disabled={!canSubmit}
  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-glow disabled:opacity-50 disabled:cursor-not-allowed"
>
  <Icon className="h-4 w-4" strokeWidth={2.5} />
</button>
```

## Rules

- **`rounded-full`, not the `12px` literal radius `GlowButton` uses.** This is a deliberate, isolated exception for round icon-only controls — don't let it creep into labeled buttons, and don't give `GlowButton` a circular variant without a real reason; the two button shapes should stay visually distinct (pill-with-label vs. circle-icon-only), not blend into a single ambiguous system.
- Size is fixed at `h-9 w-9` (36px) with a `h-4 w-4` (`icon-control`) icon inside — don't introduce a second size without a real second context that needs it.
- The neutral variant reuses the exact idle-state recipe already used for the attach button pre-redesign (`border-border bg-bg-secondary text-text-tertiary`, hover to `border-border-strong bg-bg-elevated text-foreground`) — same idiom as every other idle interactive surface in the app, just circular.
- The primary variant's `disabled:opacity-50` matches `GlowButton`'s own disabled treatment exactly (`atoms/button.md`) — kept identical on purpose so "disabled" reads the same way regardless of which button shape it's on.
- `aria-label` is required on every instance (icon-only buttons have no visible text for assistive tech otherwise) — this one is not optional the way it might be on a labeled `GlowButton`.

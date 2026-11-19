# Atom → Button

**Component**: [`GlowButton`](../../src/components/uxcc/GlowButton.tsx)

This is the **only** button component in the app. The shadcn primitive at `src/components/ui/button.tsx` exists on disk but is **dead scaffolding** — zero real call sites, only referenced internally by other unused shadcn files (`sidebar.tsx`, `calendar.tsx`, `carousel.tsx`, `pagination.tsx`, `alert-dialog.tsx`). **Never import `@/components/ui/button`.** Always use `GlowButton`.

## API

```tsx
<GlowButton
  variant="primary" | "outline" | "ghost"
  size="sm" | "md" | "lg"
  active={boolean}  // optional — see "Toggle/active state" below
  onClick={...}
>
  <Icon className="h-3.5 w-3.5" /> Label
</GlowButton>
```

Extends native `<button>` props (so `disabled`, `type`, etc. all pass through).

**`GlowButton` is also the base every other compact pill-shaped control is built from** — not just the single-action button. [`atoms/segmented-control.md`](segmented-control.md)'s segments are `variant="ghost"` with `active`, and [`atoms/option-dropdown-pill.md`](option-dropdown-pill.md)'s trigger is `variant="outline"` with `active`. This is deliberate: one component, a few variants, so the radius and hover/pressed treatment can never drift between "a button," "a toggle segment," and "a dropdown trigger" the way they did when each was hand-rolled separately — see `organisms/prompt-composer.md`'s revision history for the drift this fixed.

## Variants

| Variant             | Look                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Use for                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `primary` (default) | **The cosmic button** ([`cosmic-button.md`](cosmic-button.md)): a raised neutral surface (`bg-bg-tertiary text-foreground`, inset highlight and soft shadow) inside a 2px orange ring whose colour slowly drifts. On hover the ring grows 2px and brightens. The outer box is `rounded-[12px] p-[2px]` and the inner is `h-7` (`lg`: `h-8`), so the total height matches outline and ghost (32px / 36px). `disabled:opacity-50`, no hover. Built from the shared `COSMIC_RING` / `COSMIC_SURFACE` / `COSMIC_FOCUS`. One per area. There are no orange-filled buttons. | The one dominant action per screen ("Analyze UX", "Analyze Flow", "Sign in") |
| `outline`           | White `border border-border bg-bg-tertiary shadow-sm`, `hover:border-border-strong hover:bg-bg-elevated`                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Secondary actions alongside a primary one ("Export PDF", "Copy MD")          |
| `ghost`             | No border/background, text-only with hover background                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Lowest-emphasis actions                                                      |

## Sizes

`sm`/`md` are visually identical (`h-8 px-3 text-[13px]`) — `md` is the default, `sm` exists for call sites that want to be explicit. `lg` is `h-9 px-4 text-sm`, reserved for full-width modal CTAs (`w-full justify-center`).

## Toggle/active state

`active` (boolean, default `false`) sticks a variant's "selected" look on permanently instead of only on hover:

- `ghost` + `active`: `bg-bg-elevated text-foreground` (otherwise only on hover) — used for a segmented-control segment that's currently selected.
- `outline` + `active`: `border-border-strong bg-bg-elevated` (otherwise only on hover) — used for a dropdown trigger while its menu is open.

Don't add a third "active" look to `primary`. It's already a single committed visual state (the cosmic ring), so there's no "more selected" version of it. Never reintroduce an orange _fill_ for a primary action.

**One primary per view, on the next action.** Everything else on screen is outline or ghost:

- Chat, your own critique: "Copy fix prompt" (in the beamed "Fix it, then re-check" card). The critique tile's "Open" and "Re-check" are outline.
- Chat, a sample: "Critique yours" in the sample bar. "Copy fix prompt" is outline, and the card has no beam.
- Chat, an input-check question pending: its "Upload the updated screen". The card above steps back (outline, no beam).
- Critique document: "Copy this fix's prompt" only on the first issue not yet fixed (outline on the others); "Re-check" once all are marked fixed.

## Rules

- Radius is **always** the literal `12px` (`style={{ borderRadius: "12px" }}`, baked into the component; v2 moved it from 8px onto the DS radius set, see `foundations/tokens.md`) — this is intentional and matches `Header`'s compact pill buttons, not the `rounded-2xl` card radius. Don't override it via `className`. **This applies to every control built on `GlowButton`, including the toggle and dropdown-trigger variants** — if a compact pill-shaped control anywhere on the page doesn't visually match this radius, that's a bug, not a style choice (this was a real, shipped inconsistency once: the mode toggle briefly used a 16px/6px radius pair while dropdown pills used the button radius, until both were rebuilt on `GlowButton` to guarantee they match).
- Icon + label: icon first, `icon-inline` size (`h-3.5 w-3.5`), `gap-1.5` (built in).
- Never hand-roll a button with inline gradient/shadow styles to get a "glow" effect — that's what `GlowButton`'s `primary` variant + the `.shadow-glow` utility already do. (`BuyCreditsModal.tsx` currently violates this — flagged in `known-issues.md`, not yet fixed.)

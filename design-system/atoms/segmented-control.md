# Atom → Segmented Control

**Status: new atom, introduced by Flow Analysis** (the "Single Screen" / "Flow" mode toggle). No prior tab/segmented-switch pattern existed for the app's own UI — the shadcn `tabs.tsx` primitive exists on disk but is dead scaffolding with zero real usage (`AuthModal`'s own sign-in/sign-up switcher hand-rolls its own two-button toggle instead of using it, or this control). Documented here so a third instance doesn't diverge from either.

**This control has moved five times** — briefly inside `PromptComposer`'s options row at a smaller size, then to a heavier container-attached "tab" treatment with a decorative scoop (`atoms/tab-switch.md`, superseded), then to a plain bordered-track version detached above the composer, then to a track-less version sitting bare in the icon footer row, and now to its **current form: a tracked container again, but with the active segment's fill flush against the track** (no padding gap, no gap between segments) — explicit feedback each time, most recently "wrap both options in a container like the previous state but dont give gap between the inner selected container and the outer container... like the way context switcher toggle designs." See [`organisms/prompt-composer.md`](../organisms/prompt-composer.md) for the full history.

## Current spec — flush-fill tracked toggle, animated sliding highlight

```tsx
<div
  className="relative inline-flex items-center overflow-hidden border border-border bg-bg-tertiary/40"
  style={{ borderRadius: "12px" }}
>
  {options.map((opt) => (
    <button
      key={opt.value}
      type="button"
      onClick={() => onChange(opt.value)}
      className={cn(
        "relative z-10 h-8 px-3 text-[13px] font-medium transition-colors duration-150",
        value === opt.value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {value === opt.value && (
        <motion.span
          layoutId="mode-toggle-fill"
          className="absolute inset-0 -z-10 bg-bg-elevated"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      {opt.label}
    </button>
  ))}
</div>
```

Key structural points, each a direct answer to the "flush, context-switcher-style" feedback:

- **One shared `layoutId` fill, not two independently-styled buttons.** Only the currently-active segment renders the `motion.span` fill; framer-motion animates it sliding between segments across renders because both share `layoutId="mode-toggle-fill"`. This gives the "sliding highlight" feel of a native iOS-style segmented control instead of an instant color swap.
- **No padding anywhere in the chain** — the outer track has no `p-*`, each segment is exactly `h-8` (matching the track's height), and the fill is `absolute inset-0` within its segment. Because there's no padding, the fill always touches the track's inner edge exactly; `overflow-hidden` + the track's own `borderRadius: 8px` clips the fill's corners automatically at the two end segments, so the fill never needs its own radius value.
- **Zero gap between segments** — they're plain adjacent flex children with no `gap-*` between them. The _only_ border in the whole control is the outer track's — there's no per-segment border, which is what makes the unselected segment read as "unfilled but still part of the same component" (the shared outer border provides that context, not individual borders).
- Unselected segment: `text-muted-foreground`, hover `text-foreground` (no background change on hover — only the active fill carries a background, to keep the "fill = selected" signal unambiguous).

## Rules

- Don't hand-roll a second copy of this markup — if a future control needs this exact tracked/flush/animated pattern, extract it into a small shared component rather than copy-pasting into a third file.
- The track's background (`bg-bg-tertiary/40`) is deliberately faint — it's there so the unselected area still reads as "inside the control" against the composer's own background, not to compete with the active fill (`bg-bg-elevated`, matching `GlowButton`'s own active/hover tone for consistency).
- Radius: literal `style={{ borderRadius: "12px" }}` on the outer track only (matches every other compact control's radius — see `foundations/tokens.md`); the fill has no radius of its own, relying on the track's `overflow-hidden` clip.
- Text size: 13px — matches every other compact pill on the page.
- **Compare to `AuthModal`'s existing sign-in/sign-up switcher**: that control predates this spec and uses its own slightly different radii, no flush fill, no shared `layoutId` animation (see `known-issues.md`). Don't copy `AuthModal`'s version — if it's ever touched again, migrate it to this spec instead.

## Why this isn't built on `GlowButton` anymore

The track-less version (previous iteration) was built on bare `GlowButton` segments specifically so the radius/hover treatment couldn't drift from other compact controls. This version trades that for the flush-fill + shared-`layoutId`-slide requirements, which `GlowButton` doesn't support (it has no concept of an absolutely-positioned animated background shared across sibling instances). The radius value itself (`8px`) and the "active = filled, idle = muted-foreground" color logic are still kept identical to `GlowButton`'s own active/idle treatment by hand, so it stays visually consistent even though it's no longer literally the same component. If `GlowButton` grows support for a shared sliding-fill variant, migrate this back onto it.

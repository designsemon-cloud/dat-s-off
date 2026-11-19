# Atom → Tab Switch (container-attached)

> **Superseded, reverted after one iteration.** This pattern (and its bridge-arch "scoop" hand-off into the composer below) was built, shipped, then explicitly rolled back by the product in the very next round of feedback — "remove the design of Single screen and flow, make it simple toggle and separate with command box container." The mode switch is back to the plain [`atoms/segmented-control.md`](segmented-control.md), now positioned _above and detached from_ the composer rather than attached to it. This doc is kept (not deleted) as a record of what was tried and explicitly undone — if a future request asks for an "attached tab" look again, this spec is the starting point, but don't reach for it speculatively.

**Status when built**: replaced the compact `segmented-control` variant as the mode switch inside [`organisms/prompt-composer.md`](../organisms/prompt-composer.md). Built from a specific visual reference the product wanted: tabs that read as physically attached to the top edge of the composer (like a browser/folder tab), not a floating pill-in-track control sitting inside the card.

This is a deliberate, more visually assertive pattern than `atoms/segmented-control.md` — it uses a **solid `bg-primary` fill for the active state**, which elsewhere in the app is reserved for the one dominant call-to-action (`GlowButton`'s primary variant). That's an intentional exception here, not a precedent to reach for casually: it exists because the mode choice needed to read as the most prominent, first-decision element on the page (per an explicit visual reference), not because solid-primary is now available for any active/selected state. Default to `segmented-control.md` for other toggles; only reach for this pattern when a control genuinely needs to command that much attention.

## Spec

```tsx
<div className="relative inline-flex">
  <div className="flex">
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          onClick={() => onChange(opt.value)}
          style={{ borderRadius: "20px 20px 0 0" }}
          className={cn(
            "px-5 py-2.5 text-[13px] font-semibold transition-colors duration-150",
            active
              ? "bg-primary text-primary-foreground"
              : "bg-bg-elevated text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
  {/* Scoop — see below */}
  <div
    aria-hidden
    className="pointer-events-none absolute h-3.5 w-3.5"
    style={{
      left: "100%",
      top: "100%",
      background: `radial-gradient(circle at top left, ${lastTabBg} 14px, var(--bg-tertiary) 14px)`,
    }}
  />
</div>;
{
  /* container the tabs sit on, immediately below, no gap: */
}
<div className="rounded-b-2xl rounded-tr-2xl border ...">...</div>;
```

## Rules

- **Radius is set via inline `style`, never a `rounded-t-*` Tailwind class.** This matches every other button in the app (`atoms/button.md`) and isn't optional here — an earlier draft used `rounded-t-2xl` as a class and, combined with the scoop element nearby, made the corners hard to verify correct at a glance in dev tools; inline `style={{ borderRadius: "20px 20px 0 0" }}` is unambiguous and consistent with how `GlowButton` and every `ConfigPanel` pill already set radius.
- Tabs are top-corners-only rounded (20px, the `2xl` radius step — chosen for a more pronounced, "poppier" curve than `segmented-control.md`'s 16px, matching the visual reference this pattern was built from), flush against the container below with no gap, so they read as growing out of it.
- The container itself drops its own top-left radius (`rounded-tr-2xl rounded-b-2xl`, no `rounded-tl`) since the leftmost tab occupies that corner visually — don't round both the tabs' and the container's corners in the same spot, that reads as two separate floating shapes rather than one attached unit.
- **The scoop**: a 14px square positioned via `left: 100%; top: 100%` relative to a `relative inline-flex` wrapper around the tab row (so it self-positions right after the last tab, at the tab-row/container seam, with no manual pixel math). Its background is a two-color radial gradient with a hard stop at 14px: the color of whichever tab is currently rightmost-and-relevant fills the corner nearest the tab (creating a convex bulge that reads as the tab's rounded edge continuing slightly further), and `var(--bg-tertiary)` fills the rest (blending into the container). This is what turns the tab-row-to-container transition from a hard step into one continuous wave — the same visual idea as the bridge-arch reference this was built from. **`lastTabBg` must be computed dynamically from whichever tab is actually last and its active state** (`var(--primary)` if that tab is active, `var(--bg-elevated)` if not) — a hardcoded color here will visibly mismatch as soon as the active tab changes.
- Only two states, active/idle — no third "disabled" tab state exists yet; if one is needed, ask before improvising a treatment for it.
- Font weight is `font-semibold` here (heavier than `segmented-control.md`'s `font-medium`) — the bolder weight plus the solid fill is what makes the active tab read as a clear, committed choice rather than a soft toggle.
- Text stays at `body-sm` (13px), matching the segmented control it replaces here.

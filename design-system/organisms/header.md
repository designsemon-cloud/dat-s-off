# Organism → Header

> **Superseded.** The landing has its own nav ([`templates/landing-template.md`](../templates/landing-template.md)) and the app uses [`app-top-bar.md`](app-top-bar.md) + [`app-sidebar.md`](app-sidebar.md). `Header.tsx` remains on disk, unused. `Logo` is now a router `Link` to `/` (it used to reload the window).

**Component**: [`Header.tsx`](../../src/components/uxcc/Header.tsx). The one persistent chrome element across every screen state (`Landing`, `AnalyzingState`, `FlowAnalyzingState`, `ResultsView`, `FlowResultsView`) — always rendered via the same `sharedHeaderProps` spread from `src/routes/index.tsx`, never re-implemented per screen.

## Spec

- Outer: `px-6 py-4 border-b border-border/40`, inner row `mx-auto max-w-7xl flex items-center justify-between`.
- Left: `Logo`. Right: a `flex items-center gap-3` cluster of, in fixed order: optional "New Analysis" button + `|` divider (only when `showNewAnalysis`) → credits readout (`Wallet` icon + "N credits left", no button chrome, just text) → "Add credits" button → auth state (avatar or "Sign in" button).
- Every button in this row uses the compact pill treatment: `h-8`, `border border-border bg-bg-tertiary/60`, `text-[13px]`, literal `borderRadius: "8px"` — **this is `GlowButton`'s `outline` variant's exact recipe, hand-duplicated here rather than importing the component.** If `Header.tsx` is touched again, prefer swapping these raw `<button>`s for `<GlowButton variant="outline" size="sm">` to remove the duplication — not required today, but don't add a _fourth_ independently-styled button here. (The radius value was bumped from `4px` to `8px` app-wide — see `foundations/tokens.md` — and this hand-duplicated copy was updated along with it precisely because it's a duplicate; this is exactly the kind of upkeep that goes away once it's migrated to `GlowButton`.)

## Rules

- `showNewAnalysis`/`onNewAnalysis` are optional props — only the results screens pass them. Any new results-style screen should follow the same optional-prop convention rather than always rendering the button.
- The credits readout is deliberately not a button (no hover state, no border) — it's a status readout, `GlowButton`/pill styling is reserved for things you can click.
- Avatar: `h-8 w-8 rounded-full`, either the user's real picture (`ring-1 ring-border`) or a `bg-primary` circle with 2-letter initials (`text-[11px] font-bold text-primary-foreground`) — this initials-fallback pattern is the standard for any future avatar, not just `Header`'s.

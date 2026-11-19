# Known Issues & Gaps

Findings from the initial full-codebase design audit (pre-dating Flow Analysis). These are **documented, not silently fixed** — several touch pre-existing files outside this feature's scope, and per the design-system rules, anything not clearly in-scope gets flagged for a decision rather than changed unprompted. Treat this file as a backlog, not a changelog.

## Superseded (not dead — kept on purpose, not deleted)

The landing-page consolidation into [`organisms/prompt-composer.md`](organisms/prompt-composer.md) replaced `UploadZone.tsx`, `FlowUploadZone.tsx`, `ConfigPanel.tsx`, and `FlowConfigPanel.tsx` as what `Landing.tsx` actually renders. Unlike the shadcn scaffolding below, **these four files are not unreferenced accidents** — they're recently-built, working, documented components that a deliberate product decision moved away from. They were deliberately left in place (not deleted) pending an explicit decision, same as the shadcn scaffolding question below — if you want them gone, say so and they'll be removed along with their now-superseded doc pages.

**Resolved by this same change**: the `ConfigPanel` "Specifications" field dead-end bug documented in `organisms/config-panel.md` (state collected, never sent to the server) — the composer's unified `prompt` field replaces it and _is_ wired end-to-end into `src/server/analyze.ts`. That issue is closed.

## Dead / unused scaffolding

The shadcn CLI generated `src/components/ui/` in full, but the app only actually styles-and-uses a handful of primitives as unstyled bases (`input.tsx`, minimally). The rest have **zero real call sites** — confirmed by import search across `src/`:

- `button.tsx` — fully replaced by the bespoke `GlowButton` (see `atoms/button.md`). Only referenced internally by other unused files below.
- `card.tsx`, `dialog.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`, `skeleton.tsx` — zero real imports.
- `sidebar.tsx`, `calendar.tsx`, `carousel.tsx`, `pagination.tsx`, `alert-dialog.tsx` — zero real imports; these are what keep `button.tsx`/`tooltip.tsx`/`skeleton.tsx` looking "used" internally.
- `src/hooks/use-mobile.tsx` — only consumer is the unused `sidebar.tsx`.

**Decision needed**: delete this dead scaffolding, or leave it as shadcn CLI boilerplate for future use? Either is reasonable — ask before deleting, since removing files is a judgment call about future intent, not a styling decision.

## Modals

Resolved Nov 2026: the three account modals now share one shell and one set of parts ([`AccountKit.tsx`](../src/components/uxcc/AccountKit.tsx), see `organisms/modal-shell.md`): Radix `Dialog` (focus trap, Esc, scroll lock), `max-w-md`, `GlowButton` CTAs, one `ChoiceCard` with a Lucide `Check`, and chips instead of the emoji badge.

Still open: neither `CreditsModal` nor `BuyCreditsModal` is wired to a payment processor (Pay is a stub, `alert()` in one), and they overlap in purpose. **Decision needed**: which one is canonical, or merge them. A product question; ask before consolidating.

## Accessibility

- The account modals are Radix dialogs now (focus trap, Esc, labelled title). Other overlays (the mobile nav drawer, the video lightbox) still hand-roll Esc and focus.
- `prefers-reduced-motion` is now honoured by the CSS keyframes, Lenis, and the landing's large transforms (v2). App-level framer transitions are short fades and don't check it.

## Missing patterns (gaps, not existing prior art)

- **No empty-state / skeleton-loading component exists** for the app's own UI. The strings `EmptyState`/`SkeletonList`/`ErrorState` that appear in `src/lib/mock-data.ts` are sample _fix code_ shown to end users as example output, not real components. If/when a real empty/loading state is needed anywhere, it doesn't yet have a documented pattern to extend — ask before inventing one, or bring back this doc set for review once one is designed.
- `.animate-shimmer` (defined in `styles.css`) is currently unused — a natural fit for the skeleton-loading gap above, if that's ever built.

## Duplication that's acceptable for now

- `Stat` (the score/label mini-card) is duplicated verbatim between `ResultsView.tsx` and `FlowResultsView.tsx`. Two copies of a ~10-line local helper isn't worth extracting yet — flagged so a third copy doesn't slip in unnoticed; extract to a shared component if that happens.

## Added with the app shell / sessions redesign

- **Sessions are browser-only** (IndexedDB). Clearing site data loses them; no cross-device history and no share links until sessions get a server store.
- **Some issues have no marker.** Markers are only shown once the locate pass has confirmed the element ([`patterns/annotation-accuracy.md`](patterns/annotation-accuracy.md)). Expect about 1 in 5 issues to be unpinned and described in words instead; small outlined buttons (e.g. FortiGate's "Add widget") are the usual misses. The locate pass makes 2–4 model calls (a few cents, no credit) and takes 8–15s.
- **Re-check judgement on cropped captures.** A hierarchy issue ("nothing stands out") can stay "open" on a crop that leaves out the area it was about: the model judges the part it can see.
- **Unused superseded components remain on disk**: `ResultsView`, `FlowResultsView`, `AnalyzingState`, `FlowAnalyzingState`, `SampleAnalysis`, `Header`, `MeshBackground`, `ConfigPanel`, `FlowConfigPanel`, `UploadZone`, `FlowUploadZone`. Delete once the new flow is signed off.
- **Anonymous credits are display-only**: the "5 credits left" count for signed-out users isn't decremented (pre-existing; `incrementUsage` is never called).

## Added with the v2 design system (IdeaApe-based)

- **Forum has one weight.** Older `font-semibold` classes on display elements are harmless (synthesis is off) but no longer do anything; don't expect bold serif.
- **The demo wallpaper is AI-generated** (Figma AI, `gpt-image-2.5-flare`, file "Dats Off. — engraved illustrations") in the style of the classic Mac cloud desktops; it is not Apple's image. 1536 px wide, so slightly soft on very wide screens.
- **White on orange is 3.56:1** (`#FFFFFF` on `#EA580C`). It passes WCAG AA for large/bold text and UI components, not for small body text. Kept to match the reference for button labels (14px medium); don't put small body copy on orange.
- **No "system" theme option.** The toggle switches light ⇄ dark and defaults to light; it doesn't follow the OS setting. Product decision needed.
- **`PillTabs` has no arrow-key navigation** (Tab + Enter only). Fine for 2–5 tabs; add roving tabindex if it grows.
- **Engraved scenes are 1536 px wide rasters** (the image model's output size). Sharp up to ~1600 px viewports, slightly soft on very wide screens; regenerate larger or vectorise if that matters. Sources: Figma file "Dats Off. — engraved illustrations" (personal team).
- **Third-party logos in the tools row** are trademarks of their owners, used nominatively ("Fix prompts written for"). Fine for a factual compatibility list; don't reword it into an endorsement ("Used by", "Partners").
- **Unused after v2**: `GradientWaves.tsx` / `GradientWaves.css` (old landing background), `MeshBackground`, and the old landing `GlassCard` (removed). The `.text-chrome`, mesh and gradient utilities were deleted from `styles.css`.
- **`SEVERITY_TEXT.low` is `text-text-tertiary`**: low-severity labels are intentionally quiet. Low pins are a light grey fill; on very light screenshots they rely on the white ring for separation.
- **Legacy views** (`ResultsView`, `FlowResultsView`, `AnalyzingState`, …) were swept to v2 tokens mechanically but not redesigned; they're unused by the current routes.
- **Pricing CTAs don't preselect a plan.** "Get started", "Go yearly" and "Buy credits" all open `BuyCreditsModal` with nothing selected; passing the plan through `openBuyCredits(plan)` would save a click. Checkout itself is still a stub (`alert`).
- **The product demo's screenshots carry their own light padding**, so in dark mode the canvas shows a pale block around the image. That's the sample asset, not the component; re-export the samples without padding if it bothers.
- **`primitives.tsx` exports a hook and a constant next to components**, which trips the `react-refresh/only-export-components` lint warning (fast refresh reloads the file fully). Harmless; split into `landing/hooks.ts` if it gets annoying.
- **The cosmic CTA border shimmers continuously** (a lighter band drifting over close orange shades, 6s; the ring's width only changes on hover). It stops under reduced motion.
- **The demo desktop is full-bleed** (100vw, square edges); its section uses `overflow-x-clip` so the scrollbar width never causes horizontal scroll. Don't copy the breakout to other sections.

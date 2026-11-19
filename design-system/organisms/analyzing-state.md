# Organism → Analyzing State

> **Superseded** by the chat progress checklist ([`chat-pane.md`](chat-pane.md)) + the canvas scan overlay ([`results-canvas.md`](results-canvas.md)), which reuses this doc's `animate-scan` beam. Components remain on disk.

**Components**: [`AnalyzingState.tsx`](../../src/components/uxcc/AnalyzingState.tsx) (single-screen) and [`FlowAnalyzingState.tsx`](../../src/components/uxcc/FlowAnalyzingState.tsx) (flow). A fixed two-panel loading screen shown while the LLM call is in flight.

## Spec

- Layout: `flex` row, left panel `w-2/5` (image/screens + step tracker), right panel `w-3/5` (centered spinner + rotating tip text). This 40/60 split, not 50/50, is deliberate — the step list needs more visual weight than the "waiting" indicator.
- Left panel, top block: the input being analyzed, in a `rounded-2xl border-border-strong bg-bg-tertiary p-3` frame — a single image with a `.animate-scan` beam overlay (single-screen) or a [`molecules/filmstrip-thumbnail.md`](../molecules/filmstrip-thumbnail.md) row with no scan animation (flow — a moving beam over N thumbnails would read as noisy, not purposeful, at that scale).
- Left panel, bottom block: "Analysis Progress" card — a vertical list of steps, each a dot (idle) → `.animate-pulse-dot` (active) → ✅ emoji (done). **The ✅ emoji is the one place in the app an emoji is used instead of a lucide icon component** — intentional here specifically (a completed-step checkmark reads faster as an emoji glyph in a dense list than a rendered SVG would), but this is a narrow exception, not a precedent — don't use emoji elsewhere (see `BuyCreditsModal`'s badge emoji in `known-issues.md` for where this exception was wrongly copied).
- Right panel: a CSS spinner (double `border-4` circle, one ring `border-t-primary` rotating) + heading + `AnimatePresence mode="wait"` rotating tip text, `key={tipIndex}`, cycling every 5s.

## `FlowAnalyzingState`'s one structural change: scaled timing, not hardcoded timing

`AnalyzingState`'s step list advances on **fixed** `setTimeout`s (`(i+1) * 800ms`), decoupled from the real API call and identical regardless of input size — acceptable for a single, fixed-size image, but would feel wrong for a flow that could be 2 or 8 screens. `FlowAnalyzingState` instead derives its per-step delay from screen count (`Math.max(600, 400 + screens.length * 150)`) and generates step labels dynamically (`"Processing N screens"` interpolates the real count). **Rule: any future analyzing-state variant whose input size varies should scale its timing the same way `FlowAnalyzingState` does — don't copy `AnalyzingState`'s fixed-timing approach for a variable-size input.**

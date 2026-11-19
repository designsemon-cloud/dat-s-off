# Organism → Fix Card

**Component**: [`FixCard.tsx`](../../src/components/uxcc/FixCard.tsx). The core content unit of every results screen — a collapsible card for one finding (title, severity, problem/why/fix, code snippet). Shared verbatim between the single-screen (`ResultsView`) and flow (`FlowResultsView`) results screens via a union prop type.

## Spec

- Container: `rounded-2xl border border-border bg-bg-tertiary`, `hover:border-border-strong` — the standard card shell (see `foundations/tokens.md`'s radius scale).
- Header (always visible, click to toggle): title (`text-base font-semibold`) first, then a `flex-wrap` row of: [`atoms/badge-severity.md`](../atoms/badge-severity.md) → principle text (`caption`, tertiary) → for flow findings only, a category chip → optional anchor label. **Title always leads** — never put the severity badge above/before the title; a user should read _what broke_ before _how bad it is_.
- Body (`AnimatePresence`, `height`+`opacity` animate, `0.25s`): three labeled sections (`Section` helper — icon + sentence-case `font-semibold text-foreground` label + paragraph (v2: no per-section label colors)) for "The problem" (red-toned label), "Why it matters" (cyan-toned label), "The fix" (green-toned label) — then a code block.
- Code block: `rounded-lg border bg-bg-secondary` — the well token; hidden entirely when `code` is empty.
- Entrance stagger: `transition={{ delay: index * 0.08 }}` — see `foundations/motion.md`.

## Extending for a new finding type (how `FlowFix` was added without breaking this component)

`FixCard`'s `fix` prop is typed `UXFix | FlowFix`. `FlowFix` **extends** `UXFix` (same required fields, plus `scope`/`category`/`anchorScreenIds`/`heuristic`) rather than being a parallel shape — this is why zero changes were needed to the section-rendering logic. A type guard (`"category" in fix`) gates the two purely additive UI extensions:

- A category chip, rendered only when the guard is true.
- An `anchorLabel` prop (e.g. "Screen 2 → 3"), passed by the caller, not derived internally — `FixCard` doesn't know about screens or flows, it just renders a string if given one.

**Rule for any future finding variant**: extend `UXFix`, never replace it, and gate new UI with a type guard rather than branching the whole component on a `variant` prop. This keeps `ResultsView`'s existing single-screen call sites (which pass plain `UXFix`, no category, no anchor) completely untouched.

## "Copy Fix Prompt" button

At the bottom of the expanded body (below the code block), right-aligned: `GlowButton variant="outline" size="sm"` with a `Sparkles` icon and the label "Copy Fix Prompt". It copies `fix.fixPrompt`, then shows a `Check` icon and "Copied" for 2s. It's the same recipe as `ResultsView`'s "Copy MD" button, including a fixed width (`w-[158px]`) so the label swap doesn't shift the layout. It only renders when `fix.fixPrompt` is a non-empty string. That's checked at runtime, not just through the type, because results saved before `fixPrompt` existed don't have it. It shows on flow findings too, since `FlowFix` extends `UXFix`.

Because the button lives inside the collapsible body, it's hidden on collapsed cards. The older "Working Code" block still renders even when `fix.code` is `""`, which is what the current single-screen prompt returns.

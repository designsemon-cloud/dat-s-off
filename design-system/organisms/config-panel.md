# Organism → Config Panel

> **Superseded.** `Landing.tsx` no longer renders either of these components — Tech Stack/Device selection now lives in [`organisms/prompt-composer.md`](prompt-composer.md) via [`atoms/option-dropdown-pill.md`](../atoms/option-dropdown-pill.md), and the "Flow Goal" field has merged with the composer's own prompt field. The files below are kept on disk (not deleted — see `known-issues.md`), and this doc is kept accurate to them as they exist, in case they're revived. Don't build new work against this doc — build against `prompt-composer.md` instead.

**Components**: [`ConfigPanel.tsx`](../../src/components/uxcc/ConfigPanel.tsx) (single-screen) and [`FlowConfigPanel.tsx`](../../src/components/uxcc/FlowConfigPanel.tsx) (flow — adds a "Flow Goal" field). A vertical stack of labeled control groups shown once content has been uploaded, sitting beside the upload zone.

## Spec

- Each group: [`atoms/section-label.md`](../atoms/section-label.md) header, then a `grid` of selectable pill buttons (`grid-cols-2 sm:grid-cols-3` for tech stack, `grid-cols-3` for device) or a single free-text field.
- Selectable pill button (tech stack / device), two states:
  - Selected: `border-border-strong bg-bg-elevated text-foreground`
  - Idle: `border-border bg-bg-tertiary/60 text-muted-foreground`, `hover:border-border-strong hover:bg-bg-elevated hover:text-foreground`
  - This is the **general "selectable pill" idiom** used for any single-choice control group in this app — device/stack pickers today, but reuse it for any future single-select row rather than inventing a new selected/idle treatment. (Contrast with [`molecules/filmstrip-thumbnail.md`](../molecules/filmstrip-thumbnail.md)'s stronger glow-based selection — that's reserved for image thumbnails specifically, not text/icon pills.)
  - Literal `borderRadius: "8px"` on every pill (same compact-button radius as `GlowButton`).
- Free-text field: the standard textarea recipe from [`atoms/input-textarea.md`](../atoms/input-textarea.md).
- Groups stack with `space-y-4` on the wrapping `motion.div`; each group's own internal label→controls gap is `mb-2.5`.

## `FlowConfigPanel`'s one structural addition: the Flow Goal field

Placed **first**, above Tech Stack/Device — the goal is the most important piece of context for a flow analysis, so it leads. It is **not** a repeat of the pre-existing `ConfigPanel` bug where a "Specifications" textarea's state never left the component (local `useState`, never lifted, never sent to the server) — `flowGoal`/`onFlowGoalChange` are controlled props threaded all the way from `src/routes/index.tsx` through to the analysis server call. **Any future optional-context field must be wired the same way — a genuinely controlled prop, not local state that quietly goes nowhere.** See `known-issues.md` for the original bug this pattern is explicitly avoiding.

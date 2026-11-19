# Organism → Context Intake

> **Superseded and removed (deleted from code).** The landing-page questionnaire was replaced by in-chat, screenshot-specific clarifying questions. See [`question-card.md`](question-card.md). Kept as a record.

**Status: new organism, mounted on the landing page (single-screen mode only).** Component: [`ContextIntake.tsx`](../../src/components/uxcc/ContextIntake.tsx). A short questionnaire that collects an `AnalysisContext` (product type, primary user, primary task, focus area) before a single-screen analysis, so the prompt in `src/server/analyze.ts` can judge the screen against who it's for instead of in a vacuum.

## Spec

- Up to 4 questions, always in this order: product type → primary user → main task → focus area. Each one has a label, a wrapping row of chips, and a single-line free-text input ("or describe it...").
- **Question label**: `text-[13px] font-medium text-foreground`, sentence case. This deliberately does _not_ reuse [`atoms/section-label.md`](../atoms/section-label.md)'s uppercase `text-xs text-text-tertiary` style: these labels are full questions people have to read and answer, not category headings, and uppercase at 12px in the quietest grey reads poorly as a sentence.
- **Chips**: the exact selectable-pill recipe from [`organisms/config-panel.md`](config-panel.md): `h-8 border px-3 text-[13px] font-medium`, literal `borderRadius: "8px"`, selected `border-border-strong bg-bg-elevated text-foreground`, idle `border-border bg-bg-tertiary/60 text-muted-foreground` with the standard hover. Laid out with `flex flex-wrap gap-2`, not ConfigPanel's fixed grid, because the chip labels vary a lot in length.
- **Free-text input**: [`atoms/input-textarea.md`](../atoms/input-textarea.md)'s recipe as a single-line `<input>` (`h-8`).
- **Submit**: `GlowButton` primary, `size="lg"`, full width, "Start Analysis →". Below it, a plain text "Skip — analyze without context" button (`text-[12px] text-muted-foreground`, hover `text-foreground`).
- Enter motion: `opacity 0→1, y 8→0, 0.15s`, the same as ConfigPanel.

## Behavior rules

- **Free text and a chip are mutually exclusive per question.** Typing text overrides the chip, and the chip stops showing as selected. Clicking a chip clears that question's text. Clicking a selected chip deselects it. Never show a chip as selected when it isn't the value that will be sent.
- "Start Analysis" is disabled until questions 1 and 2 (product type, primary user) have answers. Main task and focus area are optional; if left empty they're sent as `""`, and the server's `resolveContext` turns empty fields into "infer it from the screenshot" instructions.
- `initial?: Partial<AnalysisContext>` lets a parent pass answers it already knows. Any question with a non-empty `initial` value is hidden and counts as answered. `initial` is also the only source of `platform` and `stage`, which this form doesn't ask about (defaults: `"web"`, `""`). A parent should derive `platform` from the selected device rather than relying on the `"web"` default.
- Chips use `aria-pressed`, each chip row is a `role="group"` labelled by its question, and each free-text input has its own `aria-label`.

## Placement and wiring

- Rendered by `src/routes/index.tsx` through `Landing`'s `contextIntake` slot. It only appears when `mode === "single"` and a screenshot is attached, inside a card below the composer's toolbar row (`mt-6 rounded-2xl border border-border-strong bg-bg-tertiary/80 p-5 backdrop-blur`, the same surface as the composer box). It's hidden in Flow mode, because flow analysis doesn't use `AnalysisContext`.
- **Start Analysis** saves the context in `analysisContext` state _and_ submits. **Skip** saves a blank context (empty answers, `platform` taken from the selected device) and submits. Both pass the context directly into `handleSubmit(context)`, because the state update hasn't re-rendered yet when the click handler runs.
- The composer's own send button still works while the intake is showing. It submits the stored context, or a blank one if the intake hasn't been completed, which is the same as Skip.
- `platform` comes from the device picker via `initial={{ platform }}` (mobile → `"mobile"`, otherwise `"web"`).
- Path to the server: `analyzeUI(dataUrl, stack, device, context, prompt)` → `analyzeImage` (`context: AnalysisContext`) → `resolveContext` (empty fields become "infer it from the screenshot") → `buildPrompt`.
- Its local answers reset whenever it unmounts: removing the screenshot, switching to Flow, or New Analysis (which also clears `analysisContext`).

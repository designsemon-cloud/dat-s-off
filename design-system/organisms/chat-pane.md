# Organism → Chat Pane

**Component**: [`ChatPane.tsx`](../../src/components/uxcc/ChatPane.tsx). The conversation: full width by default, docked left when the critique panel is open ([`templates/session-template.md`](../templates/session-template.md)). Messages and composer sit in a centred `max-w-[720px]` column. Every step of a critique is a stored message (see [`patterns/session-lifecycle.md`](../patterns/session-lifecycle.md)).

## Messages

- **User prompt**: right-aligned in a bubble, like a messaging app (`rounded-2xl rounded-tr-md bg-foreground/[0.07] p-1.5`). Screenshots and the note share it.
  - One screenshot: the bubble is 264px wide (max 85%), the image spans it (`aspect-[16/10]`, `rounded-xl`) and the note wraps under it.
  - Several: `h-20 w-32` thumbnails, numbered, with the bubble capped at 360px.
  - The assistant's replies are not bubbled: they sit on the surface.
- **Assistant**: left, 24px "D." mark (`rounded-md border bg-bg-elevated text-primary text-[11px] font-bold`) + content. Enters with `opacity/y 6→0, 0.2s`.
- **Questions**: one lead sentence + [`question-card.md`](question-card.md).
- **Result**: the direction for this round, in text. In order:
  1. **The answer** to the user's question (15px foreground). It's the model's `answer`, or the summary for results that predate it.
  2. **Since vN** (re-checks): one line, `Score 61 → 78 (+17) · 3 fixed · 1 partly fixed · 1 still open · 1 new`. Score up = foreground, down = accent. The document itemises it ([`patterns/recheck-loop.md`](../patterns/recheck-loop.md)).
  3. **What to fix** (re-checks: "Still to fix"): up to 3 critical/medium issues (low ones only when nothing else is left). For each:
     - the issue number (`ISSUE_NUMBER`, neutral: the same circle and number as in the document and on its pin);
     - the title, a button that opens the document on that issue;
     - the severity word in its severity colour;
     - why it matters, as a muted line;
     - **Fix:** the solution.

     Then "N more lower-priority issues in the critique."

  4. **CritiqueTile** (`max-w-[420px] rounded-2xl p-2 pr-2.5`, **glass**): translucent and frosted (`backdrop-blur-xl`).
     - Light: `bg-white/40 border-white/70` with a bright inset top edge. Dark: `bg-white/[0.03] border-white/10`.
     - Content: a 64×48 thumbnail, "UX critique" / "Flow critique" (+ `vN`), "61/100 · Needs work · 5 issues".
     - On the right, an **outline button** drawn inside the tile (the whole tile is the control; hovering the tile darkens its border): "Open ›", or "Close" while its critique is open. It's not the primary: opening the critique is never the next action on its own.
     - Open state: the glass turns opaquer (`bg-white/75 border-white`; dark `bg-white/[0.08] border-white/20`) and `aria-pressed="true"`. No accent strip.
  5. **Fix it, then re-check** (latest result only): a `rounded-xl border bg-bg-tertiary/60 p-4` box with a [`border beam`](../atoms/border-beam.md) (a slow orange streak around its edge: this is the next thing to do) and exactly two numbered steps. The beam and the primary Copy show only when the card holds the next action (`lead`: your own critique, no question pending); in samples and while a check question waits, the card has no beam and Copy is outline.
     1. "Paste the prompt into Cursor, Claude Code, v0 or Lovable." with a **primary** `Copy fix prompt` ([`copy-button`](../atoms/copy-button.md); copies `versionPrompt`, [`patterns/fix-prompts.md`](../patterns/fix-prompts.md)).
     2. "Attach the updated screen. I'll mark what's fixed." with an outline `Re-check` that opens the composer's file picker. It's hidden for samples, while a run is busy and while a check question is pending.

     Both buttons are `min-w-[152px]`. They sit right of the step, or under its text when narrow. If nothing is left to fix, a single line replaces the box.

- **Input check** ([`patterns/input-check.md`](../patterns/input-check.md)): when an upload doesn't look like an interface, or a re-check doesn't look like the same product, the question appears in the same bordered card as triage questions. It has a primary "Upload the updated screen" (or "Upload a different image"), an outline "Compare anyway" (or "Critique it anyway"), and "No credit used yet." in tertiary text. After a choice, a single tertiary line replaces the buttons.
- **Scroll**: the chat follows new messages, but when it ends on a finished result it scrolls to the **top** of that result, so the answer is read first.
- **Text** (follow-up answer): plain `whitespace-pre-wrap text-[13px]`.
- **Error**: `border-severity-high/25 bg-severity-high/10` card with a Retry button on the latest one.

## Live status (not stored)

- `new`/`triaging`: "Looking at your screenshot" + 3 pulsing dots.
- `analyzing`: progress checklist — 4 timed steps (Reading → Pass 1 → Pass 2 → Writing fix prompts; flow has its own 4), done = foreground check, current = spinning `Loader2` in `text-tertiary`, upcoming = empty ring.
- `replying`: "Thinking" dots. `interrupted`: notice + Retry.

## Composer

Same Claude-style input as the new-critique composer, built from the shared parts in [`prompt-composer.md`](prompt-composer.md) (`ComposerFrame p-2.5`, 48px `AttachmentTile`s, `ComposerIconButton` attach, `SendButton`; drag-and-drop with "Drop an updated screenshot"). Textarea one row, 14px (Enter sends, Shift+Enter newline); placeholder "Ask a question, or attach the updated screen", and with an attachment "Add a note on what changed (optional), then send to re-check". Text only → follow-up question (free). With screenshots → re-critique as a new version (charged). Disabled (60% opacity, explanatory placeholder) unless the session is `done`; while a check question is pending the placeholder is "Answer the question above to continue". No divider above the composer. Samples replace it with a "This is a sample critique · Critique yours →" bar.

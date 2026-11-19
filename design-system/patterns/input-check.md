# Pattern → Input check

Before a credit is spent, Dats Off. looks at what was actually uploaded. A label like "v2" is a claim, not a fact. An unrelated image, a document or a stray crop shouldn't be critiqued, or compared, as if it were the screen.

## When it runs

- **First run** (single or flow): in parallel with triage. Is this an interface? Is enough of it visible? For flows: do the screens belong to one product?
- **Every re-check**: before the analysis. Is the new upload the same product and screen as the version it'll be compared with? Both images are sent. A redesign that looks completely different still counts as the same screen; a different app, a document or a photo doesn't.

## How it works

- [`server/check-input.ts`](../../src/server/check-input.ts) `checkInput`: gpt-4.1 (falls back to gpt-4o), temperature 0, images at `detail: "low"`.
  - The model describes what each image `shows`, then classifies: `isInterface` yes / partly / no, `enoughVisible`, `sameProduct` (same-screen / redesign / other-screen-same-product / unrelated / unclear) or `flowRelated`.
  - It returns `verdict: proceed | ask`, a `reason` (ok, not-ui, too-little, unrelated-to-previous, mixed-flow, unclear) and the question to ask.
  - The prompt's examples are deliberately generic (a banking app, a whiteboard photo) so they don't bias real inputs.
- [`lib/session-runner.ts`](../../src/lib/session-runner.ts):
  - `runInputCheck` sends the images compressed to 1024px; on a re-check it also sends the previous screenshot. A failed check returns `null` and never blocks a run.
  - `askAboutInput` stores a `check` message, including the `finding` (shows / previousShows / reason), and sets the session to `awaiting-answers`.
  - `resolveCheck` handles the answer.

## What the user sees ([`organisms/chat-pane.md`](../organisms/chat-pane.md))

An assistant message in the same bordered card as the triage questions:

- The question, in plain words that say what each image looks like. For example: "These look like different things: v1 is a security dashboard, but this one is a text document summarising research findings. Did you mean to upload the updated dashboard screen?"
- Two buttons:
  - primary **Upload the updated screen** (first run: **Upload a different image**), which opens the file picker; nothing runs until they send;
  - outline **Compare anyway** (first run: **Critique it anyway**).
- "No credit used yet." in tertiary text.
- The composer is disabled with "Answer the question above to continue".

After a choice, the buttons are replaced by one tertiary line ("Comparing anyway, as you asked.").

## Going ahead anyway

This is not left to the model. If the session's product context is still in the prompt, the model critiques a text document _as_ that product. So `runAnalysis` reads the `finding` of the check the user overrode and:

- **Re-check, upload unrelated or not a UI**:
  - doesn't send the previous version, so nothing is marked fixed or open;
  - drops the session's product context;
  - tells the model what the image actually is;
  - opens the answer with a fixed sentence: "This doesn't look like an updated version of v2 (it looks like …), so I critiqued it on its own instead of comparing."
- **First run, not a UI**: the image is critiqued as what it is (layout, hierarchy, readability), and the answer says so up front.

## Rules

- The check never spends a credit, and a failure never blocks a run.
- Ask, don't refuse: the user can always go ahead.
- Say what you see in both images. Never just "invalid input".

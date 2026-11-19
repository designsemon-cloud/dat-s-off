# Pattern → Fix → Re-check loop

The product's signature move: a critique isn't the end. You fix the screen in your AI tool, attach the updated screenshot, and Dats Off. tells you **what's fixed, what's still open, what's new, and how the score moved**. Each round is a version of the same session.

## The loop, as the user meets it

1. **Critique** → the chat answers their question, lists what to fix (problem, why it matters, fix), links the full critique document, and ends with **Fix it, then re-check**:
   1. Copy the fix prompt → `Copy fix prompt` (the version's structured prompt, `versionPrompt`, [`fix-prompts.md`](fix-prompts.md)).
   2. Paste into Cursor, Claude Code, v0 or Lovable and apply it.
   3. Re-check → `Re-check` opens the composer's file picker. The user can add a note and sends. The upload is checked first ([`input-check.md`](input-check.md)); then the analysis charges a credit like any critique.
2. **Re-check** → the next version's chat message starts with the answer, then **Since vN**: `Score 61 → 78 (+17) · 3 fixed · 1 partly fixed · 1 still open · 1 new`, then **Still to fix**, the tile (`UX critique v2`) and the same three steps.
3. The critique document of that version opens with **Since vN**: a before/after slider of the two screenshots (single screens), then every earlier issue with its status (Fixed, struck through in tertiary / Partly fixed / Still open / Not visible, tertiary) and the model's one-line note. Each remaining issue is tagged in its meta line: "Partly fixed", "Still open" or "New".
4. When nothing is left: "Nothing left to fix here. Attach another screen whenever you want a fresh check."

## How it works

- **Input check first** ([`input-check.md`](input-check.md)): before anything is charged, the new upload is compared with the last version. An unrelated image or a document gets a question, not a comparison.
- [`lib/session-runner.ts`](../../src/lib/session-runner.ts) `runAnalysis`: when the session already has a version, it sends `previous: { image, score, issues: [{ id, title, severity, problem }] }` with the new screenshot(s). The previous screenshot (compressed to 1280px) goes first, labelled "PREVIOUS VERSION (for comparison only)", so the model compares two images, not a list of titles. If the user chose "Compare anyway" on an unrelated upload, no `previous` is sent and the answer says it wasn't compared.
- [`server/critique-prompts.ts`](../../src/server/critique-prompts.ts) `recheckInstructions` adds a RE-CHECK block to the single-screen and flow prompts (gpt-4.1, falling back to gpt-4o):
  - **Be honest about what changed.** The upload may be unchanged, cropped or zoomed. Never claim an improvement you can't point to; if the two look the same, say so.
  - `sameScreen`: false for a different product, and then `progress: []`.
  - Mark **every** previous issue `fixed | partly | open | unseen` in `progress[]` with a note. `unseen` means its area isn't in the new capture: cropped-out elements are never reported as removed or missing.
  - Repeat partly/open ones with `carriedFrom: <previous id>` (`unseen` ones aren't repeated), report new ones with `carriedFrom: null`, and score the new version on its own.
  - `missingProgress`: if the model skips any previous issue, one corrective retry asks for the complete list.
- [`lib/critique.ts`](../../src/lib/critique.ts) `recheckOf(session, index)` joins `progress` with the previous version's titles and counts fixed / partly / open / unseen / new. Missing `progress` (older results, a model miss) means no "Since" section; the version then reads as a plain critique.

## Rules

- A re-check always compares with the version **directly before** it.
- The chat shows the one-line change; the document itemises it. Don't list the items in both.
- Score deltas: up = foreground, down = accent (`text-primary`). Fixed items are tertiary + `line-through`, never green.
- No icons for statuses: the words carry them.

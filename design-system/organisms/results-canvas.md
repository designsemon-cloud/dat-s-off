# Organism → Results Canvas (the critique document)

**Component**: [`ResultsCanvas.tsx`](../../src/components/uxcc/ResultsCanvas.tsx). The critique panel: opens beside the chat when the user opens the critique, closes back to it ([`templates/session-template.md`](../templates/session-template.md)). It reads as **one document, top to bottom**. The old Annotated / Issues / Wins / Fix prompt tabs, the boxed score strip and the severity filter chips are gone. **Role split:** the chat gives direction (what to do now); this is the full record (everything, in order). Shared reading helpers live in [`lib/critique.ts`](../../src/lib/critique.ts), so numbers, order and prompts match the chat.

## Toolbar

`h-[52px] border-b border-border/60 px-4`, one row: **"What's off"** / "What's off in this flow" (14px semibold, the review's name; see [`foundations/voice-and-naming.md`](../foundations/voice-and-naming.md)) · the **step timeline** (below) · Version [`option-dropdown-pill`](../atoms/option-dropdown-pill.md) (only with >1 version) · then, right-aligned, **Listen** (speaker icon, lucide `Volume2`, ghost 32px, pressed while on; it opens the floating player at the bottom of the panel, [`patterns/listen.md`](../patterns/listen.md)), Export (outline `GlowButton`, a lucide `Download` icon before the label, `Check` while "Copied"; menu: Download PDF / Copy as Markdown) and ✕ close (ghost `GlowButton`, 32px, "Close review").

## Step timeline (in the toolbar)

Beside the title, after a hairline divider (`border-l pl-3`): **Verdict — What changed** (re-checks) **— Fix n/m — Re-check**. It lives in the toolbar, not in a bar of its own (Nov 2026): one row less, and the steps sit next to the name of what they step through.

- Built in `CritiqueDocument` (it owns the scroll-spy) and portalled into a slot in the toolbar (`createPortal` → `stepSlot`).
- **Text only, no containers.** The current step is `font-medium text-foreground` with a 6px **orange dot**: that's the whole highlight, with no chip, fill or shadow. Other steps are `text-text-tertiary` with a grey dot; a complete step shows a `Check`. Steps are joined by a short hairline (10px, 16px from `@lg`).
- Dots, not numbers, because only issues are numbered in this document.
- In a narrow panel (below the `@lg` container size) only the current step keeps its label; the others shrink to their dots.
- "Fix" shows the count marked fixed (`0/5`). There is no progress bar.

## Document (`max-w-[760px]`, centred, `px-5 sm:px-8`, `pt-8 sm:pt-10 pb-16`)

Section headings are plain 19px semibold text (`DocSection`), with no number badge.

1. **Verdict**:
   - Session title (24px semibold) and a meta line (13px tertiary): kind · `vN` · date.
   - Score row between hairlines: 40px score, "/ 100", the verdict word, and severity counts on the right.
   - The summary (16px), then `contextSummary` (13px tertiary). Flows add "Goal reached: …".
2. **What changed since vN** (re-checks only, [`patterns/recheck-loop.md`](../patterns/recheck-loop.md)): a before/after slider (single screens), the score change and "2 of 5 fixed · 1 new", then each earlier issue with its status (Fixed / Partly fixed / Still open / Not visible) and the model's note.
3. **"5 issues to fix"** (re-checks: "2 issues left"; none: "The screen"). One section, so the picture sits directly above the list it numbers:
   - Intro: "Most important first. Copy each prompt into your AI tool, then mark the issue fixed."
   - The [`annotated screenshot`](../molecules/annotated-screenshot.md) (`pinTone="neutral"`, spotlight on hover). Flows show the filmstrip and the selected screen instead. Markers appear only once grounded, and the caption reports how many are pinned ([`patterns/annotation-accuracy.md`](../patterns/annotation-accuracy.md)).
   - **The issues, in full**, critical → low: a flat document, with no accordion and no cards. Issues are separated by hairlines (`divide-y divide-border`), with `py-10` of room each. Nothing to click open, nothing floating.
     - **Heading row**: the issue number (`ISSUE_NUMBER`, a 24px `bg-foreground text-background` circle, the same as its pin), the title (17px semibold), and the severity as a word on the right (12px medium: "Critical" in `text-primary`, "Medium" and "Low" muted).
     - **Body**, aligned under the title:
       - the meta line (13px tertiary: principle · flow category · screen · re-check status);
       - the `RegionZoom` crop, or one quiet tertiary line with `MapPinOff` ("Couldn't confirm the exact element… Where: …");
       - the problem (15px foreground), then why it matters (14px muted). No "Problem." or "Why it matters." labels: the colour step carries it;
       - a **Learn** line under the why (13px, no container): "Learn:", then the principle's name in the `learn` accent (indigo), linking to its first article (new tab), its minutes, and "▶ Video 2:49" in the same accent, which plays in place. See [`learning.md`](../patterns/learning.md);
       - **How to fix it** (13px semibold), the solution (15px), the steps as a dotted list (14px muted), then "Done when …" (13px tertiary);
       - actions: "Copy this fix's prompt" and outline "Mark fixed". Copy is primary only on the first issue not yet fixed (the next action) and outline on the rest, so the document never shows a column of primaries.
     - **Marked fixed**: the issue folds to its heading row (number becomes a check, title tertiary) plus "Marked fixed · Show · Undo". "Show" unfolds it again. Marking one fixed scrolls to the next; after the last, to Re-check. Progress is saved on the version (`done`).
     - Picking an issue in the chat or on a pin scrolls to it. While Listen reads, the spoken sentence and word are highlighted in place.

4. **Re-check your fixes**: "Fixed them? Attach the updated screen to re-check…", then "3 of 5 marked fixed so far" and a **Re-check** button (outline; primary once all are marked). It opens the composer's file picker.
5. Two collapsibles at the end, **One prompt for all the fixes** (the `versionPrompt` in a mono block, with "Copy prompt") and **What already works** (wins), then the **Keep learning** shelf: a `learn`-tinted card of its own, with thumbnails peeking in its header, that opens into a rail of videos and articles per principle. It looks different on purpose, because its purpose is different. See [`learning.md`](../patterns/learning.md).

**Why this shape** (Nov 2026): every issue is shown in full, because an accordion cost a click per issue and its open card floated on a shadow for no reason. Before that, the earlier version had three numbering systems (guide-bar steps, section badges, issue numbers) in the same circle style. It also used severity-coloured bullets with no legend (light-grey "low" read as disabled or done), Fix first / Then / Polish groups, and a "Where" section far from the list it numbered. Now only issues carry numbers, severity is a word, and the screenshot sits with its list.

**Ordering**: `orderedFixes` sorts critical → medium → low (stable). Pins, the document and the chat all number issues by that order.

**Before a result**: the uploaded screen(s) with the run's state label; while reading/analyzing, a dim overlay + the `animate-scan` beam from [`analyzing-state.md`](analyzing-state.md).

**Icons**: ✕ close, the speaker toggle and the player's controls, the no-marker note's `MapPinOff`, the Learn chip's `BookOpen` and ▶, the shelf's `GraduationCap` and rail arrows, and the copy icon on copy buttons. Everything else is text.

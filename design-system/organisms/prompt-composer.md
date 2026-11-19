# Organism → Prompt Composer

**Status: new organism.** Component: [`PromptComposer.tsx`](../../src/components/uxcc/PromptComposer.tsx). The single consolidated input on the landing page — replaces the previous split of a big empty-state dropzone, a separate config panel that only appeared after upload, and a mode toggle living at the top of the page. One component now does all of it: mode switch, attachment, prompt, options, submit.

This exists because of a specific, deliberate product decision (not a styling preference): **reduce the number of screens/steps between landing and hitting "Analyze"**, and make the landing page feel like _one_ neutral tool with a mode setting, not two different features bolted together. See the takeaways this was built from — consistent structure across modes, the mode toggle living inside the uploader rather than above it, and one consolidated action component covering mode selection, upload, prompt, options, and submit.

## Structure: Claude-style input (build 6, current)

Modelled on Claude's own message input (the reference was aisdkagents' "claude-input"; its page sat behind a bot checkpoint, so the layout follows Claude.ai's composer directly). Everything lives inside **one** box; nothing hangs below it.

```
┌────────────────────────────────────────────────────────────┐
│ [72px tile] [72px tile]                ← screenshots, if any │
│ Check if my checkout flow is acc|      ← prompt, 15px, ≥2 rows│
│                                                              │
│ [+] [⚙ ⚛ React + Tailwind · 🖥 Desktop]    Single screen ⌄ [↑] │
└────────────────────────────────────────────────────────────┘
  (flow, below the minimum) Add 1 more screen to analyze the flow.
```

| Slot            | Product mapping                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `+` (left)      | Attach screenshot(s). Disabled at the flow cap.                                                                                                                                                                    |
| Settings (left) | `SlidersHorizontal` + current stack and device (icon only below `sm`). Opens a menu: "Fix prompts written for" (stack list, check on the selected) and "Screenshot is from" (3-up Desktop / Tablet / Mobile grid). |
| Mode (right)    | Where Claude puts its model picker. "Single screen ⌄" / "Flow 1/8 ⌄"; menu rows carry a one-line description.                                                                                                      |
| Send (right)    | 32px cosmic square (the primary button as an icon: orange ring, raised neutral surface), `ArrowUp`. Disabled until ≥1 (single) / ≥2 (flow) screens. Enter also submits; Shift+Enter is a newline.                  |

Removed in this build: the separate mode segmented control, the inert mic button, and the Stack / Device `OptionDropdownPill` row under the box (those pills still serve `app.settings.tsx` and the results canvas).

### Shared parts — [`composer-parts.tsx`](../../src/components/uxcc/composer-parts.tsx)

Both composers (this one and the follow-up box in [`chat-pane.md`](chat-pane.md)) are assembled from the same parts, so every text input in the product looks the same:

| Part                          | Spec                                                                                                                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ComposerFrame`               | `rounded-[20px] border-border bg-bg-tertiary p-3`, shadow `0 4px 20px` 5% → `0 6px 28px` 9% on focus-within (35% / 50% black in dark); border → `border-strong` on hover / focus. Owns drag-and-drop and its dashed overlay ("Drop screenshots to attach"). |
| `AttachmentTile`              | 72px (`md`) / 48px (`sm`) tile, `rounded-[12px]`; remove ✕ at the top-left corner on hover (always visible on touch); flow order badge bottom-left; ‹ › reorder bottom-right on hover.                                                                      |
| `ComposerIconButton`          | 32px, `rounded-[10px]`, `border-border`, muted icon → foreground on hover.                                                                                                                                                                                  |
| `SendButton`                  | 32px, `rounded-[11px] p-[2px]` around a 28px `rounded-[9px]` surface (`COSMIC_RING` + `COSMIC_SURFACE`), 40% opacity when disabled.                                                                                                                         |
| `ComposerMenu` + `MenuOption` | Popover `rounded-xl border bg-bg-tertiary p-1 shadow-elegant`; closes on outside click / Escape. Rows `rounded-[10px] px-2.5 py-2`, 14px title + 12px tertiary description.                                                                                 |

Corners are explicit (`rounded-[10px]`) because this system's `rounded-lg` is 14px, which turns 32px buttons into circles.

## Typewriter placeholder — animated example prompts, not static text

The textarea's empty state is **not** a static `placeholder` string anymore. `useTypewriterPlaceholder` (defined in `PromptComposer.tsx`) cycles through a short list of example prompts per mode (`SINGLE_EXAMPLES`, `FLOW_EXAMPLES`), typing each one out character by character (~62ms/char — slowed from an initial ~40ms/char, which read too fast to comfortably follow), pausing (~1.8s), deleting it (~32ms/char), then moving to the next — looping forever while the field is empty. It's rendered as an absolutely-positioned `aria-hidden` overlay layered behind the real `<textarea>` (which has an empty native `placeholder` and a real `aria-label` instead, for assistive tech), so it never fights with actual typed input and disappears the instant `prompt.length > 0`.

This is a genuinely new pattern — no prior animated-placeholder anything existed in this codebase. If a second field ever wants this treatment, extract the hook (and the overlay markup) into a shared component rather than copy-pasting a second `useTypewriterPlaceholder` — ask first if the need arises, since a one-off inline hook and a reusable documented pattern are different commitments.

**Rule for the structure itself**: a future third mode (or a fourth option category) extends rows that already exist — it does not add a new row, a new modal step, or a second composer instance. If something doesn't fit in this shape, that's a sign that a genuinely different structural pattern is needed, not that this one should have a row bolted on ad hoc — ask before doing that.

## The landing page around the composer never changes shape either

> **One exception since the context-intake wiring:** in single-screen mode with a screenshot attached, `ContextIntake` renders below the composer (see `organisms/context-intake.md` and `templates/landing-template.md`). The rest of this section still holds for everything else on the page.

Earlier drafts hid the hero heading, trust line, and sample gallery once `attachments.length > 0`, and animated the composer's max-width wider. Both are gone: **the landing page is pixel-identical whether the composer is empty or full of attachments** — the _only_ thing that changes on that page, ever, is the composer's own internal content, and the _only_ screen transition happens when the user actually hits submit (to the analyzing state). This was a direct correction — an in-between "half-populated, everything-else-vanished" state was confusing rather than focusing. See [`templates/landing-template.md`](../templates/landing-template.md).

## What changes per mode (the _only_ things that change)

|                              | `single`                                                           | `flow`                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Attachment cap               | 1 (a new file replaces the existing one)                           | `FLOW_MAX_SCREENS` (8), ordered                                                                                                                 |
| Chip extras                  | none                                                               | ordinal badge, left/right reorder controls on hover                                                                                             |
| Example prompts (typewriter) | `SINGLE_EXAMPLES` — e.g. "Check if my checkout flow is accessible" | `FLOW_EXAMPLES` — e.g. "User is trying to complete checkout"                                                                                    |
| Send button `aria-label`     | "Analyze UX"                                                       | "Analyze flow" (the button itself is icon-only in both — see `atoms/icon-button.md` — the label exists for assistive tech, not as visible text) |
| Submit enabled at            | ≥1 attachment                                                      | ≥`FLOW_MIN_SCREENS` (2) attachments                                                                                                             |
| Mode trigger                 | "Single screen"                                                    | "Flow n/8", plus an "Add N more screen" line under the box below the minimum                                                                    |

Everything else — container chrome, textarea behaviour, the settings menu, the toolbar layout, drag-and-drop anywhere on the box — is identical between modes. This is the concrete implementation of "change only the contextual content."

## Data model: one `attachments: FlowScreen[]`, not two parallel states

The composer (and the page state above it, in `src/routes/index.tsx`) uses a single `attachments: FlowScreen[]` array and a single `prompt: string` for **both** modes — there is no separate `preview` object for single-screen and `flowScreens` array for flow anymore. In `single` mode the array is simply capped at length 1. This is what makes "consistent structure, contextual content only" actually true at the code level, not just visually: the same state shape flows into the same composer, the same [`molecules/filmstrip-thumbnail.md`](../molecules/filmstrip-thumbnail.md)-adjacent chip rendering, and the same submit handler dispatch (`src/routes/index.tsx`'s `handleSubmit`, which branches on `mode` only to pick which analysis API to call — see [`patterns/app-state-machine.md`](../patterns/app-state-machine.md)).

`prompt` is sent to the server as `notes` in single-screen mode (now actually wired into `src/server/analyze.ts`'s prompt — this closes the pre-existing dead-end bug documented in `known-issues.md`, where `ConfigPanel`'s old "Specifications" field was collected but never sent) and as `flowGoal` in flow mode. Same field, same UI, two different server-side interpolation points — not two different pieces of client state.

## Compact variant introduced here (not a new atom, a sized-down existing one)

- Attachment tiles are a compact relative of [`molecules/upload-slot.md`](../molecules/upload-slot.md) (72×72px squares, `AttachmentTile` in a wrapping row instead of full-width numbered rows) — same ordinal-badge/remove/reorder concepts, adapted for a much smaller footprint. Reorder controls become left/right (`ChevronLeft`/`ChevronRight`) instead of up/down, since the row is horizontal here rather than vertical.

## Revision history (why the structure doesn't match the first build)

1. **First build**: mode switch as tabs attached to the composer's top edge with a decorative scoop curve; Stack/Device lived inside the box in their own bordered sub-row alongside the mode control; submit was a labeled `GlowButton` ("Analyze UX") sharing the prompt row with the textarea and a conditionally-shown attach button.
2. **Second build**: mode switch reverted to a plain, detached `segmented-control`; Stack/Device moved outside the box into their own toolbar row below it; submit became an icon-only circular button in a dedicated footer row, alongside an always-visible attach button and a (currently inert) voice button — modeled directly on a chat-composer reference (Claude's own message composer) rather than a labeled form control.
3. **Third build**: a consistency pass, not a structural change — the mode toggle and the toolbar's dropdown pills, which had drifted to two different corner radii (16px/6px vs 4px), were both rebuilt on `GlowButton` so they're now the same component with different variants, not independently-matching hand-rolled markup (see `atoms/button.md`). The toolbar pills' leading icon changed from a fixed category glyph to the _selected option's own_ icon (a brand logo per framework for Stack, via `react-icons`), shown before the value rather than the label. The landing page's trust-line KPI row and the hero subtitle paragraph were removed outright, and spacing from the toggle through the toolbar row was tightened.
4. **Fourth build**: the `4px` compact-button radius was bumped to `8px` everywhere `GlowButton` is used (a single change that cascaded correctly to every control built on it — the direct payoff of the third build's consistency pass). The mode toggle moved a fourth time, from its own detached block above the composer into the icon footer row, directly beside the attach button, **losing its wrapping track entirely** (no border/background container). The textarea's static placeholder was replaced with an animated, per-mode typewriter example-prompt overlay (new pattern, see "Typewriter placeholder" above), and the trailing "(optional)" wording is gone along with the static text it was attached to. The tag pill's copy changed ("Something's off. Here's why") and gained a one-off neomorphic inset-shadow treatment (see `foundations/tokens.md`'s Shadow table) — that one isn't part of the composer itself, it's `Landing.tsx`, but it shipped in the same round of feedback.
5. **Fifth build**: the tag pill's leftover border was removed (the inset-shadow from build 4 already reads as a container edge, so the `border-border` outline was redundant — `Landing.tsx`). The mode toggle moved a fifth time, back into a tracked container, but now with the active segment's fill flush against the track (no padding gap) and animated between segments via a shared framer-motion `layoutId` — see `atoms/segmented-control.md`'s "flush-fill tracked toggle" spec; this replaces build 4's track-less version. The typewriter placeholder's timing was slowed (62ms/char type, 32ms/char delete, longer pauses) so it reads comfortably instead of racing. The composer's idle icon-button color (attach, voice) and the toolbar dropdown's `Stack:`/`Device:` label moved from `text-tertiary` to `text-muted-foreground` for consistency with the toggle's own idle-text color — see `foundations/tokens.md`'s "muted-foreground vs. text-tertiary" rule, a token-level fix that also bumped `--text-tertiary` itself lighter for general readability. The hero heading's "UX" word gained a one-off `.text-chrome` 3D/metallic treatment (see `foundations/tokens.md`'s Shadow table) — also `Landing.tsx`, not the composer, but shipped in this round.

6. **Sixth build (current)**: rebuilt as a Claude-style input on shared `composer-parts` (see Structure). Mode moved into a model-picker-style menu at the right of the toolbar; Stack and Device moved from pills under the box into one settings menu inside it; the mic placeholder was dropped; Enter submits. The chat pane's follow-up box now uses the same parts.

All six iterations are real, deliberate product decisions, not one "wrong" and the rest "right" — the lesson for future work here isn't "always match a chat-composer reference," it's that **this specific component changes fast and the docs must track the build, not the original brief**. If you're extending `PromptComposer`, verify against the actual source file before trusting a structural claim in prose — these docs are kept in sync same-day with each iteration, but the next one could happen just as fast.

## Rejected files are never silently dropped

Any file filtered out — wrong type, over the 5MB cap, or over the screen-count cap — surfaces a `toast.error` explaining exactly why, rather than just not appearing with no explanation. This matters more here than it did in the old `UploadZone`/`FlowUploadZone` (which had the same caps but no rejection feedback) because the composer's attach button and the chips row are easy to interact with quickly — a silently-dropped file reads as a bug, not a limit. Any future attach surface should carry the same rule: a cap or filter without user-facing feedback when it triggers isn't finished.

## Switching modes trims attachments to the new cap

If several flow attachments exist and the user switches to `single`, the array is trimmed to its first item (`src/routes/index.tsx`'s `handleModeChange`) rather than left over-cap until the next upload silently replaces it. Any future mode with its own cap should enforce it the same way, at the point of switching — not lazily on next add.

## Superseded components

This organism replaces `UploadZone`/`FlowUploadZone`/`ConfigPanel`/`FlowConfigPanel` as the landing page's actual upload+config surface. Those four component files are **not deleted** — see `known-issues.md` for why (a deliberate, asked-first decision, not an oversight) — but `Landing.tsx` no longer imports or renders any of them. Their own doc pages (`organisms/config-panel.md`, `organisms/upload-zone.md`) are marked superseded rather than removed, since the components and their documented specs still exist on disk and might be revived.

# Pattern → Listen (read the critique aloud)

**Engine**: [`lib/speech-player.ts`](../../src/lib/speech-player.ts) · **UI**: [`ListenPlayer.tsx`](../../src/components/uxcc/ListenPlayer.tsx) (`Speakable`, `ListenBar`) · **Script**: `speechScript` in [`ResultsCanvas.tsx`](../../src/components/uxcc/ResultsCanvas.tsx).

The critique document reads itself aloud, and the page always shows where the voice is.

## Controls

- **Toolbar**: one speaker icon button (lucide `Volume2`) (ghost, 32px, "Listen to this critique"). Pressed = on (`active`, `aria-pressed`); pressing again stops and closes the player.
- **Player**: a floating card pinned to the bottom of the critique panel (`inset-x-3 bottom-3`, max 560px, `bg-bg-elevated/95` + blur, `border-border-strong`, `shadow-elegant`). It enters with a slow 0.3s fade-up.
  - Row 1: caption (12px tertiary, truncates): what's being read ("Summary", "Since v1", "Issue 2 of 5 · title", "What already works", "Next step"), prefixed "Paused ·" when paused, "Finished…" at the end. Then the speed button (`1×`, cycles 0.75 → 1 → 1.25 → 1.5 → 2, remembered per browser) and ✕ (stop).
  - Row 2: back 30s (`RotateCcw` with "30" inside), play/pause (36px filled `bg-foreground` circle, the one solid control), forward 30s (`RotateCw` + "30"), elapsed time, the timeline, total time.
  - Timeline: 4px track (`bg-border`, fill `bg-foreground`) in a 24px hit area. Click or drag to seek; the knob shows on hover/focus/drag. Keyboard: ←/→ 5s, Home/End. `role="slider"` with "0:42 of 3:10" as its value text.
- **Click to read**: while the player is on, every sentence it can read is clickable (faint wash on hover) and reading jumps there. Clicking while selecting text does nothing.

## Read-along highlighting (visibility of status)

- The **sentence** being read: `bg-foreground/[0.08]` wash (grey).
- The **word** being spoken: `bg-primary/25` (the one accent on the page while listening), from the speech engine's word-boundary events.
- Blocks read without their words on screen (the verdict row, the re-check line) get the sentence wash as a whole (`ReadingBlock`).
- The issue being read also lights its pin on the screenshot.
- The active sentence is scrolled to the centre when it leaves the visible area (clear of the toolbar and the player). The document gets `pb-40` while the player is open so the end is never hidden under it.
- Paused keeps the sentence wash, so the user sees where it will resume.

## What's read, in page order

Title → "Score N out of 100: verdict." → summary → "Since vN" (re-checks) → for each issue: "Issue 1, critical." + title, problem, "Why it matters:" + why, "The fix:" + solution → what already works (titles) → the closing next step. The spoken glue ("Issue 1, critical.", "Why it matters:") is a segment's `lead`: spoken, never highlighted. Everything else is exactly the text on screen, split into sentences by the same `splitSentences` on both sides, so the highlight always lines up.

## Engine: free, built into the browser

- The Web Speech API (`speechSynthesis`): no key, no server, no cost.
- Voice: the best English voice on the device ("Premium"/"Enhanced"/"Natural" first, then Google US English, then Samantha, Ava, Daniel…).
- One sentence per utterance (Chrome stops long ones after ~15s). Pause cancels and resume restarts the current sentence (native pause is unreliable). A speed change restarts the current sentence at the new speed.
- **Times are estimates** (~165 words/min at 1× plus a short breath per sentence): the API reports no durations. Skipping ±30s and seeking jump to the sentence at that time.
- Switching versions or closing the panel stops it. Hidden when the browser has no `speechSynthesis`.
- **Limits**: voice quality varies by device; some voices (Safari's older ones) send no word events, so only the sentence wash shows.
- **Upgrade path** for consistent quality: server TTS (OpenAI `gpt-4o-mini-tts`) or Kokoro-82M in the browser. Keep the segment script and highlighting; real audio durations would make the times exact.

## Rules

- One entry point (the toolbar icon); every other control lives in the player. Icons only, each with an `aria-label` and a tooltip.
- Read what's on the page, in page order. Never read text that isn't shown, beyond the short spoken glue.
- Greys for everything except the spoken word.

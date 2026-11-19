# Organism → Use-case scroller

> **Superseded (Nov 2026)** by [`why-different.md`](why-different.md). The section was removed from the landing; kept for reference.

## 1. Overview

**File**: `UseCases` in [`src/components/landing/Audience.tsx`](../../src/components/landing/Audience.tsx).

Five use cases told by scrolling instead of tabs: the section pins under the nav, and as you scroll each case takes over the stage. Each case is a **before → after** on one mini screen, built to be understood in two or three seconds: the problem is named above the screen, a pin marks it on "Before", then a divider wipes across to reveal "After" and the fix line lights up. The earlier version (chat prompt + subtle in-place change) asked the reader to spot small differences, so it didn't land in the time a case is on screen. It replaced `PillTabs`, which hid four of the five cases behind clicks, and then a text-only card that read as a wall of copy.

## 2. Tokens

- Track: `N × 70vh` tall; sticky content `top: 112px`, two equal columns, `gap-6`, fixed height `min(580px, 100svh − 150px)` so both sides match; the list ends with a "03 / 05 · Keep scrolling" footer and the stage card's mini screen grows to fill.
- Rows: 12px tabular index, Forum 26px label; inactive `text-text-tertiary`, active `text-foreground`; the active row opens to a `TYPE.title` (18px sans 600) + `TYPE.body` (15px muted); rule `h-px bg-border` filled with `bg-foreground` (`scaleX`).
- Stage, top to bottom: the problem (severity number + 15px semibold title + severity and principle at 12px); the compare screen (`rounded-2xl border-border bg-bg-tertiary`, fills the card on desktop, 230px on mobile); the fix line (check + "Fix: …" 14px), at 45% opacity until "After" shows.
- Compare: two stacked copies of the mini screen, each its own stacking context (`isolate`) so nothing from "Before" shows through. "After" is clipped `inset(0 (100 − p)% 0 0)` and `p` animates 0 → 100; a 1px `bg-foreground` divider with a round ⇔ handle rides the edge. Chips: "Before" top-right (outlined), "After" top-left (filled). On the desktop stage the mini screens render at `zoom: 1.3`.
- Mini screens (greyscale, the difference visible at a glance): empty dashboard "No data" → guided empty state with "Create project"; three equal plans → "Recommended" plan lifted, the others faded; washed-out sign-in with a "1.6:1 Fail" chip → readable with "7.2:1 Pass"; signup flow ending on a "?" → ending on "Start first project"; three mismatched buttons → one consistent set.
- Pin: 20px, `SEVERITY_FILL`, pulsing, on the element at fault in "Before"; the same spot carries a `bg-foreground` check in "After".

## 3. Anatomy & variants

```
md+   01 Before you ship  ─────────      ┌ Card ─────────────────────────────┐
      02 Conversion audit                │ ① Problem title · severity · rule │
         title + body (active, open)     │ ┌ After ──────┃────── Before ┐ │
      ───────────                        │ │  fixed      ⇔   faulty ①    │ │
      03 Accessibility pass              │ └─────────────┃──────────────┘ │
      04 Flow review                     │ ✓ Fix: one line                   │
      05 Design QA                       └──────────────────────────────────┘
< md  label + title, then the same stage, stacked five times (no pinning)
```

## 4. States & interactions

| Interaction    | Behaviour                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Scroll         | `useScroll` on the track (`start 112px` → `end end`); active = `floor(progress × 5)`                                                |
| Row rule       | Fills across its own fifth of the progress; passed rows stay full                                                                   |
| Change         | Stage crossfades (out y −10 / blur 6px, in y 14 → 0, 0.3s); the active row opens                                                    |
| Stage loop     | Before 1.5s (pin pulses) → wipe to After 1.1s (`ease [0.65,0,0.35,1]`) → hold 2.4s with the fix line lit → reset. Runs only in view |
| Row click      | Smooth-scrolls to the middle of that row's fifth                                                                                    |
| Reduced motion | No loop; the divider rests at 50%, showing after on the left and before on the right, fix line lit                                  |

## 5. Accessibility

- Rows are buttons; the active one has `aria-current="step"`.
- Pins are `aria-hidden`; the finding card carries the same information as text.
- All five cases exist in the DOM on mobile.

## 6. Content guidelines

- Label: 2–3 words. Title: one sentence. Body: under 30 words. Finding title: the problem in under 7 words. Fix: one line. The mini screen's before and after must differ in something you can see from across a room (a missing button, a lifted card, faded vs. dark text), never in small text alone.

## 7. Anti-patterns

- An `overflow-hidden` / `overflow-auto` ancestor around the track: it breaks `position: sticky`.
- Colour in the mini screens beyond the severity pin and the one error border.
- Adding cases beyond about six: the track gets long enough to feel like a trap.

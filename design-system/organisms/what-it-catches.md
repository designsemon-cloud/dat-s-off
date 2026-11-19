# Organism → What it catches

**File**: `WhatItCatches` in [`src/components/landing/Capabilities.tsx`](../../src/components/landing/Capabilities.tsx). It sits right after Why Dats Off. (`#what-it-catches`).

**History (Nov 2026):** the carousel, with its chips, arrows and snap track, became a plain **3 × 2 grid**. Each card got a dark "stage" whose loop reads as marketing, not as a wireframe.

## Anatomy

```
Eyebrow · H2 "The stuff users feel, but can't name" · lede
┌ Card ───────────────┐ ┌ Card ───────────────┐ ┌ Card ───────────────┐
│ ┌ stage 208px ────┐ │ │                     │ │                     │
│ │   loop          │ │ │                     │ │                     │
│ │ (● status chip) │ │ │                     │ │                     │
│ └─────────────────┘ │ │                     │ │                     │
│ icon · title        │ │                     │ │                     │
│ body                │ │                     │ │                     │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
   … second row of three
```

- **Grid**: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`. Each card is wrapped in `BlurIn`, staggered by column, plus the landing `card` scroll effect.
- **Card**: the landing `Card` (`p-2`); below the stage sit an `IconBadge`, a `TYPE.title` and a `TYPE.body`.
- **Stage**: themed with the same stage tokens as the Why Dats Off. films (`--st-*`, see [`why-dats-off.md`](why-dats-off.md)): light in light mode, dark in dark mode. It has an 18px radius and the same light: a radial top glow and a masked 24px grid. On hover, a 220px **spotlight** follows the pointer (`--mx` / `--my`).
- **Status chip** (`StageNote`): a glass pill in the stage's bottom-left corner. Its dot is orange while the stage shows the problem and white once fixed, and its text blurs across between the two.

## The loops

Every loop runs only while the card is half visible (`useLoopStep`).

| Kind           | Loop                                                                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrast       | A dim "Aa" with jittering red/cyan chromatic layers snaps to crisp white with a glow. The ratio bar fills, and the chip counts 1.9:1 → 12.6:1 "AA pass".                                                               |
| Tap targets    | Radar pings around a 24px button; it springs to the dashed 44px guide with a tap ripple. A redline beside it measures 24px (orange) → 44px.                                                                            |
| Hierarchy      | Four equal glass buttons. "New event" becomes the white primary with a sheen and a glow, and the rest step back.                                                                                                       |
| UX copy        | "Submit" is struck through in orange, then text-scrambles into "Create account" while a light runs the button's border.                                                                                                |
| States         | "Save changes" → a conic spinner, "Saving…" → a glowing check, "Saved", with a ring burst and a "Changes saved" toast.                                                                                                 |
| Flow dead ends | Three screens on a flowing dashed path with a walker dot. The last one flags orange with an ✕ and a shake. Then a way back draws from it to step 2, with the walker following it. The fixed state holds twice as long. |

Colour: greys and the stage ink (`--st-fg`). Orange only on the problem. The red/cyan split is an effect, never a status: it blends with `screen` on dark and `multiply` on light.

## Behaviour

- No autoplaying track and no controls: every card loops on its own while it's on screen.
- Reduced motion: each stage shows its fixed state; the radar and the flowing path stop (`.catch-radar`, `.catch-dash`).

## Anti-patterns

- Back to a carousel, or chips and tabs to pick a kind.
- Colours for status beyond orange-for-problem.
- More than six kinds, or stages that need reading to follow.

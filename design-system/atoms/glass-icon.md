# Atom → Glass icon

**File**: [`src/components/uxcc/GlassIcon.tsx`](../../src/components/uxcc/GlassIcon.tsx), styled by `.glass-icon` in `styles.css`.

A small app-icon tile, like a favicon, made of clear liquid glass with a chromatic rim, holding one lucide icon. It's for the one place that should catch the eye without using orange: the **"Rate this review"** FAB, a 52px round tile with no text (see [`feedback.md`](../patterns/feedback.md)).

## Anatomy

- **Tile**: 28px by default, a 9px-radius squircle. `round` makes it a circle, with a 1.5px rim and a softer, deeper lift; the feedback FAB uses it at 52px.
- **Glass**: a white top-left specular pool over a translucent diagonal fill, with `backdrop-filter: blur(8px) saturate(180%)`. Inset highlights sit at the top and a soft lift below. The dark theme uses the same recipe at lower alpha.
- **Chromatic rim** (`::before`): a 1px conic ring of machined metal, masked to the edge: copper `#c8692f`, champagne `#f6e3c3`, titanium `#8a93a6`, gunmetal `#2f343f`, steel `#b7c0cf` and warm copper `#e7a06a`. The inner glow (`::after`) uses the same hues at about 30% alpha. Muted metallic tones, not a rainbow: the user turned down both a saturated rainbow ("common") and an iridescent pearl palette.
- **Inner glow** (`::after`): the same hues, blurred and faint, under the icon.
- **Icon**: 44% of the tile's size, `strokeWidth` 2, foreground colour.

## Behaviour

- The rim's hues turn slowly: `--gi-angle` goes 0 → 360° over 8s, an `@property` animation. Under reduced motion they hold still.
- It is decorative (`aria-hidden`); the label next to it carries the meaning.

## Rules

- Use it at most once per view, and never on a primary action: the orange CTA stays the one emphasis.
- The chromatic rim is the only multi-colour element outside the films. Don't spread it to status or severity.

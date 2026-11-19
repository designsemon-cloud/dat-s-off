# Organism → Footer

## 1. Overview

**File**: `Footer` in [`src/components/landing/Closing.tsx`](../../src/components/landing/Closing.tsx).

A centred footer following the user's reference (logo, tagline, a row of large links, a small row with dividers, ©), signed off by a full-width glossy "Dats off." wordmark.

## 2. Tokens

- Column: `COLUMN`, centred text, `pt-20`.
- Tagline 16px `text-muted-foreground`, `max-w-[420px]`.
- Section links 17/18px medium `text-muted-foreground` → `hover:text-foreground`, `gap-x-8 sm:gap-x-10`.
- App links 13px `text-text-tertiary`, separated by `h-3 w-px bg-border-strong` dividers.
- Wordmark: sans bold, `text-[29vw] leading-[0.8] tracking-[-0.065em]`, `.gloss-text` (see [`tokens.md`](../foundations/tokens.md)).

## 3. Anatomy & variants

```
              Dats off.
   A senior UX critique for any screenshot…
 Examples   How it works   Use cases   Resources   Pricing   FAQ
   New critique | Library | Samples | Settings
              © 2026 Dats Off.
██████████████ Dats off. (full width, fading down) █████████████
```

## 4. States & interactions

- The wordmark's sheen sweeps from the left to about 60% across as the footer scrolls in (`useScroll`, `start end` → `end end`); under reduced motion it rests there.
- The footer is `overflow-hidden`, so the wordmark is cropped by the page end.

## 5. Accessibility

- Links sit in `<nav aria-label="Footer">`.
- The wordmark is `aria-hidden` and `select-none`; the brand is already announced by the logo.

## 6. Content guidelines

- Link only to real sections and pages. No placeholder Terms / Privacy until those pages exist.

## 7. Anti-patterns

- Coloring "off." orange in the wordmark: the page already spends its accent above.
- Using `.gloss-text` elsewhere: it's a one-off sign-off, not a heading style.

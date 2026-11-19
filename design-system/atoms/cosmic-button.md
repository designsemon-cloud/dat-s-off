# Atom → Cosmic button & Solid button

## 1. Overview

**File**: [`src/components/ui/cosmic-button.tsx`](../../src/components/ui/cosmic-button.tsx). The landing page's only two button components, sharing one API so every CTA lines up.

- `CosmicButton` (primary): adapted from cult-ui's [Cosmic Button](https://www.cult-ui.com/docs/components/cosmic-button) (MIT). A raised neutral button inside an orange ring. **At rest** the ring keeps its width and only its colour moves: a soft, lighter band drifts slowly along close orange shades. **On hover** the ring grows 2px outward (the original cult-ui interaction). History: v1 spun a light-to-dark conic fast (busy); v2 slowed it, but the rotating conic made the resting border look like it thinned and thickened; v3 replaced rotation with the drift but also dropped the hover growth, which wasn't asked for; v4 (current) restores the hover growth.
- `SolidButton` (secondary): filled with the text colour, black in light mode and white in dark. Shares the hover language: a soft ring grows out of its edge.

**The product's one primary button, landing and app alike.** Landing: nav "Open app" (cosmic `sm`), "Critique your screenshot", pricing CTAs, final CTA. App:

- `GlowButton`'s `primary` variant is the cosmic look at the app's compact size ([`button.md`](button.md));
- the composer's send button is a cosmic square;
- the sample bar's "Critique yours" and the empty library's "New critique" are `CosmicButton as="link" size="sm"`.

The ring, surface and focus classes are exported (`COSMIC_RING`, `COSMIC_SURFACE`, `COSMIC_FOCUS`) so every primary shares them.

## 2. Tokens

|              | `sm`                                    | `md`                                          |
| ------------ | --------------------------------------- | --------------------------------------------- |
| Cosmic ring  | `p-[2px] rounded-[11px]`                | `p-[3px] rounded-[15px]`                      |
| Cosmic inner | `h-8 rounded-[9px] px-3.5`, 14px medium | `h-11 rounded-[12px] px-6`, 15px semibold     |
| Solid        | `h-9 rounded-[11px] px-4`, 14px medium  | `h-[50px] rounded-[15px] px-6`, 15px semibold |

- Ring: an `aria-hidden` span behind the inner surface, `absolute inset-0`, showing through the outer padding (2px / 3px). Hover: `inset-[-2px]`, radius +2px, `brightness-110`, 0.5s ease-out. Fill: `.cosmic-border` in `styles.css`: `linear-gradient(90deg, #EA580C, #EC631B 28%, #F39256 50%, #EC631B 72%, #EA580C)`, `background-size: 200% 100%`, repeating, `background-position` 0% → -200% over 6s linear (seamless loop, left to right).
- Cosmic inner: `bg-bg-tertiary text-foreground` with the source's inset highlight + soft drop shadow (dark variants included).
- Solid: `bg-foreground text-background`; hover `box-shadow: 0 0 0 3px color-mix(foreground 18%)`, 0.5s ease-out.

## 3. Anatomy & variants

Props: `size` (`sm` | `md`, default `md`), `className` (outer, e.g. `w-full`), `innerClassName` (cosmic surface), and one of:

- `href` → `<a>`
- `as="link" to params` → TanStack `<Link>`
- `as="button"` → `<button type="button">`

## 4. States & interactions

| State          | Cosmic                                                               | Solid                                                           |
| -------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| Rest           | Light band drifts along the border (6s)                              | Static                                                          |
| Hover          | Ring grows 2px outward and brightens slightly (0.5s); shadow deepens | A 3px halo in its own colour (18%) grows out of the edge (0.5s) |
| Active         | Inner scales 0.98                                                    | Scales 0.98                                                     |
| Focus          | `ring-2 ring-primary`, offset                                        | `ring-2 ring-foreground`, offset                                |
| Reduced motion | Border holds still                                                   | —                                                               |

## 5. Accessibility

- Cosmic text is foreground on a white / dark surface; Solid is background on foreground. Both pass AA in both themes.
- The ring span is `aria-hidden`; give icon-only uses an `aria-label`.

## 6. Content guidelines

- Verb-first, 2–3 words: "Critique your screenshot", "Get started", "Open app".

## 7. Anti-patterns

- Hand-rolled button classes in landing sections: use these two.
- Rotating the gradient, or changing the ring's width at rest: at rest only colour moves. Width changes belong to hover.
- High-contrast border colours or a fast drift: keep the shades close and the loop slow.
- Two cosmic buttons competing in one viewport (the nav one is small and sits apart).

## Clipping (hover ring and shadow)

The ring grows 2px outward on hover, and the raised surface casts a soft shadow about 24px wide. A parent that clips its overflow cuts both into a hard edge, so the button looks wrapped in a box.

- **Height reveals** share one `Reveal` component in [`src/lib/reveal.tsx`](../../src/lib/reveal.tsx): an issue's body, the collapsibles and Keep learning (`ResultsCanvas`), the feedback form's "tell us more" step (`FeedbackWidget`), the sign-up name field (`AuthModal`) and `FixCard`. It clips only while it animates and sets `overflow: visible` once open, including when it mounts already open (`AnimatePresence initial={false}`). It's a component, not a variants spread, because framer resolves `height: "auto"` with its own `transitionEnd` and drops a `transitionEnd: { overflow }` of ours. The feedback card itself no longer has `overflow-hidden`.
- **Don't add `overflow-hidden` to a box just for its rounded corners** when nothing inside overflows. The "One prompt for all the fixes" box was one of these. An audit (Playwright: compare every `.cosmic-border` button's grown ring, and a 14px shadow margin, with every clipping ancestor) is clean on the landing, the app, its dialogs, and both sample critiques, at 1440px and 390px.

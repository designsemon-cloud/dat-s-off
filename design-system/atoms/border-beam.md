# Atom → Border beam

**Package**: [`border-beam`](https://www.npmjs.com/package/border-beam) `1.4.1`, the engine behind cult-ui's [Border Beam Card](https://www.cult-ui.com/docs/components/border-beam-card) and [Border Beam Button](https://www.cult-ui.com/docs/components/border-beam-button). The old hand-rolled CSS beam (`src/components/ui/border-beam.tsx`) is gone.

**What it is**: a soft light that travels around an element's edge. It says "this is the special thing here". It's rare on purpose: two places in the whole product.

## Where it's used (and nowhere else)

| Where                                  | Component                                                                 | Settings                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App: the "What's off" tile in the chat | [`ChatPane.tsx`](../../src/components/uxcc/ChatPane.tsx) → `CritiqueTile` | `size="md"`, `colorVariant="sunset"`, `borderRadius={24}` (must equal the tile's own corner: `rounded-2xl` is 24px in this theme; at 16 the light traced a tighter shape and read as a second container at the corners), `duration={3.2}`, `strength={0.75}`, `theme` follows the app. **`active={!open}`**: it runs only while the review is closed. The tile's whole job is "open me", and once the panel is open the beam stops. |
| Landing only: special chips            | [`landing/BeamChip.tsx`](../../src/components/landing/BeamChip.tsx)       | `size="sm"`, `colorVariant="sunset"`, pill radius, `duration={3.4}`, `strength={0.8}`. Today: the hero's "5 free reviews, no sign-up" and Pricing's "Save $21".                                                                                                                                                                                                                                                                     |

## Rules

- `BeamChip` is **landing only**. Never use it in the app, where chips are plain (`AccountKit` → `Chip`).
- Inside the app, the beam lives only on the tile, and only in its default (closed) state. It no longer marks "Fix it, then re-check": that card is plain.
- At most one or two per screen. If everything glows, nothing does.
- Sunset (warm) only: it sits next to our orange. Never the colourful variants.
- Reduced motion: the package stops the animation.
- **`borderRadius` must match the wrapped element exactly.** Check the token, not the class name: `rounded-2xl` is 24px here, not Tailwind's default 16px. A mismatch shows as a second outline at the corners.

# Foundations → Typography

## Fonts

| Token                              | Stack                                                                               | Use                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--font-display` (`.font-display`) | `"Forum", Georgia, serif`                                                           | Display headings (H1, H2, statements), big numbers (scores, stats, prices), use-case labels. Not card titles    |
| `--font-sans` (default)            | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Everything else: body, labels, buttons, inputs                                                                  |
| `--font-mono` (`.font-mono`)       | `ui-monospace, "SF Mono", Menlo, Consolas, monospace`                               | App only: fix-prompt code blocks. **Never on the landing page**: numbers there use the sans with `tabular-nums` |

**Forum** (Google Fonts, loaded in [`__root.tsx`](../../src/routes/__root.tsx)) replaced Utopia / Source Serif 4 at the user's request. It ships **one weight (400)**, so `.font-display` sets `font-synthesis-weight: none` (a `font-semibold` on a display element renders at 400 instead of a smeared fake bold), **`letter-spacing: 0`** and a compact **`line-height: 1.05`**, both `!important` so no utility can loosen them. Forum runs small, so display sizes went up a step: section H2 34/44px, hero 46/72px.

## Landing type system

Every piece of landing copy uses one role from [`src/components/landing/type.ts`](../../src/components/landing/type.ts) (`TYPE.*`). Don't write raw `text-[..px]` classes for marketing copy; mock UI inside demo cards is exempt, because it imitates a product screen.

Hierarchy comes from three levers used together, so no two levels look alike:

1. **Family and size**: Forum carries the display voice (H1, H2, statements, big numbers). Everything you read is sans.
2. **Weight**: Forum has one weight, so card-level titles switch to **sans 600** to stand apart from both the display headings above and the 400 body below. Labels are 500.
3. **Ink**: `foreground` for headings, titles and numbers; `muted-foreground` for ledes, body and lists; `text-tertiary` for labels, ordinals and captions. Because muted and tertiary are close in value (both must pass AA on the grey paper), the third tier is also smaller (12–13px), so it never relies on colour alone.

| Level | Role (`TYPE.`) | Family               | Size (mobile → sm)  | Weight  | Ink                          | Used for                                                                                                     |
| ----- | -------------- | -------------------- | ------------------- | ------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1     | `hero`         | Forum                | 46 → 72             | 400     | foreground, glossy           | Hero H1                                                                                                      |
| 1     | `closing`      | Forum                | 40 → 60             | 400     | foreground, glossy           | Final CTA H2                                                                                                 |
| 2     | `section`      | Forum                | 34 → 44             | 400     | foreground, glossy           | Section H2 (via `Section`)                                                                                   |
| 2     | `statement`    | Forum                | 30 → 38, lh 1.2     | 400     | scrubs tertiary → foreground | "Why Dats Off." statement                                                                                    |
| 2     | `number`       | Forum                | 48, lh 1            | 400     | foreground                   | Stats, prices                                                                                                |
| 3     | `lede`         | sans                 | 16 → 18, lh 1.6     | 400     | muted                        | One-line subtitle under an H1/H2                                                                             |
| 4     | `title`        | sans                 | 18, lh 1.3, −0.01em | **600** | foreground                   | Card, step, plan, persona, use-case and FAQ titles                                                           |
| 5     | `body`         | sans                 | 15, lh 1.6          | 400     | muted                        | Card descriptions, plan descriptions, FAQ answers, footer blurb                                              |
| 6     | `list`         | sans                 | 14, lh 1.5          | 400     | muted                        | Checklists, stat labels, notes inside cards. Pricing features use 15 / foreground: they are the plan's offer |
| 7     | `label`        | sans                 | 13                  | 500     | tertiary                     | Eyebrows (with the orange dot)                                                                               |
| 7     | `index`        | sans, `tabular-nums` | 12                  | 500     | tertiary                     | Ordinals: "01", "Pass 1"                                                                                     |
| 7     | `caption`      | sans                 | 13                  | 400     | tertiary                     | Fine print under CTAs, "/month"                                                                              |

Rules:

- One level-1 or level-2 display heading per section, and only `Section` renders H2s.
- A card has at most: one `index`, one `title`, one `body`, then `list` items. Never two titles of the same level in one card.
- Don't set a card title in Forum: Forum at card size (24–28px) carried the same visual weight as the lede and the body, which is what flattened the page. The one Forum list is the use-case scroller's labels (26px), which act as a large index, not as card titles.
- Ink steps down one tier at a time inside a block: title (foreground) → body (muted) → caption (tertiary). Don't put muted text above foreground text in the same block.

## App scale

The app (`/app`) keeps the dense DS scale 12 / 14 / 16 / 18 / 24 / 32: 14px is the default UI text, 12px for metadata; card titles are `text-[14px] font-semibold text-foreground`; field labels `text-[12px] font-medium text-text-tertiary` (see [`section-label.md`](../atoms/section-label.md)). Weights: 400 body, 500 interactive labels, 600 headings and titles, 700 only for numbers inside pins and avatars.

## Case

Sentence case for everything: headings, buttons, tabs, labels, badges. No `uppercase`, no `tracking-wider`. Acronyms keep their capitals (UX, CTA, WCAG, PDF).

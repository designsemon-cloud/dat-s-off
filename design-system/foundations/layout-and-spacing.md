# Foundations → Layout & Spacing

## Grid

Base unit **4px** (Tailwind's default scale: `1` = 4px). Use the scale; avoid half steps (`2.5`, `3.5`) in new work except where they already exist inside dense app controls.

Prefer `gap` on the parent over margins between siblings.

## Landing page

- **Page column: 960px**, one width for every landing section: `COLUMN` (`mx-auto w-full max-w-[960px]`) from `landing/primitives.tsx`. `Section`, the tools row, the Why statement and the footer all use it, so every section's left edge lines up. There is no wide variant any more (the old 800 / 1100 split made "Why" and "Real output" visibly different widths). Headers stay left-aligned; ledes cap at 560px for reading.
- **Full-bleed exceptions**: the hero and final CTA scenes, and the footer wordmark, which spans the viewport.
- **Wide exception**: the product demo in "Real output" is `min(1200px, 100vw − 32px)` wide, centred past the column, so the app window inside is big enough to read. Its header and CTA row stay in the column. Nothing else goes wide.
- **Full-bleed scenes** (hero, final CTA): no panel, the engraving sits directly on the page grain; copy is centred in the drawing's open area (`max-w-[720px]` hero, `max-w-[620px]` CTA). See [`scenery.md`](../organisms/scenery.md).
- **Section rhythm**: `py-16 sm:py-24` (tightened Nov 2026 to shorten the page); header → content gap `mt-12`.
- **Tiles**: `Tile` at `h-20 sm:h-24`, `grid-cols-3 sm:grid-cols-6 gap-3`.
- **Card padding**: `p-6` (mobile) / `md:p-8` for feature cards; `p-5`–`p-6` for compact cards; `p-4` inside mock frames.
- **Card grids**: `gap-4`; two columns from `sm`/`md`, with a full-width third card (`md:col-span-2`) for a step that needs a wider mock.
- **Gutter**: `px-4 sm:px-6` around sections; the nav floats `top-3 sm:top-4` with `px-3 sm:px-5`.

## App shell

- Sidebar 260px (collapses to a 60px rail), top bar 48px, chat pane + results canvas. See [`app-shell-template.md`](../templates/app-shell-template.md).
- Panels: `p-4` standard, `p-3` dense, `p-6` modals.
- Major blocks `gap-4`/`gap-5`; related small items `gap-2`.

## Responsive

Plain Tailwind prefixes (`sm:`, `md:`, `lg:`) and container queries (`@container`, `@4xl:`) in `className`. No JS breakpoint hooks. Every page must work at 390px wide with no horizontal scroll; tab rows that can overflow scroll horizontally inside a `-mx-4 px-4` bleed.

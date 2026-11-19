# Foundations → Color, Radius, Elevation & Grain

**Source of truth in code:** [`src/styles.css`](../../src/styles.css): CSS variables on `:root` (light) and `:root.dark` (dark), exposed to Tailwind through `@theme inline`. Components use Tailwind token classes (`bg-bg-tertiary`, `text-muted-foreground`, `border-border`). Never write a raw hex, `rgb()`, `oklch()` or Tailwind palette color (`text-green-400`) in a component.

## Theme model

- **Light is the source theme and the default.** It's a direct mapping of the IdeaApe palette.
- **Dark is derived**: the same roles with inverted luminance, applied by the `dark` class on `<html>`.
- The choice is stored in `localStorage["datsoff-theme"]`. An inline script in `<head>` ([`__root.tsx`](../../src/routes/__root.tsx), `THEME_INIT_SCRIPT` from [`lib/theme.ts`](../../src/lib/theme.ts)) applies it before first paint, so there's no flash. Users switch with [`ThemeToggle`](../atoms/theme-toggle.md).
- Tailwind's `dark:` variant is wired to the class (`@custom-variant dark (&:is(.dark, .dark *))`). You should rarely need it: tokens already flip.

## Color tokens

| Token (class)                                                      | Light          | Dark           | Role                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------ | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--background` (`bg-background`)                                   | `#F3F3F5`      | `#111214`      | Page                                                                                                                                                                                                                                                                                        |
| `--bg-secondary` (`bg-bg-secondary`)                               | `#F9F9FA`      | `#16171A`      | Hero panel, sidebar, image wells, mock frames                                                                                                                                                                                                                                               |
| `--bg-tertiary` (`bg-bg-tertiary`)                                 | `#FFFFFF`      | `#1C1D20`      | Cards, popovers, inputs                                                                                                                                                                                                                                                                     |
| `--bg-elevated` (`bg-bg-elevated`)                                 | `#F3F3F5`      | `#26282C`      | Hover and selected fills inside cards                                                                                                                                                                                                                                                       |
| `--foreground` (`text-foreground`, `bg-foreground`)                | `#1E2022`      | `#F3F3F5`      | Primary text; the black (light) / white (dark) button                                                                                                                                                                                                                                       |
| `--muted-foreground`                                               | `#5B616E`      | `#B6BAC2`      | Body copy, idle state of interactive labels and icons                                                                                                                                                                                                                                       |
| `--text-tertiary`                                                  | `#6B7280`      | `#8E949E`      | Captions, metadata, timestamps. Never for anything with a hover state                                                                                                                                                                                                                       |
| `--primary`                                                        | `#EA580C`      | `#FF6C0A`      | The accent: primary CTA, critical severity, focus ring, accent phrase                                                                                                                                                                                                                       |
| `--primary-hover` (`bg-primary-hover`; `primary-glow` is an alias) | `#FF6C0A`      | `#EA580C`      | Accent hover                                                                                                                                                                                                                                                                                |
| `--primary-foreground`                                             | `#FFFFFF`      | `#FFFFFF`      | Text on orange                                                                                                                                                                                                                                                                              |
| `--learn` (`text-learn`, `bg-learn/…`)                             | `#4F46E5`      | `#A3ABFF`      | The learning accent (Nov 2026), and only that: links to articles and videos in the critique (the Learn line) and the Keep learning shelf's tint. Cool on purpose, so it never reads as the orange primary. 6.4:1 on `--bg-secondary`. See [`patterns/learning.md`](../patterns/learning.md) |
| `--border`                                                         | `#D8DBDF`      | `#2E3035`      | Default hairline                                                                                                                                                                                                                                                                            |
| `--border-strong`                                                  | `#CFD2D6`      | `#3D4047`      | Hover / emphasized border, rules, eyebrow line                                                                                                                                                                                                                                              |
| `--mock-glow`                                                      | `#EA580C` @ 9% | `#FF6C0A` @ 5% | The faint glow at the bottom of a `MockFrame`                                                                                                                                                                                                                                               |
| `--surface-card`                                                   | `#F9F9FA`      | `#16171A`      | Textured landing card fill (`.surface-card`)                                                                                                                                                                                                                                                |
| `--surface-edge`                                                   | `#FFFFFF`      | white @ 6%     | The card's inset hairline edge                                                                                                                                                                                                                                                              |
| `--ink` (`bg-ink`)                                                 | `#1E2022`      | `#8E949E`      | Ink of the engraved scenery masks (dimmed in dark so the hatching doesn't glare)                                                                                                                                                                                                            |

`--destructive` maps to `--primary`: in a one-accent system, errors and destructive actions use orange plus an explicit label or icon, never color alone.

### Severity

Severity is carried by **one accent plus grey weight**, not by hue (v1's red / orange / green set is gone):

| Token               | Light     | Dark      | Pin / chip treatment                                     |
| ------------------- | --------- | --------- | -------------------------------------------------------- |
| `--severity-high`   | `#EA580C` | `#FF6C0A` | Orange fill, white number; label "Critical" in orange    |
| `--severity-medium` | `#5B616E` | `#B6BAC2` | Dark grey fill, page-colored number; label in foreground |
| `--severity-low`    | `#CFD2D6` | `#3D4047` | Light grey fill, foreground number; label in tertiary    |

The maps live in one place: `SEVERITY_FILL` / `SEVERITY_TEXT` / `scoreTone` in [`AnnotatedScreenshot.tsx`](../../src/components/uxcc/AnnotatedScreenshot.tsx). Scores below 60 use the accent; otherwise foreground. Wins and success use `text-foreground` with a check icon, not green.

### Selected states without color

Selected chips, tabs and options use the **text color as the fill**: `border-foreground bg-foreground text-background` (black in light, white in dark). Selected cards (plan pickers) use `border-foreground bg-bg-elevated`. Orange is not a selection color.

## Radius scale

From the DS set 12 · 14 · 16 · 18 · 24 · full:

| Class                        | Value | Use                                                           |
| ---------------------------- | ----- | ------------------------------------------------------------- |
| `rounded-sm`, `rounded-md`   | 12px  | Compact controls, chips, tab segments, inline buttons         |
| `rounded-lg`                 | 14px  | CTA buttons, the nav pill, pill-tab tracks (DS button radius) |
| `rounded-xl`                 | 16px  | Inner panels: mock frames, nested wells, list rows            |
| `rounded-2xl`, `rounded-3xl` | 24px  | Cards and large panels                                        |
| `rounded-full`               | 100%  | Pins, avatars, badges, icon buttons                           |

18px is in the DS set but has no class yet; add `--radius-*` in `styles.css` before using it. Nest radii concentrically: a 16px frame inside a 24px card, a 12px segment inside a 14px track.

Compact buttons built on `GlowButton` still set `style={{ borderRadius: "12px" }}` inline (see [`atoms/button.md`](../atoms/button.md)); the value follows the scale.

## Elevation

| Utility          | Light                                                       | Dark                                | Use                                            |
| ---------------- | ----------------------------------------------------------- | ----------------------------------- | ---------------------------------------------- |
| `shadow-sm`      | `0 0 0 1px rgba(227,226,224,.5), 0 2px 4px rgba(0,0,0,.04)` | ring at white 4%, drop at black 30% | Cards, nav pill, CTA buttons (DS `shadow-sm`)  |
| `shadow-elegant` | ring + `0 16px 40px -12px` soft drop                        | same, darker                        | Popovers, dropdowns, pins, floating thumbnails |

`shadow-glow` remains as an alias of `shadow-sm` for old call sites; don't use it in new work. No colored glows.

## Grain & textured surfaces

`.bg-grain` adds an SVG-noise layer through `::before`: `background-image: var(--grain-image)` at `--grain-opacity` (7.5% light, 7% dark) on the page. Inside textured cards (`.surface-card.bg-grain`) it uses the stronger `--card-grain-opacity` (16% light, 11% dark), so the paper texture reads on the card itself. It's on the landing page background and on every landing card and tile, nowhere in the app.

`--grain-image` is theme-aware: the light theme uses dark specks, the dark theme white specks (the same `feTurbulence` SVG with a different `feColorMatrix`). Dark specks on dark paper are invisible, which is why the card grain used to disappear in dark mode.

| Token                                            | Light                             | Dark                              | Role                                                                |
| ------------------------------------------------ | --------------------------------- | --------------------------------- | ------------------------------------------------------------------- |
| `--gloss-top` / `--gloss-mid` / `--gloss-bottom` | `#4B5058` / `#1E2022` / `#9AA0A9` | `#B6BAC2` / `#6B7079` / `#2F3237` | Body gradient of `.gloss-text`, fading to transparent at the bottom |
| `--gloss-reflect`                                | white 22%                         | white 18%                         | Top-half reflection layer                                           |
| `--gloss-sheen`                                  | white 55%                         | white 85%                         | Diagonal sheen band, moved by `background-position`                 |

`.gloss-text` clips those three layers to the text (`background-clip: text`). Only the footer wordmark uses it.

`.gloss-heading` is the readable variant for section titles, the hero and the logo: `--gloss-h-top / -mid / -bottom` (`#5B616E / #1E2022 / #3A3E44` light, `#FFFFFF / #D6D9DE / #9AA0A9` dark), no bottom fade, `box-decoration-break: clone` so every wrapped line gets the full gradient. `.gloss-hover` sweeps the sheen on hover (the logo).

`.surface-card` is the IdeaApe card: `--surface-card` fill, a 1px top highlight (`--surface-highlight`: white 90% light / 4% dark), a 1px hairline edge (`--surface-edge`: `rgba(17,19,24,.09)` light / white 7% dark) and `--elevation-sm`. The light edge used to be white and vanished against the page; it now separates cards the way the dark theme does. Always pair it with `.bg-grain` (the `Card` and `Tile` primitives do). Because it owns `box-shadow`, mark a selected card with `outline outline-1 outline-foreground`, not `ring-*` or `border-*`.

## Anti-patterns

- A second accent hue, or green for "good": use foreground + a check icon.
- Translucent cards with `backdrop-blur`: v2 cards are solid `bg-bg-tertiary`.
- `text-severity-low` for text: it's a light grey fill, unreadable as text in light mode. Use `text-text-tertiary`.
- `dark:` overrides to patch a color: fix the token instead.

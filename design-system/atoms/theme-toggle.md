# Atom → Theme toggle

## 1. Overview

**Component**: [`ThemeToggle`](../../src/components/uxcc/ThemeToggle.tsx), backed by [`lib/theme.ts`](../../src/lib/theme.ts).

An icon-only button that switches between the light (default) and dark themes. It lives in the landing nav pill and in the app top bar, left of the credit count. It is the only theme control; there's no "system" option yet (see Anti-patterns).

## 2. Tokens

- Size: `h-8 w-8` (32px), `rounded-xl` by default; pass `className="rounded-md"` inside a 14px-radius pill so radii nest.
- Idle: `text-muted-foreground`. Hover: `bg-bg-elevated text-foreground`.
- Icon: lucide `Moon` (in light) / `Sun` (in dark), `h-4 w-4` (`icon-control`).
- Focus: global `:focus-visible` 2px `--primary` outline.

## 3. Anatomy & variants

One button, one icon. The icon shows the theme you'll switch **to**. No variants; placement changes only the radius via `className`.

`useTheme()` returns `{ theme, toggle }` through `useSyncExternalStore` (server snapshot `"light"`), so every toggle on the page stays in sync. `setTheme()` flips the `dark` class on `<html>`, writes `localStorage["datsoff-theme"]`, and notifies subscribers. Sonner's `<Toaster theme={theme}>` follows it.

## 4. States & interactions

| State         | Treatment                                                 |
| ------------- | --------------------------------------------------------- |
| Default       | Muted icon, transparent background                        |
| Hover         | `bg-bg-elevated`, icon to foreground, `transition-colors` |
| Focus-visible | Orange outline, offset 2px                                |
| Active        | Instant swap; no animation on the theme change itself     |
| Disabled      | Not applicable                                            |

## 5. Accessibility

- `aria-label` describes the action: "Switch to dark theme" / "Switch to light theme"; `title` repeats it as a tooltip.
- Native `<button type="button">`, so Enter and Space work.
- No flash of the wrong theme: the head script applies the stored theme before paint, and `<html suppressHydrationWarning>` tolerates the class difference.

## 6. Content guidelines

Tooltip text is "Dark theme" / "Light theme". Don't add a visible text label in the nav; the icon is a well-known convention.

## 7. Anti-patterns

- Reading `localStorage` during render: it breaks SSR. Use `useTheme()`.
- Theme-specific colors via `dark:` classes next to the toggle: tokens already flip.
- Adding a "system" mode without a product decision: it's tracked in `known-issues.md`.

# Atom → Section label

## 1. Overview

The small heading above a group of controls or a list ("Tech stack", "Recent", "Example finding", "Typical prompt"). v2 replaces the v1 uppercase, tracked label with a sentence-case one; hierarchy comes from size and grey value, not capitals.

## 2. Tokens

- `text-[12px] font-medium text-text-tertiary` for field and group labels inside cards and panels.
- `text-[13px]`–`text-[14px] font-medium text-text-tertiary` for list headings in the sidebar.
- Optional leading icon `h-3.5 w-3.5` (`icon-inline`), same color.

## 3. Anatomy & variants

```tsx
<div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-text-tertiary">
  <Icon className="h-3.5 w-3.5" />
  Tech stack
  <span className="ml-auto font-normal">Optional</span>
</div>
```

- **Plain**: text only.
- **With icon**: leading lucide icon.
- **With hint**: trailing `font-normal` aside ("Optional", a count).

Landing sections don't use this; they use the `Eyebrow` ([`landing-primitives.md`](../molecules/landing-primitives.md)).

## 4. States & interactions

Static. If a label needs to be clickable (a collapsible group), it becomes a button and moves to `text-muted-foreground` with `hover:text-foreground` (see the muted vs tertiary rule in [`tokens.md`](../foundations/tokens.md)).

## 5. Accessibility

- When it labels one input, render it as a `<label htmlFor>`; when it heads a group, use a heading element or `aria-labelledby` on the group.
- `text-tertiary` on white is 4.8:1 in light and 5.5:1 in dark: fine at 12px medium.

## 6. Content guidelines

Sentence case, 1–3 words, no trailing colon, no all caps (acronyms excepted: "UX score").

## 7. Anti-patterns

- `uppercase` + `tracking-wider`: v1 style, removed app-wide.
- Orange labels: the accent is reserved for the one emphasis on screen.
- Making a label bolder than the content it heads: it should be the quietest text in the group.

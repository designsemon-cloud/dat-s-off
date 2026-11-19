# Molecule → Modal Header (title + close button)

Documents the one part of the three existing modals ([`AuthModal`](../../src/components/uxcc/AuthModal.tsx), [`CreditsModal`](../../src/components/uxcc/CreditsModal.tsx), [`BuyCreditsModal`](../../src/components/uxcc/BuyCreditsModal.tsx)) that's already **byte-for-byte consistent** across all three — preserve this exactly when building the fourth.

## Spec

Close button (identical in all three today):

```tsx
<button
  onClick={onClose}
  className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-md border border-border bg-bg-secondary hover:bg-bg-elevated transition-colors"
>
  <X className="h-3.5 w-3.5 text-muted-foreground" />
</button>
```

Header block (title + optional description), reserving space for the close button with `pr-8`:

```tsx
<div className="mb-5 pr-8">
  <h2 className="text-base font-semibold text-foreground">{title}</h2>
  <p className="mt-1 text-[13px] text-text-tertiary leading-relaxed">{description}</p>
</div>
```

## Rules

- `mb-5` on the header block (not `mb-6`) — `BuyCreditsModal` currently uses `mb-6`, a small drift; `mb-5` is the majority pattern and the one to converge on if that file is ever touched.
- Description text: `text-[13px] text-text-tertiary leading-relaxed` (the `body-sm` step) — `CreditsModal` currently uses Tailwind's own `text-xs` instead of the bracket value; converge to `text-[13px]` if touched, per `foundations/typography.md`'s "don't mix scales" rule.
- Close button is always absolutely positioned `right-4 top-4` relative to the modal card, never inline in a flex header row — this keeps its position identical regardless of how long the title text runs.

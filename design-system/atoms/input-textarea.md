# Atom → Text Input & Textarea

There is no bespoke `Input`/`Textarea` component (unlike `Button`, which got a bespoke `GlowButton`). The shadcn primitives (`src/components/ui/input.tsx`, `textarea.tsx`) exist but are used **only as an unstyled base** — every real call site re-skins them entirely via `className`, never by editing the primitive file. **Keep doing this** — don't "fix" `input.tsx` itself, override at the call site like the existing usage does.

## Canonical recipe

Textarea (from [`ConfigPanel.tsx`](../../src/components/uxcc/ConfigPanel.tsx), reused verbatim in `FlowConfigPanel.tsx`):

```tsx
<textarea
  style={{ borderRadius: "12px" }}
  className="w-full resize-none border border-border bg-bg-tertiary px-3 py-2 text-[14px] text-foreground placeholder:text-text-tertiary/60 focus:border-border-strong focus:outline-none transition-colors duration-150"
/>
```

Text input inside a modal: use **`TextField`** from [`AccountKit.tsx`](../../src/components/uxcc/AccountKit.tsx) (label, optional hint, leading icon, show/hide eye on passwords). It's cult-ui's halo-input, greys first: `h-11`, `borderRadius: 12px`, `bg-bg-secondary` with an inset shadow (recessed), `hover:border-border-strong`, and on focus `border-primary/60` plus a 3px 14% primary halo. The old one-liner below is superseded:

```tsx
<Input className="bg-bg-secondary border-border text-foreground placeholder:text-text-tertiary/50 focus:border-primary" />
```

## The rule that reconciles these two (they look inconsistent but aren't arbitrary)

**An input's background should be one surface-step darker than the panel it sits in.** `ConfigPanel`'s textarea sits on a `bg-bg-tertiary` panel, so the input itself uses the _same_ tertiary tone (translucent) to read as recessed-but-not-jarring. `AuthModal`'s input sits directly on the modal card (also `bg-bg-tertiary`), so it steps down to `bg-bg-secondary` for real contrast against its parent. **When adding a new input, check what surface it's sitting on and pick the next tone down** — don't copy one of the two snippets above blindly without checking the parent surface first.

The focus-border color difference (`border-border-strong` vs `border-primary`) is a real inconsistency, not a rule — `focus:border-primary` is the better choice (it reuses the accent token and gives a clearer focus signal) and new inputs should prefer it. See `known-issues.md`.

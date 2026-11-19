# Atom → Option Dropdown Pill

**Status: new atom**, introduced by the landing-page composer consolidation. Component: [`OptionDropdownPill.tsx`](../../src/components/uxcc/OptionDropdownPill.tsx). A compact pill trigger (category label + current value's icon + value + chevron) that opens a small floating option list — the pattern used for Tech Stack and Device selection, now in a toolbar row **below** the composer rather than inside it (see [`organisms/prompt-composer.md`](../organisms/prompt-composer.md)).

No prior dropdown/popover pattern existed anywhere in the app before this — [`organisms/config-panel.md`](../organisms/config-panel.md)'s selectable-pill grid (every option always visible as its own button) is the closest relative, and remains the _right_ choice when there's room for a full grid. This atom exists specifically for contexts where that room doesn't exist.

## Built on `GlowButton`, not hand-rolled

The trigger is `<GlowButton variant="outline" size="sm" active={open}>` (see `atoms/button.md`) — not a standalone `<button>` with its own className, which is how it was first built. This guarantees the trigger's `4px` radius and hover/open treatment are **literally identical** to every other compact pill on the page (the mode toggle, `GlowButton` itself), rather than independently matching by coincidence.

## Per-option icons — value-specific, not a fixed category icon

```ts
interface DropdownOption {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}
```

**This changed from the original version**, which took one fixed `icon` prop shown at the _start_ of the trigger (e.g. a generic `Code2` icon for "Stack", always the same regardless of which stack was selected). That read as decorative, not informative. Now:

- Each **option** in the list carries its own icon.
- The **trigger** shows the _currently selected option's_ icon, positioned right before the value text (`Stack: ⚛️ React + Tailwind`, `Device: 🖥 Desktop`) — not before the category label.
- The **dropdown list** shows every option's icon next to its label too, so the icon helps with recognition while choosing, not just after.

Concretely for this app's two pills:

- **Stack**: a real brand logo per framework (`react-icons/si` — `SiReact` for both React options, `SiVuedotjs`, `SiHtml5`, `SiSwift`, `SiFlutter`), not a generic code glyph. `react-icons` is a new dependency, added specifically for this — the app has no other brand-logo need today; don't reach for it for anything that isn't an actual third-party brand mark (lucide-react remains the icon set for everything else, per `foundations/iconography.md`).
- **Device**: unchanged from before — the existing lucide `Monitor`/`Tablet`/`Smartphone` mapping, just repositioned.

An option with no `icon` renders with none — the component doesn't require every option in a list to have one, but a _brand/category_ dropdown (stack, device, and anything similar in spirit) should have one for every option, not just some, or the gaps read as broken rather than intentional.

## Spec

```tsx
<GlowButton
  variant="outline"
  size="sm"
  active={open}
  onClick={() => setOpen((o) => !o)}
  className="gap-1.5"
>
  <span className="text-text-tertiary">{label}:</span>
  {SelectedIcon && <SelectedIcon className="h-3.5 w-3.5" />}
  <span>{selected?.label}</span>
  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
</GlowButton>
```

Panel (absolutely positioned, opens below) — unchanged from the original version:

```tsx
<div className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-bg-elevated py-1 shadow-elegant">
  {options.map((opt) => (
    <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ...">
      {opt.icon && <opt.icon className="h-3.5 w-3.5 shrink-0" />}
      <span className="flex-1">{opt.label}</span>
      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
    </button>
  ))}
</div>
```

## Rules

- Panel uses `rounded-xl` (16px, the modal-card radius step) + `shadow-elegant` — the same treatment as a small floating surface anywhere else in the app (compare `organisms/modal-shell.md`'s card). This is a _container_, not a button, so it keeps the card-scale radius rather than the `4px` button radius — the two radius idioms (`foundations/tokens.md`) still coexist deliberately, just applied to the right kind of element each time.
- Close behavior: click-outside (a `pointerdown` document listener checking the trigger's own ref) and `Escape` — **this is the one place in the app with real click-outside/keyboard dismissal**, since the three existing modals rely only on backdrop-click (a known gap, see `known-issues.md`). Any future dropdown/popover should copy this dismissal pattern, not the modals' more limited one.
- Selected option shows a trailing `Check` icon, and its text turns `text-primary` — keep this consistent if a second dropdown-list style control is ever built.
- Icons are left `currentColor` (monochrome, inheriting the surrounding text color) even for brand logos — this app has no full-color icon anywhere else (`foundations/iconography.md` is lucide-only, single-tone), and a colored React/Vue/Swift logo sitting next to monochrome lucide icons elsewhere on the same page would read as a style leak, not a brand flourish. Don't pass brand colors to these.
- This is a single-select, single-level list only — no search, no multi-select, no nesting. If a future need exceeds that (e.g. a long searchable list), that's a genuinely different molecule, not an extension of this one — ask before stretching this component to do more than pick-one-of-a-short-list.

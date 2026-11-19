# Atom → Copy button

**Component**: [`CopyButton.tsx`](../../src/components/uxcc/CopyButton.tsx). The one control for copying a prompt, everywhere: chat "Copy fix prompt", the document's "Copy prompt" and each issue's "Copy this fix's prompt".

- Built on [`button`](button.md) (`GlowButton`), `whitespace-nowrap`. **One look everywhere**: always `variant="primary"` (the orange ring) at `size="sm"`. Copying the prompt is the product's main action, so it never appears as a borderless or outline variant. The component no longer takes `variant` or `size` props, so it can't drift.
- **Copy icon** (lucide `Copy`, the two-layer glyph, 14px) before the label. After a click: **`Check` + "Copied"** for 2s, then back. The label sits in a polite live region so screen readers hear "Copied".
- Size: `sm` (32px) in every place: the chat's "Fix it, then re-check", the document's prompt block and under each issue.
- What it copies is always a structured prompt from [`lib/fix-prompts.ts`](../../src/lib/fix-prompts.ts) ([`patterns/fix-prompts.md`](../patterns/fix-prompts.md)).

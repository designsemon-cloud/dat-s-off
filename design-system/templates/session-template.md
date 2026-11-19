# Template → Session

**Route**: [`src/routes/app.s.$sessionId.tsx`](../../src/routes/app.s.$sessionId.tsx). One critique = one session. It works like a Claude chat with artifacts: **two panels by default (sidebar + conversation); the critique is a document that opens as a third panel when you ask for it.**

```
Closed (default)
┌ Sidebar ┬──────────── ChatPane (flex-1, centred 720px column) ────────────┐
│         │   your prompt + screenshot                                      │
│         │ D. answer · what to fix (top 3)                                  │
│         │    ┌ UX critique · 61/100 · Needs work ─── Open ┐  ← CritiqueTile │
│         │    Fix it, then re-check: copy · apply · re-check               │
│         │   composer                                                       │
└─────────┴──────────────────────────────────────────────────────────────────┘

Open (tile, issue row, or "View all" clicked)
┌ Rail ┬ ChatPane (380px / 420px xl) ┬ ResultsCanvas (flex-1) ─────── Export ✕ ┐
│ 60px │ tile shows "Viewing"        │ one document, top to bottom              │
└──────┴─────────────────────────────┴──────────────────────────────────────────┘
```

- **Closed**: the chat fills the main area; messages and composer sit in a centred `max-w-[720px]` column so long lines stay readable.
- **Open**: the chat docks to `lg:w-[380px] xl:w-[420px]` with `border-r border-border/60`; the panel (`bg-bg-secondary/40`) enters with `opacity 0→1, x 24→0, 0.35s ease [0.22,1,0.36,1]` (none with reduced motion). Closing (✕ in the panel toolbar) returns to the full-width chat.
- **Sidebar**: while the panel is open the app sidebar folds to its 60px rail (via `ShellContext`, [`lib/shell-context.tsx`](../../src/lib/shell-context.tsx)), so three panels never squeeze the critique. The sidebar toggle can still expand it for that while; closing the panel restores the saved state.
- **Opening**: the critique never opens on its own, not even when a run finishes; the user opens it from the chat. Each session starts closed.
  - Critique tile → the top of that version's document.
  - An issue title in the chat → the document scrolled to that issue, highlighted, its pin highlighted (flows jump to its anchor screen).
- **Below `lg`**: the open panel replaces the chat full-screen; ✕ goes back to the chat. (The old Chat / Results toggle is gone.)
- **Versions**: attaching a new screenshot is a re-check ([`patterns/recheck-loop.md`](../patterns/recheck-loop.md)): it adds a version compared with the one before, with its own result message and tile; the panel, if open, jumps to the newest and offers a Version dropdown when there's more than one.
- Pane pieces: [`organisms/chat-pane.md`](../organisms/chat-pane.md), [`organisms/results-canvas.md`](../organisms/results-canvas.md).

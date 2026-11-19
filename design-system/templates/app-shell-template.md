# Template → App Shell

**Route**: [`src/routes/app.tsx`](../../src/routes/app.tsx) — the layout around every `/app/*` screen. Modeled on chat-app shells (Motion's agent view as the reference the product owner chose): a left sidebar for navigation + history, a slim top bar for context + account, and the screen itself in the remaining space. Dark only, existing tokens only.

## Layout

```
┌──────────────┬──────────────────────────────────────────────────┐
│ AppSidebar   │ AppTopBar  (h-12)                                │
│ 260px        ├──────────────────────────────────────────────────┤
│ (60px rail   │ <Outlet/>  — fills the rest, owns its own scroll │
│  collapsed)  │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

- Root: `flex h-dvh overflow-hidden bg-background`. Pages scroll inside `<main>`, never the window.
- Sidebar: [`organisms/app-sidebar.md`](../organisms/app-sidebar.md). Collapsed state persists in `localStorage` (`datsoff-sidebar-collapsed`). While a page reports a side panel open through `ShellContext` ([`lib/shell-context.tsx`](../../src/lib/shell-context.tsx)), today the session's critique panel, the sidebar shows as the rail; its toggle expands it for that while without saving.
- Top bar: [`organisms/app-top-bar.md`](../organisms/app-top-bar.md).
- Below `lg`: the sidebar is hidden; the top bar's menu button opens it as a left drawer (`motion` slide `x: -280 → 0`, `bg-black/60` scrim), closed on navigation.
- No WebGL background inside the app — plain `bg-background`. The ambient background belongs to the marketing landing only ([`landing-template.md`](landing-template.md)).

## Screens

| Route               | Screen       | Notes                                                                                                                                |
| ------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/app`              | New critique | Display heading + [`prompt-composer.md`](../organisms/prompt-composer.md) + suggestion chips (fill the prompt) + sample cards        |
| `/app/s/$sessionId` | Session      | [`session-template.md`](session-template.md). Sample ids (`sample-*`) resolve from `lib/samples.ts`, read-only                       |
| `/app/library`      | Library      | Search + All/Single/Flow segmented filter + [`SessionCard`](../molecules/analysis-card.md) grid with hover delete (`window.confirm`) |
| `/app/samples`      | Samples      | `SessionCard` grid of the built-in samples                                                                                           |
| `/app/settings`     | Settings     | Cards: Defaults (stack/device via `OptionDropdownPill`, stored in `lib/prefs.ts`), Account, Credits, History (clear, destructive)    |

Page bodies use `mx-auto max-w-{2xl|5xl|6xl} px-4 py-8 sm:px-6`, page title `text-lg font-semibold`, cards per [`layout-and-spacing.md`](../foundations/layout-and-spacing.md) (`rounded-2xl border border-border bg-bg-tertiary/60 p-4`).

## Data

Sessions are **browser-only** (IndexedDB via [`lib/session-store.ts`](../../src/lib/session-store.ts)) — see [`patterns/session-lifecycle.md`](../patterns/session-lifecycle.md). Auth/credits come from `AuthProvider` ([`lib/auth-context.tsx`](../../src/lib/auth-context.tsx)), mounted in `__root.tsx`, which also owns the Auth / Credits / Buy-credits modals for every route.

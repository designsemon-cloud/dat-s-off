# Organism → App Sidebar

**Component**: [`AppSidebar.tsx`](../../src/components/uxcc/AppSidebar.tsx). Chat-app style navigation for the `/app` shell.

Top to bottom:

1. **Brand row** `h-12`: `Logo` (links to `/`) + collapse toggle (`PanelLeftClose/Open`, 32px ghost icon button, `borderRadius: 12px`).
2. **Primary nav**: **New** (`Plus` → `/app`, exact match), **Library** (`Library`), **Samples** (`Compass`). Peers, one recipe: `h-8 px-2.5 text-[14px] text-muted-foreground`, `borderRadius: 12px`, hover/active `bg-bg-elevated text-foreground`. New is not a bordered button any more: it's the page you start on, so it shows selected there like any other item (Nov 2026). Its tooltip says "New review".
3. **History**: search field ([`atoms/input-textarea.md`](../atoms/input-textarea.md) recipe at `h-8`, `borderRadius: 12px` like the nav items above it, with a leading search icon), "Recent" section label (sentence case), then one row per session: 36×28 thumbnail, title (truncate), status line when not done ("Needs answers", "Analyzing"…), score dot + number (`scoreFill`: ≥80 low/green, ≥60 medium/orange, else high/red). Empty state copy says sessions are saved in this browser.
4. **Footer**: the **only** place for credits and sign-in. Credits meter card ("N credits left" + "Add credits" → Credits modal + `h-1` bar, full at 5; no icon), Settings link, account row (avatar + name) or "Sign in to sync credits". In the rail it becomes a **credit ring**: a 36px button (12px radius) with a circular gauge (r = 10, 2px `border` track, `foreground` arc for what's left out of 5, orange when 0) and the count inside in 11px tabular figures. It's the common collapsed-meter pattern (a ring gauge with the number inside), not a squeezed bar. `aria-label` "N credits left. Add credits"; it opens the Credits modal.

- **Feedback** (`MessageSquareText`, title "Send feedback") sits above Settings in both widths. It opens the feedback card ([`patterns/feedback.md`](../patterns/feedback.md)) by dispatching `OPEN_FEEDBACK_EVENT`.

- Width `260px`; also folds to the rail while the session's review panel is open (see [`templates/app-shell-template.md`](../templates/app-shell-template.md)). Collapsed rail `60px` shows icons only (with `title` tooltips) and hides search/history/meter. `transition-[width] duration-200`.
- Surface: `bg-bg-secondary border-r border-border`.
- On mobile it renders inside the shell's drawer with `mobile` (always expanded, no collapse toggle).

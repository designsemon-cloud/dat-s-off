# Organism → App Top Bar

**Component**: [`AppTopBar.tsx`](../../src/components/uxcc/AppTopBar.tsx). `h-12 border-b border-border/60 px-3 sm:px-4`.

- **Left**: mobile menu button (`lg:hidden`), then the session title (`text-[14px] font-medium`, truncate) + a "Sample" tag for read-only samples, or the page name.
- **Right**: the theme toggle only.
- Credits and sign-in are deliberately _not_ here: they live in one place, the sidebar footer ([`app-sidebar.md`](app-sidebar.md)). The mode ("Single screen" / "Flow") is in the critique tile and document, so the bar doesn't repeat it. Session actions (version, export) sit in the critique panel toolbar next to what they act on.

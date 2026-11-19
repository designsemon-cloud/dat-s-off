# Foundations → Iconography

**Library**: [`lucide-react`](https://lucide.dev) for every icon that represents a _concept, action, or state_ (close, upload, device type, severity, arrows, status) — never mix in another icon set for this, and never hand-author SVG paths for something Lucide already has.

**One weight in the product.** In the `/app` shell (`data-app-shell`) and the account modals (`data-ui-icons`), every Lucide icon draws at a **1.75 stroke**, set once in `styles.css`; the 2px default reads heavy at 14–16px. Solid glyphs (`strokeWidth={0}`, e.g. a filled play) are left alone. Don't pass `strokeWidth` per icon there; it's overridden. Nav icons: New `Plus`, Library `Library`, Samples `Compass`, Settings `Settings`, Sign in `LogIn`, all 16px, `text-muted-foreground` (foreground when active).

**Google's "G"** on "Continue with Google" ([`AccountKit.tsx`](../../src/components/uxcc/AccountKit.tsx)) keeps its four colours: Google's sign-in branding rules require the standard mark, so it's the one brand mark that isn't monochrome.

**One narrow, explicit exception**: [`react-icons/si`](https://react-icons.github.io/react-icons/icons/si/) (Simple Icons) for actual third-party **brand logos** — currently just the tech-stack picker's per-framework marks (`SiReact`, `SiVuedotjs`, `SiHtml5`, `SiSwift`, `SiFlutter` in `PromptComposer.tsx`, see `atoms/option-dropdown-pill.md`). Lucide doesn't carry brand marks (by design — it's a generic icon set), so there's no "use Lucide instead" option here the way there is almost everywhere else. **Don't reach for `react-icons` for anything that isn't a genuine third-party brand logo** — a generic concept/action icon always goes through Lucide, even if `react-icons` happens to have an equivalent glyph. Brand logos stay monochrome (`currentColor`, no brand colors) — see that atom doc's rules for why.

**Second brand-mark source (landing only):** the AI-tool marks in the "Fix prompts written for" row ([`ToolLogos.tsx`](../../src/components/landing/ToolLogos.tsx)) are vendored path data from LobeHub Icons (`@lobehub/icons-static-svg` 1.102.0, MIT), because Simple Icons lacks Lovable and OpenAI. Same rules: monochrome `currentColor`, shown only to name the tools the prompts target. Bolt has no open mark, so it's set as its `bolt.new` wordmark in text; never hand-trace a logo.

## When to use an icon at all

Too many icons flatten the hierarchy: when every label has a glyph, none of them stands out. Use an icon only when it does work words can't:

- an icon-only control: close ✕, attach +, send ↑, the sidebar toggle;
- navigation that must survive the 60px rail (New critique, Library, Samples, Settings, Sign in);
- an input affordance people expect (search).

Don't put icons in front of text labels that already say it (Export, Re-check, "N credits left", menu items), on status words (Fixed / Still open), on section headings, or on paragraph labels (Problem / Why it matters / Fix).

**Exceptions, on purpose**:

- **Copy buttons** carry the copy (two-layer) icon before the label and swap to a check + "Copied" ([`atoms/copy-button.md`](../atoms/copy-button.md)): the glyph is recognised faster than the word, and the check confirms the copy.
- **Listen** is icon-only: the speaker toggle (`Volume2`) in the toolbar, and the player's back 30 / play-pause / forward 30 / speed / close ([`patterns/listen.md`](../patterns/listen.md)). Media controls are universally read as icons; each has an `aria-label` and tooltip.

In the session screen today, the icons are the composer's +/send, ✕ close, the copy buttons, the listen controls and the shell's nav.

## Size scale (container vs. icon-inside-container)

There are two related but distinct scales: the icon's own size, and — when an icon sits inside a colored circular badge — the badge container's size. Confirmed by grep across every `uxcc/` component:

| Role           | Icon size     | Container size (if badged) | Example                                                                                                                                                                        |
| -------------- | ------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `icon-inline`  | `h-3.5 w-3.5` | —                          | Default size for almost everything: close (X) buttons, metadata icons (`Wallet`, `Plus`, `RotateCcw` in `Header`), severity badge icons in `FixCard`                           |
| `icon-control` | `h-4 w-4`     | —                          | Slightly larger — interactive control icons: `ConfigPanel`/`FlowConfigPanel` selector icons, `FlowUploadZone` reorder/remove chevrons, alert/warning icons                     |
| `icon-feature` | `h-6 w-6`     | `h-14 w-14` badge          | A single large hero icon inside a big gradient-filled circle — reserved for one dominant call-to-action moment per screen (e.g. the upload icon in `UploadZone`'s empty state) |
| `icon-stat`    | (varies)      | `h-11 w-11` badge          | Score/number badges in `ResultsView`/`FlowResultsView` — these show a number, not an icon, inside the same badge-container idiom                                               |

**Rule**: default to `icon-inline` (`h-3.5 w-3.5`) unless the icon is a primary interactive control (`icon-control`, `h-4 w-4`) or the single hero moment of a screen (`icon-feature`). Don't introduce a fifth size without checking here first — the existing sub-3.5 sizes (`h-3`, `h-2.5`, `h-1.5`, `h-1`) are for decorative micro-elements (status dots), not icons carrying meaning, and shouldn't be reused for anything that needs to be legible/tappable.

## Stroke width

Default Lucide stroke (2) almost everywhere. `strokeWidth={2.5}` is used deliberately for a couple of higher-emphasis icons (the `Upload` hero icon, the `Plus` in "Add credits") — a slightly bolder stroke for icons that are meant to read as more prominent/actionable. Don't apply `2.5` blanket-wide; reserve it the same way.

## Favicon (Nov 2026)

The browser-tab icon is the **"D." mark** from the chat's assistant avatar (`Assistant` in `ChatPane.tsx`): a bold "D." on a rounded grey tile with a 1px border.

- `public/favicon.svg` is the main icon. It follows the system theme: a light tile (`#f3f3f5`, border `#d8dbdf`, mark `#1e2022`) in light mode and a dark tile (`#26282c`, border `#2e3035`, mark `#f3f3f5`) in dark mode.
- Fallbacks: `favicon-32.png` and `favicon.ico` (light). `apple-touch-icon.png` is 180px, full-bleed and opaque, because iOS fills a transparent icon with black.
- The links are in the root route's `head` (`src/routes/__root.tsx`).
- If the avatar's look changes, update the SVG and re-render the PNG and ICO fallbacks from it.

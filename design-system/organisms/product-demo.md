# Organism → Product demo

## 1. Overview

**File**: [`src/components/landing/ProductDemo.tsx`](../../src/components/landing/ProductDemo.tsx), used by [`Showcase.tsx`](../../src/components/landing/Showcase.tsx) ("Real output" section).

A scripted, looping "screen recording" of a real review, shown on a Mac-style desktop. Inside the window is **the real app, not a drawing of it**: `AppSidebar`, `AppTopBar`, `NewCritiqueView`, `ChatPane` and `ResultsCanvas`, fed the sample sessions in `lib/samples.ts`. They render at desktop size (1280 × 760), are scaled to the window's width, and are `inert` + `aria-hidden`. Any UI change shows up in the demo for free, so it can never drift from the product again. Being live UI rather than a video file, it stays sharp, follows the theme, and costs no bandwidth.

The real components take a `preview` prop where they would otherwise read the router or local storage: `AppSidebar preview={{ sessions, activeId }}` and `AppTopBar preview={{ path, sessionId }}`.

## 2. Tokens

- Width: full-bleed (`w-screen`, square edges), set in `Showcase`, whose section clips x-overflow. The window inside is centred, `max-w-[1200px]`.
- Desktop: no radius, no ring. Wallpaper `/illustrations/clouds.jpg`: an original vintage cloud sky (Figma AI) in the spirit of the classic Mac OS X cloud desktops, `object-cover`, dimmed with `#0B0D10` at 55% in dark mode, plus a 14% overlay of `--grain-image`.
- Menu bar: `h-7`, `bg-white/40` / `dark:bg-black/35` + `backdrop-blur-md`, 12px; "Dats Off." bold, File … Help (sm+), battery / wifi / search, "Mon 9:41 AM". No Apple logo.
- Window: `rounded-xl bg-background`, hairline + `0 30px 70px -18px` shadow; body height `760 × scale`, where scale = window width ÷ 1280.
- Toolbar: `h-10 bg-bg-secondary`; traffic lights 12px in the real macOS colours, close `#FF5F57`, minimise `#FEBC2E`, zoom `#28C840`, each with a 0.5px darker inset ring; sidebar / back / forward icons; URL pill `bg-bg-elevated` with a lock, showing `/app` then `/app/s/<sample-id>`.
- App inside: the real shell (`data-app-shell`), so its tokens are the app's own. The sidebar folds to its rail when the analysis panel opens, exactly as in the app.
- Controls: a pill centred under the window (16–20px below it, on the wallpaper), not over the app: inside, it sat on the app's own bottom bar, whose centre moves with the sidebar and the critique panel, so the two never lined up. Styling: `bg-black/75 text-white backdrop-blur-md rounded-full`; white 32px play/pause; three chapters (58px / 84px) with 10–11px labels and 3px `white/25` tracks filled white; sample title (md+).
- Accent: the orange send button in the input chapter, the scan beam, and critical pins only.

## 3. Anatomy & variants

```
Desktop (wallpaper + menu bar)
 └ window: toolbar · [sidebar | top bar · stage] · floating controls
    stage ─ Input     (0–4.6s)   NewCritiqueView: the screenshot lands in the composer, the sample
                                 prompt types out, the cursor clicks Send
          ─ Analyzing (4.6–7.6s) ChatPane on the session while it runs (prompt + progress steps)
          ─ Output    (7.6–16s)  ChatPane with the result and the "What's off" tile; at 9.2s the cursor
                                 clicks the tile and the ResultsCanvas panel opens beside the chat
 controls (centred under the window): ( ▶/❚❚  Input ▬  Analyzing ▬  Output ▬ | <title> )
```

Each loop alternates the sample (`SAMPLE_SESSIONS[loop % n]`). Below the card, `Showcase` places the CTA row: orange "Critique your screenshot" (to `#top`), white "Open a sample critique" (`/app/s/$sessionId`), and "5 free critiques · no sign-up".

## 4. States & interactions

| State          | Behaviour                                           |
| -------------- | --------------------------------------------------- |
| Off screen     | Timeline paused (`useInView`, 40%)                  |
| Playing        | 50ms tick; chapters fill left to right              |
| Paused         | Play button shows ▶; the frame holds                |
| Chapter click  | Jumps to that chapter's start                       |
| Reduced motion | Starts paused on the finished output                |
| < md           | The same app, just scaled smaller; menu bar trimmed |

## 5. Accessibility

- Play/pause has `aria-label` "Play demo" / "Pause demo"; chapters are buttons labelled "Jump to …".
- The demo is illustrative; the real content (an openable sample critique) is one click away in the CTA row.
- The whole app inside is `inert` and `aria-hidden`: nothing in it can be focused, clicked or read twice.

## 6. Content guidelines

- Use only the real sample sessions; the score, issue titles and prompt come from `samples.ts`.
- Progress step names match the real pipeline: Reading the screen, Pass 1: rule checks, Pass 2: judgment, Writing fix prompts.

## 7. Anti-patterns

- Replacing it with a screen-recorded video: it goes stale whenever the UI changes and doesn't follow the theme.
- Re-drawing parts of the app by hand inside the demo: use the real component with a `preview` prop.
- Setting `activeFixId` in the demo: the canvas scrolls the active issue into view, which would scroll the landing page.
- Using Apple's real wallpaper, a watermarked stock image, or the Apple logo: copyrighted / trademarked. Keep the wallpaper original.
- Putting the controls back under the window: they belong inside, like a video player's.
- Autoplaying while off screen, or looping without a pause control.
- Adding more chapters: three is the story (input, wait, output).

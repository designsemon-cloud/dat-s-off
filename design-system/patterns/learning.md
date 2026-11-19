# Pattern → Learning (learn the why)

Dats Off. tells vibe coders and developers what to fix and why. Each issue already names its principle ("Von Restorff Effect", "Nielsen #6"), but a name is a dead end for someone who has never heard it. So every principle links to one short article or video. The goal is a user who needs Dats Off. a little less each month.

Learning is a **secondary layer**. It never competes with the fix: no primary buttons, no space in the chat. In the critique it has its own accent, **`learn` (violet/indigo)**, never the orange primary, so it reads as a different kind of help (the user asked for this, Nov 2026). On the landing's Learn section, violet is the section's **primary accent** for every interactive state: the eyebrow dot, the selected topic pill, tab hover, the "Paused" cue, card focus ring, the play button on hover, the hover pin, and the "See it in a sample review →" link.

## The catalog ([`lib/learn.ts`](../../src/lib/learn.ts))

About 30 principles, hand-curated:

- Nielsen's ten heuristics.
- Fitts's, Hick's and Jakob's laws.
- Von Restorff and aesthetic-usability.
- Gestalt: proximity, common region and similarity.
- Visual hierarchy.
- Feedback and affordance.
- Empty states, forms, UX writing.
- WCAG: contrast, non-text contrast, use of color, target size.

Each principle has:

- `key`: what the critique returns (`principleKey`).
- `name` and a one-line `idea` in plain words, for someone who has never heard of it.
- `aliases`: regexes for the free-text `principle` of older critiques and samples. `broad` words ("WCAG", "Gestalt", "Nielsen") count only when nothing specific matches.
- `resources`: an article first, then a video where a good one exists, sometimes a tool (WebAIM's contrast checker). Sources: NN/g (articles, and its own YouTube explainers), Laws of UX, WebAIM, W3C.

**Resources never come from the model.** Models invent plausible URLs, and a dead "learn more" link costs more trust than no link. The model only picks a `principleKey` from the list it's given (or `other`). The client looks the key up, and falls back to the alias matcher when the key is missing or unknown. The model sometimes copied the key into the readable `principle` too ("minimalist-design"), so the prompt says "in words; never the key", and the server schema maps a bare key back to its name (`readablePrinciple`).

**Minutes are measured**:

- Articles: words ÷ 230.
- Videos: their real length on YouTube.
- W3C "Understanding" pages: shown as "Reference". They're specs: 20–35 min end to end, and nobody reads them that way.

## Link checks ([`scripts/check-learn-links.mjs`](../../scripts/check-learn-links.mjs))

`npm run check:links` imports the catalog itself, so the checks can't drift from what ships.

- **Articles and tools**: must return 200 after redirects, and the page `<title>` must contain the resource's `expect` words.
- **YouTube**: checked through oEmbed, which answers only for a live, embeddable video. The title must match.

- **Preview images** (YouTube frames, the articles' og:images): 200 and `image/*`.

A resource that fails is removed from the catalog, never shipped. Run it before adding a resource, and now and then as links go stale. Nov 2026: 56/56 links ok.

## Where it appears

| Place                                                                                        | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Style                                                                                        |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Each issue in the critique ([`results-canvas.md`](../organisms/results-canvas.md))           | One line under "why it matters": 📖 Learn: **Visual hierarchy** · 7 min read · **▶ Video 2:49**. The article opens in a new tab; the video plays in place                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | No container. 13px tertiary; the icon and the link text in `text-learn`, underlined on hover |
| End of the critique                                                                          | **Keep learning** shelf, after the collapsibles. Not another ruled row: a tinted card (`border-learn/15`, a 160px `learn` wash at the top), a `GraduationCap` badge, and three tilted thumbnails peeking in the closed header. Open, each principle gets its idea and a `Rail` of `ResourceCard`s (`context="shelf"`: the card says Video / Article / Tool)                                                                                                                                                                                                                                                                                                                                                         | Shared `components/learn/LearnMedia.tsx`                                                     |
| Markdown / PDF export ([`lib/export.ts`](../../src/lib/export.ts))                           | "Learn more" per issue, and a "Keep learning" list at the end                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | —                                                                                            |
| Landing ([`landing/Learn.tsx`](../../src/components/landing/Learn.tsx)), before "Two passes" | "Learn the why behind every fix." A learning library: topic tabs (All, Heuristics, Laws of UX, Gestalt, Design & copy, Accessibility, with counts) after cult-ui's Direction-aware tabs, a violet (`bg-learn`, `text-background`) pill springs to the topic and the rows slide in from that side, with a light blur. Two rows drift on their own inside the page column (960px, faded at both edges), **Watch** (18 videos, play in place) to the left and **Read** (38 articles and tools) to the right, at 32px/s. Hovering the library stops both ("Paused" fades in by each row title); so do keyboard focus, an open video and scrolling past. Footer: sources line and a violet "See it in a sample review →" | Violet for every selected, hover and active state (above); greys otherwise                   |

## Shared components ([`components/learn/LearnMedia.tsx`](../../src/components/learn/LearnMedia.tsx))

- **`ResourceCard`**, after cult-ui's Cutout Card (rebuilt for our stack: framer-motion, plain `<img>`, no extra packages):
  - a 22px card (on the landing page, `context="library"`, it wears the landing's paper: `--surface-card` with the card grain, the notch included; in the app it stays plain `bg-card`), a 16:9 image (YouTube frame, or the article's own og:image; WebAIM and W3C publish none, so they get a drawn tile with the source name in Forum);
  - a **notched label** cut into the image's bottom-left corner with cult-ui's concave corner path: ▶ `2:49`, 📖 `7 min read`, 🔧 Tool;
  - a **pin** top-right that fades in on hover: "Play here" or "Read ↗";
  - hover: the title turns `text-learn` (it's a link: that's where it takes you), the card lifts 4px and its hairline edge stays as it is (no violet border and no drop shadow: flat cards, Nov 2026), the image eases to 1.05 over 700ms, the frosted play button fills violet; keyboard focus shows a `learn` ring;
  - title (2 lines, reserved), then source · principle (library) or source · Video / Article (shelf).
    Images load lazily with `referrerPolicy="no-referrer"`.
- **`Marquee`**: the items twice in a track that slides by one copy (`.learn-marquee-track` in styles.css), so the loop has no seam. The duration comes from the copy's width, so every row moves at the same slow speed. Stops while `paused`, while a card has focus, or off screen (IntersectionObserver). Doesn't move when the items fit. Under reduced motion it holds still and scrolls by hand, and the duplicate copy is hidden. The duplicate is **not `inert`**: the reversed (Read) row shows mostly the duplicate, and `inert` made those cards unclickable (Nov 2026). It's `aria-hidden` instead, with its links' `tabindex="-1"`, so screen readers and the Tab key meet each card once and the mouse can click every one.
- **`Rail`**: native horizontal scroll with snap, arrow buttons (hidden when nothing overflows, disabled at the ends), and a fade only on the edge with more to scroll. `resetKey` scrolls it back to the start (a new topic).
- **`VideoLightbox`**: the modal shell (portal, backdrop, Esc, focus on ✕, `role="dialog"`), a `youtube-nocookie.com` embed with autoplay, then the principle's name and idea, "Read: 10 min read ↗" and "Watch on YouTube ↗".

## Rules

- Secondary to the fix: never a primary button. One faint accent tint, no more.
- Articles open in a new tab (`target="_blank" rel="noopener noreferrer"`); videos play in place. Either way the critique stays where it was.
- Not in the chat. The chat is about the next action.
- Not read aloud by Listen.
- No link without a check. The landing section reads the real catalog, so it never promises a principle the product doesn't have.

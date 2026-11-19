# Molecule → Annotated Screenshot

**Component**: [`AnnotatedScreenshot.tsx`](../../src/components/uxcc/AnnotatedScreenshot.tsx). A screenshot with numbered pins at each issue's `region` (0–1 fractions of the image; `UXFix.region`).

**Only grounded regions reach it.** A live critique's regions come from the locate pass, and only for elements it confirmed ([`patterns/annotation-accuracy.md`](../patterns/annotation-accuracy.md)). Until then the canvas passes no regions, so no pin ever sits on a guess. Samples use hand-placed regions.

- **Pin**: 24px circle with a bold number. `pinTone`: `"neutral"` in the app uses `ISSUE_NUMBER` (`bg-foreground text-background`, `ring-background`), the same circle as the issue's number in the list and the chat. `"severity"` (the default, for landing demos) uses the severity fill (`bg-severity-*`). Both have `ring-2 ring-black/40` and a drop shadow. It sits at the region's top-left (padded by `PAD = 0.006`, clamped to 3–97% so it never clips).
- **Spotlight** (the hovered issue, else the active one): the element's box gets `ring-2` in the severity colour, and everything around it dims (`box-shadow: 0 0 0 9999px rgba(8,8,10,0.55)`). The other pins fade to `opacity-40`. Hovering an issue in the document spotlights it here; clicking a pin opens that issue.
- `revealOnView` (landing showcase): pins spring in one by one when scrolled into view.
- Exports `ISSUE_NUMBER` (the one issue-number style), `SEVERITY_FILL`, `SEVERITY_TEXT`, `SEVERITY_RING`, `scoreTone`, `scoreFill`: the shared severity and score colour maps. Reuse them instead of re-declaring.

## RegionZoom

`RegionZoom` (same file) shows one issue up close, inside its open step in the critique document. It's a crop of the screenshot around `region`, always spotlit, with the numbered pin (`ISSUE_NUMBER`, `ring-background`).

- **Crop**: centred on the region. Width is 2.2× the region's, but at least 28% of the image. Height is 2× the region's, but at least 12%. Clamped to the image edges; the container's `aspect-ratio` matches the crop, so nothing is distorted.
- `rounded-lg border border-border bg-bg-secondary`. Shows a grey placeholder while the image's natural size loads.
- An issue without a confirmed region shows the "no marker" note instead ([`patterns/annotation-accuracy.md`](../patterns/annotation-accuracy.md)).

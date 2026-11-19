# Pattern → Annotation accuracy (grounded markers)

A marker on the wrong element is worse than no marker. Every marker is tied to a real element that the browser detected, and it's confirmed before it's shown. When it can't be confirmed, the critique says so in words instead of pointing somewhere arbitrary.

## Why the critique's own coordinates aren't used

The analysis call is busy judging the screen, and vision models are poor at writing coordinates: their boxes drift by 3–5% or more, often onto empty space. Those boxes (`region` in the raw result) are therefore **never shown** for a live critique. Only hand-placed samples show their regions directly.

## The locate pass ([`lib/locate.ts`](../../src/lib/locate.ts), [`server/locate.ts`](../../src/server/locate.ts))

This runs in the browser after a critique is shown. It's free: no credit.

1. **Detect** ([`lib/ui-proposals.ts`](../../src/lib/ui-proposals.ts)). Pure pixel work, no model:
   - The screenshot is normalised to 1600px on its longer side. Big captures are scaled down, small ones up (at most 2×), so tiny text separates.
   - Ink is local 3×3 contrast. Long thin lines (panel borders, dividers) are removed.
   - The remaining ink is dilated into words and controls, and grouped into connected components. These are the element boxes, up to 220.
2. **Pick** (set-of-marks): the boxes are numbered in reading order and drawn on overlapping zoomed tiles. gpt-4.1 picks the number(s) of each issue's element.
   - Screen-wide issues (overall contrast, spacing, consistency) get **no** pick.
   - Picks are grouped with `cluster` so a stray far-away box can't stretch the marker. The vertical gap allowed scales with the element size, so two rows of tiles stay together.
3. **Verify**: each pick is shown back to the model as a close-up, with the element outlined. It must confirm that this is the element the issue is about. It's told to be strict: reject empty space, the wrong element, a fragment, an outline much bigger than the element, and screen-wide issues.
4. **Retry once**: rejected issues are picked again, told why the first pick was wrong, then verified again.
5. **Store**: each issue gets a `locator: { status, element }`:
   - `verified`: the marker is the element's own box;
   - `unconfirmed`: an element was picked but not confirmed, so there's no marker;
   - `none`: the issue isn't tied to one element, so there's no marker.

   `region` is set only when the status is `verified`.

The pass is versioned (`LOCATE_VERSION`). Critiques located by an older method are located again the next time they're opened.

## What the user sees

- **While locating**: no markers at all, and the caption reads "Placing each marker on the exact element and checking it…".
- **Caption after locating**:
  - all pinned: "Hover a number to spotlight it. Click it to open that issue."
  - some pinned: "4 of 6 issues are pinned to a confirmed element. The others say where they are in words."
  - none pinned: "None of the issues could be pinned to one element with confidence, so each says where it is in words."
  - failed: "Markers are unavailable for this screenshot, so each issue says where it is in words."
- **An open issue without a marker** shows a dashed note (`MapPinOff` icon) in place of the zoom: "Couldn't confirm the exact element on the screen, so there's no marker. **Where:** Details tab, the Type and Industry rows." The "Where" comes from the critique's `location`, falling back to the picked element's name. A screen-wide issue says "Not tied to one element on the screen".

## Measured (Nov 2026)

Live runs against hand-drawn ground truth:

| Screenshot                     | Correct | Wrong | Unpinned               |
| ------------------------------ | ------- | ----- | ---------------------- |
| FortiGate dashboard, 1400px    | 5       | 0     | 2 (one is screen-wide) |
| Same dashboard, cropped, 580px | 4       | 0     | 0                      |
| Amazon home page, 902px        | 4       | 0     | 1                      |
| Salesforce sample, 5120px      | 5       | 0     | 0                      |

Before verification, 2 of 5 Amazon pins were wrong, and the FortiGate "Add widget" pick sat on the wrong panel header.

## Rules

- Never show a marker the pass hasn't confirmed.
- An issue without a marker always says where it is, in words.
- One issue, one element. A quality spread across the screen gets no marker.

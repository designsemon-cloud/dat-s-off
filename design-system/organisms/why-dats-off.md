# Organism → Why Dats Off.

**File**: [`src/components/landing/WhyDatsOff.tsx`](../../src/components/landing/WhyDatsOff.tsx). It is the first section after the tools row (`#why`). It says, in one screen, why this isn't another UX critique tool, leading with what others don't do: **whole flows** and the **fix → re-check loop**.

**Nov 2026, second pass:** the layered stage became a short **film for each point**, played like a video. It has subtitles, chapter bars, play/pause, and sound that's off until the viewer turns it on. Turning sound on adds sound cues and a voice-over.

## Anatomy

```
Eyebrow "Why Dats Off." · H2 "Not another UX critique tool." · lede
┌ ruled list (4/11) ──────────────┐  ╭━ bezel (7/11) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
│ 01 Whole flows, not one screen  │  ┃ ┌ screen: film 640 × 360, edge to edge ───┐ ┃
│    body (open while playing)    │  ┃ │                                          │ ┃
│ 02 Fix, re-check, repeat        │  ┃ │ ░ on hover: subtitle line                │ ┃
│ 03 A prompt to paste, and the why│ ┃ │ ░ (▶/❚❚) ▬▬▬ ▬▬▬ ▬▬▬ (🔇)                │ ┃
└─────────────────────────────────┘  ┃ └──────────────────────────────────────────┘ ┃
                                     ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
```

- **List**: an editorial, ruled `<ol>`. The playing item has a foreground title and its body opens. Clicking an item plays its film from the start.
- **Bezel**: the player sits in a device-style frame. It has a 5px grey rim (`#3d3e43`, `#45464c` in dark) at a 34px radius, a top inner highlight, a 7px black gap, and no drop shadow, so it sits flat on the page.
- **Theme**: the bezel, screen and every film follow the page theme through the stage tokens in `styles.css`. `--st-bg`, `--st-glow`, `--st-fg` (the scene's ink), `--st-on`, `--st-dim`, `--st-card`, `--st-tile`, `--st-chrome`, `--st-shadow`, `--st-vignette`, `--st-rim` and `--st-gap` map to the Tailwind colours `st`, `st-on`, `st-bg` and so on. Light is a bright studio: a near-white screen, dark ink, and black filled buttons. Dark is the original night stage. Orange (the problem) and `learn` violet stay the same in both. SVG colours go through `style`, because presentation attributes can't read `var()`.
- **Screen**: `--st-bg`, 24px radius, hairline ring. The film fills it edge to edge.
  - **Canvas**: a radial top light, a faint masked grid and a vignette. It is drawn at a fixed 640 × 360 and scaled to the screen's width (ResizeObserver), so every film frames the same on a phone and on a desktop. Scenes are laid out on 640 × 320 and centred in it.
  - **Overlay** (pointer devices): the subtitle and controls float over the film's bottom edge on a black scrim (94% → transparent). They are hidden at rest and fade up (0.3s) on hover, on keyboard focus inside, and while paused or under reduced motion.
  - **Touch screens** (`hover: none`): the same block sits below the film instead, without the scrim, so it never covers the small film.
  - **Subtitle**: 13–14px white with a soft text shadow, one per scene, `aria-live="polite"`. It fades up as the scene starts (`.why-caption`).
  - **Controls**: one compact row (28px): a white round play/pause button, three 3px chapter bars that fill with the scene's time (clickable), and an icon-only sound toggle (`VolumeX` / `Volume2`, named by its `aria-label`). No text labels.
- On phones the player sits above the list.

## The films

Each film is scripted, not recorded. Every frame is a pure function of the scene clock `t` (ms), using `prog`, the eases and `lerp`. So motion, sound cues and subtitles stay in step, and a scene can pause or restart cleanly.

| Scene (≈7s)           | Beats                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Whole flows           | Four phone screens (Sign up, Verify, Plan, Done) rise out of a blur onto a plane tilted 14°. A scanner light and a glowing dot run the track, lighting each screen. At Done: an orange glow, a shake, and "No way back" springs in. The camera pushes in slowly about the centre (the shot stays centred), and a glass pill says "Dead end at step 4". |
| Fix, re-check, repeat | The v1 window with three pulsing orange pins. The pointer clicks **Re-check**. A wipe reveals v2, with a white edge and a red/cyan chromatic split. The pins pop to white checks one by one, the score ring fills from 61 to 84 with a growing glow, and "+23" springs in.                                                                             |
| Prompt + why          | The fix prompt types out in mono. The pointer clicks **Copy prompt**, which becomes "Copied". A glass "Fix prompt" chip arcs into a glass dock of tool marks, and the Cursor mark bounces. The "Why it works · Von Restorff effect" card rises with a breathing violet "▶ Watch · 3 min".                                                              |

Colour: greys and white. Orange only marks the problem (the flag, the pins, "Critical"); violet (`learn`) only on the watch line. The red/cyan split is an effect, never a status.

## Sound and voice

- **Off by default.** Browsers block audio before a gesture anyway. The toggle calls `unlockSfx()`, restarts the current scene, and speaks its line.
- **Cues**: [`src/lib/sfx.ts`](../../src/lib/sfx.ts) synthesises short, quiet sounds with Web Audio (no files): `tick`, `key`, `click`, `pop`, `whoosh`, `alert`, `chime` and `rise`, at a master gain of 0.32. Each scene lists its cues as `{ at, sfx }`, and the clock fires each one as `t` passes it.
- **Voice-over**: one line per scene, read by `speechSynthesis` with `pickVoice()` from `lib/speech-player.ts`, the same voice as Listen. The next scene waits until the line has finished. The voice stops when the player is paused or scrolled out of view.
- The subtitles are always on, so the films work muted.

## Behaviour

- It plays while 40% visible and pauses out of view. The pause button holds the current frame.
- After the last scene it loops back to the first.
- Reduced motion: no autoplay, and each film holds its final frame. The list still switches scenes.

## Anti-patterns

- Autoplaying sound, or sound with no visible toggle.
- Recorded video files for these: the films must stay scripted, so they track copy and theme changes.
- A fourth point, naming competitors, or giving "Pinned to your screen" headline weight again.

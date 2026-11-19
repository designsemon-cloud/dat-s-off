import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Check, Copy, Pause, Play, PlayCircle, Volume2, VolumeX } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { playSfx, unlockSfx, type Sfx } from "@/lib/sfx";
import { pickVoice } from "@/lib/speech-player";
import { BlurIn, Section } from "./primitives";
import { TOOLS } from "./ToolLogos";
import { TYPE } from "./type";

// "Why Dats Off.": why this isn't another UX critique tool. A ruled list of
// the three points beside a short film for each, played like a video:
// subtitles, chapter bars, play/pause, and sound off until the viewer turns
// it on (then each scene has sound cues and a voice-over line).
//
// The films are scripted, not recorded: every frame is a pure function of
// the scene clock `t` (ms), so motion, sound cues and subtitles stay in step,
// and a scene can be paused or jumped to. They're drawn on a 640 × 320 canvas
// scaled to the player's width; subtitles and controls sit below at real size.
// See design-system/organisms/why-dats-off.md.

const W = 640;
const H = 360; // the canvas; scenes are laid out on 640 × 320, centred in it

type Scene = {
  title: string;
  body: string;
  line: string;
  dur: number;
  cues: { at: number; sfx: Sfx }[];
  Film: (p: { t: number }) => ReactNode;
};

const keyCues = (from: number, to: number, every: number) =>
  Array.from({ length: Math.floor((to - from) / every) }, (_, i) => ({
    at: from + i * every,
    sfx: "key" as Sfx,
  }));

const SCENES: Scene[] = [
  {
    title: "Whole flows, not one screen",
    body: "Upload 2–8 screens in order. It walks the journey and flags lost context, dead ends and steps that go nowhere.",
    line: "Most tools review one screen. Dats Off. walks the whole flow, and finds where people get stuck.",
    dur: 7000,
    cues: [
      ...[0, 1, 2, 3].map((i) => ({ at: 150 + i * 170, sfx: "tick" as Sfx })),
      { at: 1100, sfx: "whoosh" },
      ...[1, 2].map((i) => ({ at: 1100 + (1700 * i) / 3, sfx: "tick" as Sfx })),
      { at: 2850, sfx: "alert" },
      { at: 3650, sfx: "pop" },
    ],
    Film: FlowFilm,
  },
  {
    title: "Fix, re-check, repeat",
    body: "Paste the fix, drop the new screenshot. Each issue is marked fixed, partly fixed or still open, and the score moves.",
    line: "Paste the fix and re-check. It marks what's fixed, and your score goes up.",
    dur: 7000,
    cues: [
      { at: 1500, sfx: "click" },
      { at: 1700, sfx: "whoosh" },
      { at: 2600, sfx: "rise" },
      { at: 2750, sfx: "pop" },
      { at: 3000, sfx: "pop" },
      { at: 3250, sfx: "pop" },
      { at: 3950, sfx: "chime" },
    ],
    Film: RecheckFilm,
  },
  {
    title: "A prompt to paste, and the why",
    body: "Every fix is ready for Cursor, v0, Lovable or Claude, and names the principle behind it, so you learn as you go.",
    line: "Every fix is a prompt for your AI tool, with the principle behind it, so you learn as you go.",
    dur: 7200,
    cues: [
      ...keyCues(300, 2100, 75),
      { at: 2400, sfx: "click" },
      { at: 2600, sfx: "whoosh" },
      { at: 3260, sfx: "pop" },
      { at: 3650, sfx: "chime" },
    ],
    Film: PromptFilm,
  },
];

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function WhyDatsOff() {
  // Read after mount: the server can't know it, and an early read would
  // break hydration.
  const prefersReduced = useReducedMotion();
  const [reduce, setReduce] = useState(false);
  useEffect(() => setReduce(!!prefersReduced), [prefersReduced]);
  const boxRef = useRef<HTMLDivElement>(null);
  const inView = useInView(boxRef, { amount: 0.4 });

  const [scene, setScene] = useState(0);
  const [t, setT] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(false);
  const speaking = useRef(false);
  const tRef = useRef(0);
  const sceneRef = useRef(0);
  const soundRef = useRef(false);

  const playing = inView && !paused && !reduce;

  // Voice-over: one line per scene, spoken from its start.
  const speak = useCallback((i: number) => {
    if (!soundRef.current || typeof window === "undefined" || !("speechSynthesis" in window))
      return;
    const s = window.speechSynthesis;
    s.cancel();
    const u = new SpeechSynthesisUtterance(SCENES[i].line);
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = 1.03;
    speaking.current = true;
    u.onend = u.onerror = () => {
      speaking.current = false;
    };
    s.speak(u);
  }, []);

  const hush = useCallback(() => {
    speaking.current = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
  }, []);

  const go = useCallback(
    (i: number) => {
      sceneRef.current = i;
      tRef.current = 0;
      setScene(i);
      setT(0);
      if (soundRef.current && !reduce) speak(i);
    },
    [reduce, speak],
  );

  // The clock: advances while playing, fires the scene's sound cues as it
  // passes them, and moves on once the scene (and its voice line) is done.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const prev = tRef.current;
      const next = prev + dt;
      const sc = SCENES[sceneRef.current];
      if (soundRef.current)
        for (const c of sc.cues) if (c.at > prev && c.at <= next) playSfx(c.sfx);
      if (next >= sc.dur && !speaking.current) {
        go((sceneRef.current + 1) % SCENES.length);
      } else {
        tRef.current = Math.min(next, sc.dur);
        setT(tRef.current);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing, go]);

  // Out of view or paused: the voice stops too.
  useEffect(() => {
    if (!playing) hush();
  }, [playing, hush]);
  useEffect(() => hush, [hush]);

  const toggleSound = () => {
    const on = !sound;
    setSound(on);
    soundRef.current = on;
    if (on) {
      unlockSfx();
      window.speechSynthesis?.getVoices();
      setPaused(false);
      go(scene); // restart the scene so the voice lines up with it
    } else hush();
  };

  // Reduced motion: each film holds on its last frame.
  const shownT = reduce ? SCENES[scene].dur : t;
  const { Film } = SCENES[scene];

  return (
    <Section
      id="why"
      eyebrow="Why Dats Off."
      title={<>Not another UX critique tool.</>}
      lede="Your AI writes the code fast, and nobody reviews the design. Critique tools hand you a report and leave. Dats Off. stays until it's fixed."
    >
      <div
        ref={boxRef}
        className="grid items-center gap-8 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:gap-10"
      >
        {/* The three points: a ruled list, the playing one open. */}
        <BlurIn className="order-2 md:order-1">
          <ol className="border-t border-border">
            {SCENES.map((s, i) => {
              const on = i === scene;
              return (
                <li key={s.title} className="border-b border-border">
                  <button
                    type="button"
                    aria-expanded={on}
                    onClick={() => go(i)}
                    className="group flex w-full items-baseline gap-4 py-5 text-left"
                  >
                    <span className={TYPE.index}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          TYPE.title,
                          "block transition-colors duration-300",
                          !on && "text-text-tertiary group-hover:text-foreground",
                        )}
                      >
                        {s.title}
                      </span>
                      <span
                        className={cn(
                          "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <span className="overflow-hidden">
                          <span className={cn(TYPE.body, "block pt-2")}>{s.body}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </BlurIn>

        {/* The player: a video in a device-style bezel (a thick rim, a gap,
            then the screen), following the theme via the --st-* tokens. The film
            fills the screen; subtitles and controls float over its bottom
            edge on hover, focus and pause. On touch screens (no hover) they
            sit below the film instead, so they never cover the small film. */}
        <BlurIn delay={0.08} className="order-1 md:order-2">
          <div className="rounded-[34px] border-[5px] border-[var(--st-rim)] bg-[var(--st-gap)] p-[7px] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <div className="group/player relative overflow-hidden rounded-[24px] bg-st-bg ring-1 ring-st/[0.06]">
              <FilmFrame>
                <Film t={shownT} />
              </FilmFrame>

              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--st-bg)_94%,transparent)_0%,color-mix(in_srgb,var(--st-bg)_82%,transparent)_50%,transparent)] pt-16 transition-[opacity,transform] duration-300 ease-out [@media(hover:none)]:static [@media(hover:none)]:bg-none [@media(hover:none)]:pt-2.5",
                  "translate-y-1 opacity-0 group-hover/player:translate-y-0 group-hover/player:opacity-100 group-focus-within/player:translate-y-0 group-focus-within/player:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
                  (paused || reduce) && "translate-y-0 opacity-100",
                )}
              >
                {/* Subtitles, so the film works muted. */}
                <p
                  key={scene}
                  aria-live="polite"
                  className="why-caption px-5 pb-1.5 text-center text-[13px] leading-[1.45] text-st [text-shadow:0_1px_8px_var(--st-bg)] sm:text-[14px]"
                >
                  {SCENES[scene].line}
                </p>

                <div className="flex items-center gap-2.5 px-3 pb-2.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setPaused((p) => !p)}
                    disabled={!!reduce}
                    aria-label={paused ? "Play" : "Pause"}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-st text-st-on transition-transform hover:scale-105 disabled:opacity-50"
                  >
                    {paused || reduce ? (
                      <Play className="ml-px h-3 w-3" fill="currentColor" />
                    ) : (
                      <Pause className="h-3 w-3" fill="currentColor" />
                    )}
                  </button>
                  <div className="flex min-w-0 flex-1 gap-1">
                    {SCENES.map((s, i) => (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => go(i)}
                        aria-label={`Play “${s.title}”`}
                        className="group/bar h-5 flex-1"
                      >
                        <span className="block h-[3px] overflow-hidden rounded-full bg-st/25 transition-colors group-hover/bar:bg-st/35">
                          <span
                            className="block h-full rounded-full bg-st"
                            style={{
                              width: `${i < scene ? 100 : i > scene ? 0 : (shownT / s.dur) * 100}%`,
                            }}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={toggleSound}
                    aria-pressed={sound}
                    aria-label={sound ? "Turn sound off" : "Turn sound on"}
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full backdrop-blur-md transition-colors",
                      sound ? "bg-st/20 text-st" : "bg-st/10 text-st/80 hover:text-st",
                    )}
                  >
                    {sound ? (
                      <Volume2 className="h-3.5 w-3.5" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </BlurIn>
      </div>
    </Section>
  );
}

/** The 640 × 320 film canvas, scaled to the player's width. */
function FilmFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.9);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} aria-hidden className="relative w-full" style={{ height: H * scale }}>
      <div
        className="absolute left-0 top-0 overflow-hidden"
        style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0" }}
      >
        {/* Stage light: a soft top glow, a faint grid, a vignette. */}
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_0%,var(--st-glow)_0%,var(--st-bg)_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--st-fg)_3.5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--st-fg)_3.5%,transparent)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
        <div className="absolute inset-x-0" style={{ top: (H - 320) / 2, height: 320 }}>
          {children}
        </div>
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_var(--st-vignette)]" />
      </div>
    </div>
  );
}

/* ── Timing helpers ─────────────────────────────────────────────────────── */

const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** 0 → 1 over [start, start + dur]. */
const prog = (t: number, start: number, dur: number) => clamp((t - start) / dur);
const out = (x: number) => 1 - (1 - x) ** 3;
const inOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const back = (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

/** Rise in from a blur. */
const enter = (x: number, y = 16): CSSProperties => ({
  opacity: x,
  transform: `translateY(${(1 - x) * y}px)`,
  filter: x < 1 ? `blur(${(1 - x) * 8}px)` : undefined,
});

const ORANGE = "#F26B1D";
const VIOLET = "var(--learn)";

function Pointer({
  x,
  y,
  down,
  opacity = 1,
}: {
  x: number;
  y: number;
  down: boolean;
  opacity?: number;
}) {
  return (
    <svg
      width="22"
      height="24"
      viewBox="0 0 17 18"
      className="absolute drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-[transform,opacity] duration-150"
      style={{
        left: x,
        top: y,
        opacity,
        transform: `scale(${down ? 0.84 : 1})`,
        transformOrigin: "2px 2px",
      }}
    >
      <path
        d="M1.5 1.2 14.8 8.1 8.6 9.6 5.9 15.6Z"
        fill="#fff"
        stroke="#0b0c0e"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── 1. Flow: four screens on a tilted plane, scanned in order ──────────── */

const FLOW_X = [152, 264, 376, 488]; // centred on the 640 canvas (x = 320)
const FLOW_LABELS = ["Sign up", "Verify", "Plan", "Done"];
const TRACK_Y = 248;

function Phone({ i }: { i: number }) {
  return (
    <div className="h-[150px] w-[92px] overflow-hidden rounded-[18px] bg-st-card p-2 shadow-[0_18px_40px_-12px_var(--st-shadow)]">
      <div className="mx-auto h-1 w-6 rounded-full bg-black/15" />
      <div className="mt-2 h-1.5 w-10 rounded-full bg-black/70" />
      {i === 0 && (
        <div className="mt-2.5 space-y-1.5">
          <div className="h-4 rounded-md border border-black/10 bg-white" />
          <div className="h-4 rounded-md border border-black/10 bg-white" />
          <div className="mt-2 h-4 rounded-md bg-[#18181b]" />
        </div>
      )}
      {i === 1 && (
        <div className="mt-3">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="h-5 flex-1 rounded-[5px] border border-black/15 bg-white" />
            ))}
          </div>
          <div className="mt-3 h-4 rounded-md bg-[#18181b]" />
        </div>
      )}
      {i === 2 && (
        <div className="mt-2 space-y-1">
          {[0, 1, 2].map((k) => (
            <div
              key={k}
              className={cn(
                "h-5 rounded-md border bg-white",
                k === 1 ? "border-black/60" : "border-black/10",
              )}
            />
          ))}
          <div className="h-4 rounded-md bg-[#18181b]" />
        </div>
      )}
      {i === 3 && (
        <div className="mt-4 flex flex-col items-center">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-black/80">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div className="mt-2.5 h-1.5 w-12 rounded-full bg-black/25" />
          <div className="mt-1 h-1.5 w-9 rounded-full bg-black/15" />
        </div>
      )}
    </div>
  );
}

function FlowFilm({ t }: { t: number }) {
  const scan = prog(t, 1100, 1700); // the scanner's run, left to right
  const sx = lerp(FLOW_X[0], FLOW_X[3], inOut(scan));
  const hit = t >= 2850;
  const shake = t > 2850 && t < 3250 ? Math.sin((t - 2850) / 16) * 3 * (1 - prog(t, 2850, 400)) : 0;
  const cam = inOut(prog(t, 3000, 1300));
  const badge = back(prog(t, 2900, 450));
  const call = out(prog(t, 3650, 600));
  const reached = (i: number) => t > 1100 && inOut(scan) >= i / 3 - 0.001;

  return (
    <>
      {/* camera: a slow push in, about the centre so the shot stays centred */}
      <div
        className="absolute inset-0"
        style={{ transform: `scale(${1 + 0.06 * cam})`, transformOrigin: "50% 50%" }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: "perspective(1100px) rotateX(14deg)", transformOrigin: "50% 80%" }}
        >
          {/* scanner light */}
          <div
            className="absolute top-[40px] h-[220px] w-[96px] -translate-x-1/2 bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--st-fg)_14%,transparent),transparent)] blur-md transition-opacity duration-300"
            style={{ left: sx, opacity: scan > 0 && scan < 1 ? 1 : 0 }}
          />
          {FLOW_X.map((x, i) => {
            const e = out(prog(t, 150 + i * 170, 650));
            const dead = i === 3 && hit;
            return (
              <div
                key={x}
                className="absolute top-[44px] -translate-x-1/2"
                style={{ left: x + (i === 3 ? shake : 0), ...enter(e, 34) }}
              >
                <div
                  className="rounded-[20px] transition-shadow duration-300"
                  style={{
                    boxShadow: dead
                      ? `0 0 0 2px ${ORANGE}, 0 0 40px 6px rgba(242,107,29,0.45)`
                      : reached(i)
                        ? "0 0 0 1.5px color-mix(in srgb, var(--st-fg) 70%, transparent), 0 0 28px color-mix(in srgb, var(--st-fg) 18%, transparent)"
                        : "0 0 0 1px color-mix(in srgb, var(--st-fg) 8%, transparent)",
                  }}
                >
                  <Phone i={i} />
                </div>
                <p className="mt-3 text-center text-[11px] font-medium text-st/45">
                  {FLOW_LABELS[i]}
                </p>
              </div>
            );
          })}
          {/* the track and the scanner dot */}
          <div
            className="absolute h-px bg-st/12"
            style={{ top: TRACK_Y, left: FLOW_X[0], width: FLOW_X[3] - FLOW_X[0] }}
          />
          <div
            className="absolute h-px"
            style={{
              top: TRACK_Y,
              left: FLOW_X[0],
              width: sx - FLOW_X[0],
              background: `linear-gradient(to right, color-mix(in srgb, var(--st-fg) 10%, transparent), color-mix(in srgb, var(--st-fg) 90%, transparent) 70%, ${hit ? ORANGE : "var(--st-fg)"})`,
            }}
          />
          {FLOW_X.map((x, i) => (
            <span
              key={x}
              className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                top: TRACK_Y,
                left: x,
                background:
                  i === 3 && hit
                    ? ORANGE
                    : reached(i)
                      ? "var(--st-fg)"
                      : "color-mix(in srgb, var(--st-fg) 20%, transparent)",
              }}
            />
          ))}
          {t > 1100 && (
            <span
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                top: TRACK_Y,
                left: sx,
                background: hit ? ORANGE : "var(--st-fg)",
                boxShadow: `0 0 16px 4px ${hit ? "rgba(242,107,29,0.7)" : "color-mix(in srgb, var(--st-fg) 60%, transparent)"}`,
              }}
            />
          )}
          {/* the flag */}
          <span
            className="absolute top-[14px] whitespace-nowrap rounded-[7px] px-2 py-1 text-[11px] font-semibold text-white"
            style={{
              left: FLOW_X[3],
              background: ORANGE,
              opacity: clamp(badge * 2),
              transform: `translateX(-50%) scale(${badge})`,
              boxShadow: "0 8px 20px -6px rgba(242,107,29,0.7)",
            }}
          >
            No way back
          </span>
        </div>
        {/* the finding: inside the camera, centred on the track, so it
              moves with the zoom and stays lined up under the screens */}
        <div
          className="absolute bottom-6 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-st/10 bg-st/[0.07] px-3.5 py-1.5 text-[12px] backdrop-blur-md"
          style={{ left: (FLOW_X[0] + FLOW_X[3]) / 2, ...enter(call, 12) }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: ORANGE }} />
          <span className="font-medium text-st">Dead end at step 4</span>
          <span className="text-st/55">“Done” has no way back to your plan.</span>
        </div>
      </div>
    </>
  );
}

/* ── 2. Re-check: a before/after wipe, pins turn to checks, score climbs ─ */

const PINS = [
  { x: 84, y: 52 }, // "New event" looks like every other button
  { x: 232, y: 52 }, // so do Edit and Email
  { x: 316, y: 94 }, // empty fields, no prompt to fill them
];

function AppScreen({ after }: { after: boolean }) {
  return (
    <div className="absolute inset-0 bg-st-card p-4">
      <div className={cn("h-2.5 w-28 rounded-full", after ? "bg-black/80" : "bg-black/25")} />
      <div
        className={cn("mt-1.5 h-1.5 w-44 rounded-full", after ? "bg-black/35" : "bg-black/12")}
      />
      <div className="mt-4 flex gap-1.5">
        {["New event", "Follow", "Edit", "Email"].map((l, i) => (
          <span
            key={l}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-medium",
              after
                ? i === 0
                  ? "bg-[#18181b] text-white"
                  : "border border-black/10 text-black/55"
                : "border border-black/15 bg-white text-black/35",
            )}
          >
            {l}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {["Phone", "Website", "Industry", "Owner"].map((l) => (
          <div key={l} className="rounded-md border border-black/10 bg-white px-2 py-1.5">
            <p className={cn("text-[8px]", after ? "text-black/60" : "text-black/30")}>{l}</p>
            <p className={cn("mt-0.5 text-[9px]", after ? "text-black/40" : "text-transparent")}>
              + Add {l.toLowerCase()}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 h-14 rounded-md border border-dashed border-black/10" />
    </div>
  );
}

function RecheckFilm({ t }: { t: number }) {
  const inScreen = out(prog(t, 0, 700));
  const inCard = out(prog(t, 250, 700));
  const wipe = inOut(prog(t, 1700, 900));
  const gain = out(prog(t, 2600, 1300));
  const score = Math.round(lerp(61, 84, gain));
  const ring = lerp(0.61, 0.84, gain);
  const delta = back(prog(t, 3950, 450));
  const pressed = t > 1480 && t < 1640;
  // pointer: in from the corner to Re-check, click, then away
  const pIn = inOut(prog(t, 600, 800));
  const pOut = inOut(prog(t, 1900, 600));
  const px = lerp(lerp(660, 506, pIn), 660, pOut);
  const py = lerp(lerp(340, 232, pIn), 340, pOut);
  const R = 44;
  const C = 2 * Math.PI * R;
  const SW = 336; // screen width

  return (
    <>
      {/* the app window */}
      <div
        className="absolute left-8 top-8 h-[256px] overflow-hidden rounded-xl border border-st/10 shadow-[0_30px_60px_-20px_var(--st-shadow)]"
        style={{ width: SW, ...enter(inScreen, 20) }}
      >
        <div className="flex h-6 items-center gap-1.5 bg-st-chrome px-2.5">
          {[0, 1, 2].map((k) => (
            <span key={k} className="h-2 w-2 rounded-full bg-st/20" />
          ))}
          <span className="ml-3 text-[9px] text-st/40">
            {wipe > 0.5 ? "v2" : "v1"} · account page
          </span>
        </div>
        <div className="relative h-[232px]">
          <AppScreen after={false} />
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - wipe * 100}% 0 0)` }}
          >
            <AppScreen after />
          </div>
          {/* the wipe line, with a chromatic edge */}
          {wipe > 0 && wipe < 1 && (
            <div className="absolute inset-y-0" style={{ left: wipe * SW }}>
              <div className="absolute inset-y-0 -left-[4px] w-px bg-[#ff3b5c]/80" />
              <div className="absolute inset-y-0 left-[3px] w-px bg-[#2fd5ff]/80" />
              <div className="absolute inset-y-0 -left-px w-[2px] bg-st shadow-[0_0_18px_4px_color-mix(in_srgb,var(--st-fg)_65%,transparent)]" />
            </div>
          )}
          {/* pins → checks */}
          {PINS.map((p, i) => {
            const fixed = prog(t, 2750 + i * 250, 220);
            const done = fixed > 0.5;
            const pulse = (Math.sin(t / 180 + i) + 1) / 2;
            return (
              <span
                key={i}
                className="absolute grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold transition-transform duration-150"
                style={{
                  left: p.x,
                  top: p.y,
                  background: done ? "var(--st-fg)" : ORANGE,
                  color: done ? "var(--st-on)" : "#fff",
                  transform: `translate(-50%, -50%) scale(${fixed > 0 && fixed < 1 ? 1.3 : 1})`,
                  boxShadow: done
                    ? "0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.25)"
                    : `0 0 0 ${3 + pulse * 5}px rgba(242,107,29,${0.35 - pulse * 0.25})`,
                  opacity: inScreen,
                }}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
            );
          })}
        </div>
      </div>

      {/* the score */}
      <div
        className="absolute right-8 top-8 w-[200px] rounded-2xl border border-st/10 bg-st/[0.05] p-4 backdrop-blur-md"
        style={enter(inCard, 20)}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-st/45">UX score</p>
        <div className="relative mx-auto mt-2 h-[104px] w-[104px]">
          <div
            className="absolute inset-2 rounded-full blur-xl"
            style={{
              background: `color-mix(in srgb, var(--st-fg) ${(4 + gain * 10).toFixed(1)}%, transparent)`,
            }}
          />
          <svg viewBox="0 0 104 104" className="relative h-full w-full -rotate-90">
            <circle
              cx="52"
              cy="52"
              r={R}
              fill="none"
              style={{ stroke: "color-mix(in srgb, var(--st-fg) 10%, transparent)" }}
              strokeWidth="6"
            />
            <circle
              cx="52"
              cy="52"
              r={R}
              fill="none"
              style={{ stroke: "var(--st-fg)" }}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${C * ring} ${C}`}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-[34px] font-semibold leading-none tracking-tight text-st tabular-nums">
              {score}
            </span>
          </div>
          <span
            className="absolute -right-3 top-1 rounded-full bg-st px-1.5 py-0.5 text-[10px] font-semibold text-st-on"
            style={{ opacity: clamp(delta * 2), transform: `scale(${delta})` }}
          >
            +23
          </span>
        </div>
        <p className="mt-2 text-center text-[11px] text-st/60">
          {t < 2750 ? "3 open issues" : t < 3500 ? "Fixing…" : "3 of 3 fixed"}
        </p>
        <span
          className="mt-3 flex h-8 items-center justify-center rounded-lg bg-st text-[12px] font-semibold text-st-on transition-transform duration-100"
          style={{ transform: `scale(${pressed ? 0.95 : 1})` }}
        >
          Re-check
        </span>
      </div>

      <Pointer x={px} y={py} down={pressed} opacity={t > 500 && t < 2500 ? 1 : 0} />
    </>
  );
}

/* ── 3. Prompt: typed, copied, sent to the tool; then the why ───────────── */

const PROMPT =
  "On the account page, make “New event” the one filled primary button. Keep Edit and Email secondary. Don't change the layout.";

const MARKS = TOOLS.flatMap((x) => (x.Mark ? [{ name: x.name, Mark: x.Mark }] : []));
const DOCK_W = MARKS.length * 40 + (MARKS.length - 1) * 10 + 20;
const DOCK_LEFT = (W - DOCK_W) / 2;
const DOCK_TOP = 246;

function PromptFilm({ t }: { t: number }) {
  const inCard = out(prog(t, 0, 600));
  const typed = PROMPT.slice(0, Math.round(PROMPT.length * prog(t, 300, 1800)));
  const copied = t >= 2400;
  const pressed = t > 2380 && t < 2520;
  const pIn = inOut(prog(t, 1900, 450));
  const px = lerp(260, 112, pIn);
  const py = lerp(340, 186, pIn);
  const fly = inOut(prog(t, 2600, 650));
  const dockIn = out(prog(t, 2300, 500));
  const bp = prog(t, 3250, 600);
  const bounce = bp > 0 && bp < 1 ? Math.abs(Math.sin(bp * Math.PI * 2)) * 14 * (1 - bp) : 0;
  const why = out(prog(t, 3650, 700));
  const glow = (Math.sin(t / 260) + 1) / 2;
  const target = { x: DOCK_LEFT + 30, y: DOCK_TOP + 30 };

  return (
    <>
      {/* the prompt */}
      <div
        className="absolute left-7 top-6 w-[300px] rounded-2xl border border-st/10 bg-st/[0.06] p-4 backdrop-blur-md"
        style={enter(inCard, 18)}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-st/50">
            Fix prompt
          </p>
          <span
            className="rounded-[5px] px-1.5 py-0.5 text-[9px] font-semibold text-white"
            style={{ background: ORANGE }}
          >
            Critical
          </span>
        </div>
        <p className="mt-2 h-[86px] font-mono text-[11.5px] leading-[1.55] text-st/90">
          {typed}
          {t < 2300 && (
            <span
              className="ml-px inline-block h-3 w-[6px] translate-y-[2px] bg-st/80"
              style={{ opacity: Math.round(t / 400) % 2 }}
            />
          )}
        </p>
        <span
          className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-st px-3 text-[12px] font-semibold text-st-on transition-transform duration-100"
          style={{ transform: `scale(${pressed ? 0.94 : 1})` }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy prompt"}
        </span>
      </div>

      {/* the copied prompt, flying into the tool */}
      {fly > 0 && fly < 1 && (
        <div
          className="absolute rounded-lg border border-st/25 bg-st/15 px-2 py-1 text-[10px] font-medium text-st shadow-[0_0_24px_color-mix(in_srgb,var(--st-fg)_25%,transparent)] backdrop-blur"
          style={{
            left: lerp(64, target.x - 28, fly),
            top: lerp(172, target.y - 12, fly) - Math.sin(fly * Math.PI) * 40,
            transform: `scale(${lerp(1, 0.4, fly)})`,
            opacity: 1 - fly * 0.5,
          }}
        >
          Fix prompt
        </div>
      )}

      {/* the dock */}
      <div
        className="absolute flex gap-2.5 rounded-[20px] border border-st/10 bg-st/[0.07] p-2.5 backdrop-blur-xl"
        style={{ left: DOCK_LEFT, top: DOCK_TOP, ...enter(dockIn, 14) }}
      >
        {MARKS.map(({ name, Mark }, i) => (
          <span
            key={name}
            className="relative grid h-10 w-10 place-items-center rounded-xl bg-st-tile text-st shadow-[inset_0_1px_0_color-mix(in_srgb,var(--st-fg)_8%,transparent)] ring-1 ring-st/[0.08]"
            style={{ transform: `translateY(${i === 0 ? -bounce : 0}px)` }}
          >
            <Mark className="h-5 w-5" />
            {i === 0 && t > 3250 && (
              <span className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-st/80" />
            )}
          </span>
        ))}
      </div>

      {/* the why */}
      <div
        className="absolute right-7 top-6 w-[236px] rounded-2xl border border-st/10 bg-st/[0.06] p-4 backdrop-blur-md"
        style={enter(why, 22)}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-st/50">
          Why it works
        </p>
        <p className="mt-1.5 text-[14px] font-semibold text-st">Von Restorff effect</p>
        <p className="mt-1 text-[11.5px] leading-[1.5] text-st/60">
          The one thing that looks different is the one people notice.
        </p>
        <p
          className="mt-3 flex items-center gap-1.5 text-[11.5px] font-medium"
          style={{ color: VIOLET }}
        >
          <span className="relative grid place-items-center">
            <span
              className="absolute h-5 w-5 rounded-full"
              style={{
                background: VIOLET,
                opacity: 0.25 * glow,
                transform: `scale(${1 + glow * 0.5})`,
              }}
            />
            <PlayCircle className="relative h-4 w-4" />
          </span>
          Watch · 3 min <span className="font-normal text-st/40">· NN/g</span>
        </p>
      </div>

      <Pointer x={px} y={py} down={pressed} opacity={t > 1850 && t < 2700 ? 1 : 0} />
    </>
  );
}

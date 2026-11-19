import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Check,
  Contrast,
  Hand,
  Layers,
  MessageSquareText,
  Plus,
  Route as RouteIcon,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PointerEvent, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";
import { BlurIn, Card, CountUp, IconBadge, Section, useLoopStep } from "./primitives";
import { TYPE } from "./type";

// What it catches: six kinds of problem in a 3 × 2 grid. Each card has a
// small dark stage, lit like the "Why Dats Off." films, that loops its own
// problem → fix while on screen, with a cursor spotlight on hover. Then the
// two-pass engine behind it. See design-system/organisms/what-it-catches.md.

const ORANGE = "#F26B1D";

export function WhatItCatches() {
  return (
    <Section
      id="what-it-catches"
      eyebrow="What it catches"
      title={<>The stuff users feel, but can&rsquo;t name</>}
      lede="Six kinds of problems it's built to spot, and the ones that quietly cost you signups."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t, i) => (
          <BlurIn key={t.title} delay={(i % 3) * 0.06} className="h-full">
            <CatchCard {...t} />
          </BlurIn>
        ))}
      </div>
    </Section>
  );
}

function CatchCard({
  icon,
  title,
  body,
  Visual,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  Visual: () => ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  // The spotlight follows the pointer across the stage.
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <Card className="group h-full p-2">
      <div
        ref={stageRef}
        onPointerMove={onMove}
        className="relative h-[208px] overflow-hidden rounded-[18px] bg-st-bg ring-1 ring-black/5 dark:ring-white/[0.06]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(90%_75%_at_50%_0%,var(--st-glow)_0%,var(--st-bg)_72%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--st-fg)_4%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--st-fg)_4%,transparent)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 [background:radial-gradient(220px_circle_at_var(--mx,50%)_var(--my,50%),color-mix(in_srgb,var(--st-fg)_9%,transparent),transparent_70%)] group-hover:opacity-100" />
        <Visual />
      </div>
      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={icon} />
          <h3 className={TYPE.title}>{title}</h3>
        </div>
        <p className={cn(TYPE.body, "mt-2")}>{body}</p>
      </div>
    </Card>
  );
}

const TILES = [
  {
    icon: Contrast,
    title: "Contrast & readability",
    body: "Text and controls that fail WCAG contrast, tiny type, and labels that vanish on real screens.",
    Visual: ContrastVisual,
  },
  {
    icon: Hand,
    title: "Tap targets",
    body: "Links and icon buttons below the 44×44px minimum that cause mis-taps on touch screens.",
    Visual: TapVisual,
  },
  {
    icon: Layers,
    title: "Visual hierarchy",
    body: "When five buttons look equally important, nobody knows what to do next. It finds the one that should win.",
    Visual: HierarchyVisual,
  },
  {
    icon: MessageSquareText,
    title: "UX copy",
    body: "Vague CTAs, jargon, and error messages that don't say how to recover.",
    Visual: CopyVisual,
  },
  {
    icon: Bell,
    title: "Feedback & states",
    body: "Missing loading, empty, success, and error states, so users stop wondering whether it worked.",
    Visual: StatesVisual,
  },
  {
    icon: RouteIcon,
    title: "Flow dead ends",
    body: "In flow mode it walks the screens in order, flagging lost context, redundant steps, and screens with no way back.",
    Visual: FlowVisual,
  },
];

// Each stage loops problem → fix while on screen (useLoopStep); the last
// step is the fixed state, which reduced motion shows. Greys, with orange
// only on the problem, and a red/cyan split only as an effect.

const SPRING = { type: "spring", stiffness: 260, damping: 20 } as const;
const EASE = [0.22, 1, 0.36, 1] as const;

/** A visual's layer: fills the stage, centres its content above the note. */
function Stage({ stageRef, children }: { stageRef: Ref<HTMLDivElement>; children: ReactNode }) {
  return (
    <div
      ref={stageRef}
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 pb-8"
    >
      {children}
    </div>
  );
}

/** The status chip in a stage's corner: orange while it's a problem. */
function StageNote({ issue, children }: { issue: boolean; children: ReactNode }) {
  return (
    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-st/10 bg-st/[0.06] px-2.5 py-1 text-[11px] font-medium text-st/80 backdrop-blur-md">
      <span
        className="h-1.5 w-1.5 rounded-full transition-colors duration-500"
        style={{ background: issue ? ORANGE : "var(--st-fg)" }}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={String(children)}
          initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Low-contrast text splits into red and cyan, then snaps crisp. */
function ContrastVisual() {
  const { ref, step } = useLoopStep(2, 2100);
  const fixed = step === 1;
  const split = (dir: 1 | -1) => ({
    x: fixed ? 0 : [3 * dir, 5 * dir, 2 * dir, 4 * dir, 3 * dir],
    opacity: fixed ? 0 : 0.85,
  });
  const loop = fixed
    ? { duration: 0.45, ease: EASE }
    : { duration: 0.7, repeat: Infinity, ease: "linear" as const };
  return (
    <Stage stageRef={ref}>
      <div className="relative font-display text-[68px] leading-none">
        <motion.span
          aria-hidden
          animate={split(-1)}
          transition={loop}
          className="absolute inset-0 text-[#ff3b5c] mix-blend-multiply dark:mix-blend-screen"
        >
          Aa
        </motion.span>
        <motion.span
          aria-hidden
          animate={split(1)}
          transition={loop}
          className="absolute inset-0 text-[#2fd5ff] mix-blend-multiply dark:mix-blend-screen"
        >
          Aa
        </motion.span>
        {/* A CSS transition, since the colours are theme variables. */}
        <span
          className="relative transition-[color,text-shadow] duration-500"
          style={{
            color: fixed ? "var(--st-fg)" : "var(--st-dim)",
            textShadow: fixed
              ? "0 0 28px color-mix(in srgb, var(--st-fg) 30%, transparent)"
              : "0 0 0 transparent",
          }}
        >
          Aa
        </span>
      </div>
      <div className="w-[150px]">
        <div className="h-1 overflow-hidden rounded-full bg-st/10">
          <motion.div
            animate={{ width: fixed ? "100%" : "15%" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="h-full rounded-full"
            style={{ background: fixed ? "var(--st-fg)" : ORANGE }}
          />
        </div>
      </div>
      <StageNote issue={!fixed}>
        <Ticker value={fixed ? 12.6 : 1.9} />
        :1 · {fixed ? "AA pass" : "Fails AA"}
      </StageNote>
    </Stage>
  );
}

/** Counts smoothly to `value` (one decimal) whenever it changes. */
function Ticker({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const c = animate(from.current, value, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (v) => {
        from.current = v;
        setShown(v);
      },
    });
    return () => c.stop();
  }, [value]);
  return <>{shown.toFixed(1)}</>;
}

/** A radar sweeps a 24px button, which then grows to the 44px guide. */
function TapVisual() {
  const { ref, step } = useLoopStep(2, 2000);
  const fixed = step === 1;
  const size = fixed ? 44 : 24;
  return (
    <Stage stageRef={ref}>
      <div className="relative grid h-[120px] w-[200px] place-items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            className="catch-radar absolute h-11 w-11 rounded-full border border-st/25"
            style={{ animationDelay: `${i * 0.7}s` }}
          />
        ))}
        <span className="absolute h-11 w-11 rounded-[12px] border border-dashed border-st/35" />
        <motion.span
          animate={{ width: size, height: size, borderRadius: fixed ? 12 : 7 }}
          transition={SPRING}
          className="relative grid place-items-center bg-st text-st-on shadow-[0_0_28px_color-mix(in_srgb,var(--st-fg)_30%,transparent)]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </motion.span>
        <AnimatePresence>
          {fixed && (
            <motion.span
              key="ripple"
              aria-hidden
              initial={{ scale: 0.5, opacity: 0.55 }}
              animate={{ scale: 2.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
              className="absolute h-11 w-11 rounded-full bg-st/40"
            />
          )}
        </AnimatePresence>
        {/* the redline: a measured height beside the button */}
        <div className="absolute left-[calc(50%+34px)] top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          <motion.span
            animate={{ height: size }}
            transition={SPRING}
            className="w-[5px] border-y border-r"
            style={{
              borderColor: fixed ? "color-mix(in srgb, var(--st-fg) 70%, transparent)" : ORANGE,
            }}
          />
          <span
            className="text-[11px] font-semibold tabular-nums"
            style={{ color: fixed ? "var(--st-fg)" : ORANGE }}
          >
            {size}px
          </span>
        </div>
      </div>
      <StageNote issue={!fixed}>{fixed ? "44 × 44, easy to hit" : "Too small to tap"}</StageNote>
    </Stage>
  );
}

/** Four equal buttons; one becomes the primary, with a sheen. */
function HierarchyVisual() {
  const { ref, step } = useLoopStep(2, 2000);
  const fixed = step === 1;
  return (
    <Stage stageRef={ref}>
      <div className="flex gap-1.5">
        {["Edit", "Follow", "Email", "New event"].map((l) => {
          const primary = l === "New event";
          const win = fixed && primary;
          return (
            <motion.span
              key={l}
              animate={{ scale: win ? 1.08 : 1, opacity: fixed && !primary ? 0.45 : 1 }}
              transition={SPRING}
              className={cn(
                "relative overflow-hidden rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-500",
                win
                  ? "border-st bg-st text-st-on shadow-[0_8px_30px_-6px_color-mix(in_srgb,var(--st-fg)_45%,transparent)]"
                  : "border-st/15 bg-st/[0.06] text-st/70",
              )}
            >
              {l}
              {win && (
                <motion.span
                  aria-hidden
                  initial={{ x: "-120%" }}
                  animate={{ x: "120%" }}
                  transition={{ duration: 0.9, delay: 0.25, ease: "easeInOut" }}
                  className="absolute inset-0 bg-[linear-gradient(105deg,transparent_30%,rgba(24,24,27,0.18)_50%,transparent_70%)]"
                />
              )}
            </motion.span>
          );
        })}
      </div>
      <StageNote issue={!fixed}>{fixed ? "One clear next step" : "Four equal choices"}</StageNote>
    </Stage>
  );
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz#%&*+=?/<>";

/** Decodes into `text`, left to right, whenever it changes. */
function Scramble({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 750);
      const n = Math.floor(p * text.length);
      setShown(
        text.slice(0, n) +
          [...text.slice(n)]
            .map((c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join(""),
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, reduce]);
  return <>{reduce ? text : shown}</>;
}

/** "Submit" is struck, then decodes into what the button actually does. */
function CopyVisual() {
  const { ref, step } = useLoopStep(2, 2300);
  const fixed = step === 1;
  return (
    <Stage stageRef={ref}>
      <div className="relative overflow-hidden rounded-[10px] p-px">
        {/* a light that runs the border once it's fixed */}
        <span
          aria-hidden
          className={cn(
            "absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 animate-[spin_2.6s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_250deg,color-mix(in_srgb,var(--st-fg)_95%,transparent)_330deg,transparent_360deg)] transition-opacity duration-500 motion-reduce:animate-none",
            fixed ? "opacity-100" : "opacity-0",
          )}
        />
        <span
          className={cn(
            "relative flex h-10 min-w-[150px] items-center justify-center rounded-[9px] px-4 font-mono text-[13px] font-medium transition-colors duration-500",
            fixed ? "bg-st-tile text-st" : "bg-st-tile text-st/55",
          )}
        >
          <span className="relative">
            <Scramble text={fixed ? "Create account" : "Submit"} />
            {!fixed && (
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="absolute inset-x-0 top-1/2 h-px origin-left"
                style={{ background: ORANGE }}
              />
            )}
          </span>
        </span>
      </div>
      <StageNote issue={!fixed}>{fixed ? "Says what happens next" : "Vague CTA"}</StageNote>
    </Stage>
  );
}

/** Save → a spinner → saved, with a glow and a toast. */
function StatesVisual() {
  const { ref, step } = useLoopStep(3, 1400);
  return (
    <Stage stageRef={ref}>
      <div className="relative flex flex-col items-center">
        <AnimatePresence>
          {step === 2 && (
            <motion.span
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: EASE }}
              className="absolute -top-12 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-st/10 bg-st/[0.08] px-2.5 py-1 text-[11px] text-st/85 backdrop-blur-md"
            >
              <Check className="h-3 w-3" /> Changes saved
            </motion.span>
          )}
        </AnimatePresence>
        <motion.span
          layout
          transition={SPRING}
          className={cn(
            "relative flex h-10 items-center justify-center gap-2 overflow-visible rounded-full px-5 text-[13px] font-semibold transition-colors duration-300",
            step === 0 ? "bg-st text-st-on" : "bg-st/[0.08] text-st",
          )}
        >
          {step === 2 && (
            <motion.span
              aria-hidden
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border border-st/60"
            />
          )}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={step}
              initial={{ opacity: 0, scale: 0.6, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.6, filter: "blur(4px)" }}
              transition={{ duration: 0.25 }}
              className="inline-flex items-center gap-2"
            >
              {step === 0 && "Save changes"}
              {step === 1 && (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full bg-[conic-gradient(from_0deg,transparent_10%,var(--st-fg))] [mask:radial-gradient(circle,transparent_52%,#000_56%)] motion-reduce:animate-none" />
                  Saving…
                </>
              )}
              {step === 2 && (
                <>
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-st text-st-on shadow-[0_0_18px_color-mix(in_srgb,var(--st-fg)_60%,transparent)]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  Saved
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </div>
      <StageNote issue={step === 0}>
        {step === 0 ? "Did it work?" : step === 1 ? "Loading state" : "Success state"}
      </StageNote>
    </Stage>
  );
}

/** Three screens on a live path; the last is a dead end until a way back is drawn. */
function FlowVisual() {
  // Four beats, the fixed one held for two.
  const { ref, step } = useLoopStep(4, 1300);
  const dead = step === 1;
  const fixed = step >= 2;
  const NX = [34, 114, 194];
  const back = "M194 62 C 194 96, 114 96, 114 62";
  return (
    <Stage stageRef={ref}>
      <div className="relative">
        <svg width="228" height="110" viewBox="0 0 228 110" className="overflow-visible">
          <defs>
            <linearGradient
              id="catch-flow"
              gradientUnits="userSpaceOnUse"
              x1="56"
              x2="172"
              y1="0"
              y2="0"
            >
              <stop offset="0" style={{ stopColor: "var(--st-fg)", stopOpacity: 0.15 }} />
              <stop offset="1" style={{ stopColor: "var(--st-fg)", stopOpacity: 0.8 }} />
            </linearGradient>
          </defs>
          {/* the forward path, flowing */}
          <path
            id="catch-forward"
            d={`M${NX[0] + 22} 40 L${NX[2] - 22} 40`}
            stroke="url(#catch-flow)"
            strokeWidth="1.5"
            strokeDasharray="4 5"
            className="catch-dash"
            fill="none"
          />
          {/* the way back */}
          <motion.path
            d={back}
            fill="none"
            style={{ stroke: "var(--st-fg)" }}
            strokeWidth="1.5"
            initial={false}
            animate={{ pathLength: fixed ? 1 : 0, opacity: fixed ? 1 : 0 }}
            transition={{ duration: fixed ? 0.7 : 0.2, ease: EASE }}
          />
          {NX.map((x, i) => {
            const end = i === 2;
            const flagged = end && dead;
            return (
              <g key={x}>
                <rect
                  x={x - 22}
                  y={18}
                  width={44}
                  height={44}
                  rx={10}
                  strokeWidth={flagged ? 1.5 : 1}
                  style={{
                    fill: "var(--st-tile)",
                    stroke: flagged
                      ? ORANGE
                      : end && fixed
                        ? "var(--st-fg)"
                        : "color-mix(in srgb, var(--st-fg) 20%, transparent)",
                    filter: flagged ? `drop-shadow(0 0 10px ${ORANGE})` : undefined,
                    transition: "stroke 300ms",
                  }}
                />
                <rect
                  x={x - 12}
                  y={28}
                  width={16}
                  height={3}
                  rx={1.5}
                  style={{ fill: "color-mix(in srgb, var(--st-fg) 55%, transparent)" }}
                />
                <rect
                  x={x - 12}
                  y={35}
                  width={24}
                  height={2}
                  rx={1}
                  style={{ fill: "color-mix(in srgb, var(--st-fg) 18%, transparent)" }}
                />
                <rect
                  x={x - 12}
                  y={46}
                  width={24}
                  height={6}
                  rx={2}
                  style={{ fill: "color-mix(in srgb, var(--st-fg) 28%, transparent)" }}
                />
              </g>
            );
          })}
          {/* the walker: along the flow, then along the way back */}
          {!fixed && (
            <circle
              r="3"
              style={{ fill: "var(--st-fg)", filter: "drop-shadow(0 0 6px var(--st-fg))" }}
            >
              <animateMotion
                dur="1.3s"
                repeatCount="indefinite"
                path={`M${NX[0]} 40 L${NX[2] - 24} 40`}
              />
            </circle>
          )}
          {fixed && (
            <circle
              r="3"
              style={{ fill: "var(--st-fg)", filter: "drop-shadow(0 0 6px var(--st-fg))" }}
            >
              <animateMotion dur="1.2s" begin="0.6s" repeatCount="indefinite" path={back} />
            </circle>
          )}
        </svg>
        {dead && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: [0, -3, 3, -2, 0] }}
            transition={{ duration: 0.4 }}
            className="absolute left-[202px] top-[8px] grid h-5 w-5 place-items-center rounded-full text-white"
            style={{ background: ORANGE }}
          >
            <X className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        )}
      </div>
      <StageNote issue={!fixed}>
        {fixed ? "Way back added" : dead ? "Dead end at step 3" : "Walking the flow…"}
      </StageNote>
    </Stage>
  );
}

const PASS_1 = [
  "Contrast below 4.5:1 (WCAG 1.4.3)",
  "Touch targets under 44×44px (Fitts' Law)",
  "Primary CTA not visually distinct (Von Restorff)",
  "No undo, back, or cancel (Nielsen #3)",
  "Errors that don't explain the fix (Nielsen #9)",
  "More than 7 ungrouped options (Hick's Law)",
];
const PASS_2 = [
  "Does the copy match how your users think?",
  "Is the most important thing visually dominant?",
  "Is there a faster path for experienced users?",
  "Can users fail gracefully, or do errors strand them?",
];

const STATS = [
  { value: 12, label: "Rule checks in the first pass" },
  { value: 8, label: "Judgment calls in the second" },
  { value: 3, label: "Questions at most, often none" },
  { value: 1, label: "Fix prompt for every issue" },
];

export function Engine() {
  return (
    <Section
      id="engine"
      eyebrow="Under the hood"
      title={<>Two passes. No generic advice.</>}
      lede="First it checks hard rules. Then it judges the screen in context: your product, your users, the task this screen is for. It only reports what it can see in your screenshot."
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-y border-border py-10 sm:grid-cols-4">
        {STATS.map((st, i) => (
          <BlurIn key={st.label} delay={i * 0.08}>
            <div className={TYPE.number}>
              <CountUp to={st.value} />
            </div>
            <p className={cn(TYPE.list, "mt-3")}>{st.label}</p>
          </BlurIn>
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <BlurIn className="h-full">
          <Card className="h-full p-6">
            <div className={TYPE.index}>Pass 1</div>
            <h3 className={cn(TYPE.title, "mt-2")}>Rule engine</h3>
            <p className={cn(TYPE.body, "mt-1.5")}>
              Deterministic checks against named heuristics and accessibility rules.
            </p>
            <ul className="mt-5 divide-y divide-border border-t border-border">
              {PASS_1.map((r, i) => (
                <motion.li
                  key={r}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className={cn(TYPE.list, "flex items-center gap-2.5 py-2.5")}
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />
                  {r}
                </motion.li>
              ))}
            </ul>
          </Card>
        </BlurIn>
        <BlurIn delay={0.1} className="h-full">
          <Card className="h-full p-6">
            <div className={TYPE.index}>Pass 2</div>
            <h3 className={cn(TYPE.title, "mt-2")}>Judgment</h3>
            <p className={cn(TYPE.body, "mt-1.5")}>
              The questions a senior designer asks, answered for your product and users.
            </p>
            <ul className="mt-5 divide-y divide-border border-t border-border">
              {PASS_2.map((r, i) => (
                <motion.li
                  key={r}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className={cn(TYPE.list, "py-2.5")}
                >
                  {r}
                </motion.li>
              ))}
            </ul>
            <p className={cn(TYPE.list, "mt-5 rounded-xl bg-bg-elevated px-4 py-3")}>
              <span className="font-semibold text-foreground">Plus what you did right.</span> Every
              review calls out 2–3 wins and the principle each one follows, so you know what to
              keep.
            </p>
          </Card>
        </BlurIn>
      </div>
    </Section>
  );
}

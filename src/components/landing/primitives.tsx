import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import type { MotionValue } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TYPE } from "./type";

// Shared building blocks for the landing sections (see
// design-system/molecules/landing-primitives.md): one section header, one
// card, and the four scroll behaviours — blur-in, line draw, scroll-scrubbed
// text, count-up — so every section moves the same way.

const EASE = [0.22, 1, 0.36, 1] as const;

/** The one page column every landing section aligns to. */
export const COLUMN = "mx-auto w-full max-w-[960px]";

/** Section shell: a left-aligned header in the page column, then content. */
export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
  className,
  accent = "primary",
}: {
  id?: string;
  /** The eyebrow dot: orange, or violet for the learning section. */
  accent?: "primary" | "learn";
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24", className)}>
      <div className={COLUMN}>
        {/* data-fx="drift": the header lags the content a little (scroll-fx.ts). */}
        <div data-fx="drift">
          <Eyebrow accent={accent}>{eyebrow}</Eyebrow>
          <BlurIn>
            <h2 className={cn(TYPE.section, "max-w-[680px]")}>
              <GlossText>{title}</GlossText>
            </h2>
          </BlurIn>
          {lede && (
            <BlurIn delay={0.08}>
              <p className={cn(TYPE.lede, "mt-4 max-w-[560px]")}>{lede}</p>
            </BlurIn>
          )}
        </div>
        {children && <div className="mt-12">{children}</div>}
      </div>
    </section>
  );
}

/** "• Label ————" — orange (or learn violet) dot, label, and a rule that draws in on view. */
export function Eyebrow({
  children,
  accent = "primary",
}: {
  children: ReactNode;
  accent?: "primary" | "learn";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  return (
    <div ref={ref} className="mb-5 flex items-center gap-3">
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          accent === "learn" ? "bg-learn" : "bg-primary",
        )}
      />
      <span className={cn(TYPE.label, "shrink-0")}>{children}</span>
      <motion.span
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : undefined}
        transition={{ duration: 1, ease: EASE, delay: 0.1 }}
        className="ml-3 h-px flex-1 origin-left bg-border-strong"
      />
    </div>
  );
}

/**
 * Glossy heading text: a grey gradient clipped to the letters, with a light
 * sheen that sweeps across as the heading scrolls into the reading zone
 * (and back if you scroll up). Replaces the old two-tone accent phrases.
 */
export function GlossText({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 95%", "start 35%"] });
  const x = useTransform(scrollYProgress, [0, 1], [100, reduce ? 100 : 0]);
  const backgroundPosition = useMotionTemplate`${x}% 0, 0 0, 0 0`;
  return (
    <motion.span
      ref={ref}
      style={{ backgroundPosition }}
      className={cn("gloss-heading", className)}
    >
      {children}
    </motion.span>
  );
}

/**
 * The shared icon gradient: brand orange at the top-left fading diagonally
 * into grey. Render once per page (Landing does); IconBadge references it.
 */
/**
 * Icon tile: a small raised white key on the card paper — hairline edge, a
 * top highlight and a soft contact shadow — with a thin foreground icon.
 * Neutral on purpose: the accent is saved for the one emphasis per view.
 */
export function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-border bg-bg-tertiary text-foreground",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,17,20,0.06),0_4px_10px_-4px_rgba(15,17,20,0.08)]",
        "dark:bg-bg-elevated dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.5)]",
      )}
    >
      <Icon className="h-[17px] w-[17px]" strokeWidth={1.6} />
    </span>
  );
}

/** Filled accent circle with a white tick and no outline (feature lists). */
export function CheckDot({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={cn("h-5 w-5 shrink-0", className)}>
      <circle cx="10" cy="10" r="10" className="fill-primary" />
      <path
        d="M6 10.3l2.6 2.6L14 7.5"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Filled accent shield with a white check: trust / "free, no sign-up" cues. */
export function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("h-4 w-4 shrink-0", className)}>
      <path
        d="M12 2.25l7.75 2.9v6.1c0 4.75-3.2 8.9-7.75 10.5-4.55-1.6-7.75-5.75-7.75-10.5v-6.1L12 2.25z"
        className="fill-primary"
        strokeLinejoin="round"
      />
      <path
        d="M8.4 12.1l2.45 2.45 4.75-4.8"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Rises out of a soft blur the first time it scrolls into view. */
export function BlurIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Kept for sections that want a plain fade-up without the blur. */
export const Reveal = BlurIn;

/**
 * A statement that fills in letter by letter as it scrolls through the
 * viewport. Words wrapped in `[[…]]` fill to the accent instead of the text
 * colour.
 */
export function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });

  const chars: { ch: string; accent: boolean }[] = [];
  let accent = false;
  for (const part of text.split(/(\[\[|\]\])/)) {
    if (part === "[[") accent = true;
    else if (part === "]]") accent = false;
    else for (const ch of part) chars.push({ ch, accent });
  }

  // Group characters by word so lines only break between words.
  const words: { ch: string; accent: boolean; i: number }[][] = [[]];
  chars.forEach((c, i) => {
    if (c.ch === " ") words.push([]);
    else words[words.length - 1].push({ ...c, i });
  });

  return (
    <p ref={ref} className={className}>
      {words.map((w, wi) => (
        <span key={wi}>
          <span className="inline-block whitespace-nowrap">
            {w.map((c) => (
              <ScrubChar
                key={c.i}
                ch={c.ch}
                accent={c.accent}
                progress={scrollYProgress}
                range={[c.i / chars.length, (c.i + 1) / chars.length]}
              />
            ))}
          </span>
          {wi < words.length - 1 && " "}
        </span>
      ))}
    </p>
  );
}

function ScrubChar({
  ch,
  accent,
  progress,
  range,
}: {
  ch: string;
  accent: boolean;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span style={{ opacity }} className={accent ? "text-primary" : "text-foreground"}>
      {ch}
    </motion.span>
  );
}

/**
 * Steps 0 → steps-1 every `ms`, looping, but only while the element is on
 * screen. Drives the micro-animations inside mocks so they replay as you
 * look at them. Under reduced motion it holds on the last (resolved) step.
 */
export function useLoopStep<T extends Element = HTMLDivElement>(steps: number, ms: number) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { amount: 0.5 });
  // Reduced motion is read after mount, so the server and the first client
  // render agree (step 0) and hydration holds.
  const prefersReduced = useReducedMotion();
  const [reduce, setReduce] = useState(false);
  useEffect(() => setReduce(!!prefersReduced), [prefersReduced]);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduce || !inView) return;
    const id = setInterval(() => setStep((s) => (s + 1) % steps), ms);
    return () => clearInterval(id);
  }, [inView, reduce, steps, ms]);
  return { ref, step: reduce ? steps - 1 : step, inView };
}

/** Counts from 0 to `to` the first time it scrolls into view. */
export function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

/**
 * Textured paper card: 24px radius, grain, a white hairline edge, shadow-sm.
 * data-fx="card": every landing card rises into place as it scrolls in,
 * staggered by column (scroll-fx.ts).
 */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-fx="card" className={cn("bg-grain surface-card rounded-3xl", className)}>
      {children}
    </div>
  );
}

/** Small textured tile, e.g. the tools row. */
export function Tile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-grain surface-card grid place-items-center rounded-2xl transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The inset UI mock inside a feature card, with a faint accent glow. */
export function MockFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-bg-tertiary shadow-sm",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background: "radial-gradient(80% 70% at 50% 100%, var(--mock-glow), transparent)",
        }}
      />
      {/* data-fx="float": the mock drifts a little inside its frame as the
          page scrolls, so the card has depth (scroll-fx.ts). */}
      <div data-fx="float" className="relative h-full">
        {children}
      </div>
    </div>
  );
}

/** Pill tabs: the selected tab is filled with the text colour, not the accent. */
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  layoutId,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  layoutId: string;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex shrink-0 gap-1 rounded-lg border border-border bg-bg-tertiary p-1 shadow-sm"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative isolate h-8 whitespace-nowrap rounded-md px-3.5 text-[14px] font-medium transition-colors",
            value === t.id ? "text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {value === t.id && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 -z-10 rounded-md bg-foreground"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
          {t.label}
        </button>
      ))}
    </div>
  );
}

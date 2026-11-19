import { motion, useMotionTemplate, useReducedMotion, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

// Engraved scenery (see design-system/organisms/scenery.md). The art lives in
// /public/illustrations as alpha-only WebPs — no color — and is used as a CSS
// mask over a `bg-ink` fill, so the ink follows the theme and the page grain
// shows through the "paper". Dark mode swaps in a scratchboard mask. A second
// gradient mask fades the edges into the page.

const ASPECT = "aspect-[1536/864]";

const FADES = {
  bottom: "linear-gradient(to bottom, #000 82%, transparent)",
  both: "linear-gradient(to bottom, transparent, #000 14%, #000 84%, transparent)",
};

/**
 * Mask variables for an `.ink-art` element (styles.css). Each scene has two
 * masks: `name.webp` (ink strokes, for light paper) and `name-dark.webp` (a
 * scratchboard version where lit areas are the lines and shadows stay dark,
 * so the dark theme reads as a moonlit print instead of a photo negative).
 */
function inkMask(name: string, fade: keyof typeof FADES) {
  return {
    "--art-light": `url(/illustrations/${name}.webp)`,
    "--art-dark": `url(/illustrations/${name}-dark.webp)`,
    "--art-fade": FADES[fade],
  } as React.CSSProperties;
}

/**
 * The hero: launch day at a shipyard. Makers hammer away on the left; on the
 * right an inspector with a magnifier pins a flag on every flaw in the hull
 * before the passengers (the users) queuing at the gangway come aboard.
 * Sharpens out of a blur on load; as the hero scrolls
 * away (`progress` 0 → 1) it drifts down, grows slightly and blurs again.
 */
export function HeroScene({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const blurPx = useTransform(progress, [0, 1], [0, reduce ? 0 : 10]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;
  const y = useTransform(progress, [0, 1], [0, reduce ? 0 : 120]);
  const scale = useTransform(progress, [0, 1], [1, reduce ? 1 : 1.08]);
  const opacity = useTransform(progress, [0.2, 1], [1, reduce ? 1 : 0.35]);

  return (
    <motion.div
      aria-hidden
      style={{ y, scale, filter, opacity }}
      className="pointer-events-none absolute bottom-0 left-1/2 w-[max(100%,700px)] -translate-x-1/2 origin-bottom"
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, filter: "blur(14px)", scale: 1.04 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(ASPECT, "ink-art w-full bg-ink")}
        style={inkMask("hero-scene", "bottom")}
      />
    </motion.div>
  );
}

/**
 * The closing frame — the inspected ship sails out past a lighthouse while
 * the town waves from the pier. Three strips: the lighthouse and the pier
 * slide in from the sides like a stage curtain, while the centre strip (the
 * ship on the horizon) rises gently into place, so the ship is never split.
 * All three come into focus as the section scrolls in (`progress` 0 → 1).
 */
export function CtaScene({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  // Everything settles by 85% so the strips are sharp and aligned (no seams)
  // well before the section is centred.
  const shift = useTransform(progress, [0, 0.85], [reduce ? 0 : 90, 0]);
  const shiftLeft = useTransform(shift, (v) => -v);
  const rise = useTransform(progress, [0, 0.85], [reduce ? 0 : 36, 0]);
  const blurPx = useTransform(progress, [0, 0.85], [reduce ? 0 : 12, 0]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;
  const opacity = useTransform(progress, [0, 0.6], [reduce ? 1 : 0.15, 1]);
  // Once settled the strips line up exactly, so swap them for one unsplit
  // drawing: clip edges can leave faint hairlines across the sea otherwise.
  const settled = useTransform(progress, (v) => (reduce || v >= 0.85 ? 1 : 0));
  const unsettled = useTransform(settled, (v) => 1 - v);

  // Neighbouring strips overlap by 0.2% so anti-aliased clip edges never
  // leave a hairline gap across the sea.
  const CLIPS = {
    left: "inset(0 61.9% 0 0)",
    centre: "inset(0 37.9% 0 37.9%)",
    right: "inset(0 0 0 61.9%)",
  } as const;

  const strip = (part: keyof typeof CLIPS) => (
    <motion.div
      style={{
        x: part === "left" ? shiftLeft : part === "right" ? shift : 0,
        y: part === "centre" ? rise : 0,
        filter,
        opacity,
      }}
      className={cn(ASPECT, "absolute inset-x-0 bottom-0")}
    >
      <div
        className="ink-art h-full w-full bg-ink"
        style={{
          ...inkMask("cta-scene", "both"),
          clipPath: CLIPS[part],
        }}
      />
    </motion.div>
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-0 left-1/2 w-[max(100%,900px)] -translate-x-1/2"
    >
      <div className={cn(ASPECT, "relative w-full")}>
        <motion.div style={{ opacity: unsettled }} className="absolute inset-0">
          {strip("left")}
          {strip("centre")}
          {strip("right")}
        </motion.div>
        <motion.div
          style={{ opacity: settled, ...inkMask("cta-scene", "both") }}
          className="ink-art absolute inset-0 bg-ink"
        />
      </div>
    </div>
  );
}

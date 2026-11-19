import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { IssueRegion, Severity, UXFix } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// A screenshot with numbered, severity-colored pins at each issue's region.
// The hovered/active issue gets a spotlight: everything else on the screen
// dims, so the element it's about is the only thing in focus. Regions are
// placed by the locate pass (lib/locate.ts).

// Severity is carried by the single accent + grey weight, not by hue:
// critical = accent, medium = mid grey, low = light grey. Each fill carries
// its own readable text color, in both themes.
/**
 * The issue number, the same in the critique, its pins and the chat: neutral,
 * so it reads as a label rather than a status. Severity is said in words.
 */
export const ISSUE_NUMBER = "bg-foreground text-background";

export const SEVERITY_FILL: Record<Severity, string> = {
  high: "bg-severity-high text-primary-foreground",
  medium: "bg-severity-medium text-background",
  low: "bg-severity-low text-foreground",
};
export const SEVERITY_TEXT: Record<Severity, string> = {
  high: "text-severity-high",
  medium: "text-foreground",
  low: "text-text-tertiary",
};
const SEVERITY_RING: Record<Severity, string> = {
  high: "ring-severity-high",
  medium: "ring-severity-medium",
  low: "ring-white/90",
};

/** Regions are a little loose; the spotlight leaves this much room around them (fraction of the image). */
const PAD = 0.006;

/**
 * The lit hole of a spotlight: the area outside it is dimmed by a huge
 * box-shadow (the parent clips it), the area inside stays at full brightness
 * with a ring in the issue's severity. Positions are percentages of the parent.
 */
function Spotlight({
  left,
  top,
  width,
  height,
  severity,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  severity: Severity;
}) {
  return (
    <div
      className={cn("absolute rounded-md ring-2 ring-offset-0", SEVERITY_RING[severity])}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        boxShadow: "0 0 0 9999px rgba(8, 8, 10, 0.55)",
      }}
    />
  );
}

interface AnnotatedScreenshotProps {
  imageUrl: string;
  alt: string;
  fixes: UXFix[];
  activeId?: string | null;
  hoverId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  /** The issue's number when `fixes` is a subset (flow screens); defaults to its position. */
  numberOf?: (id: string) => number;
  /** Pins drop in one by one when scrolled into view (landing showcase). */
  revealOnView?: boolean;
  /** "neutral": numbered like the issue list (the app). "severity": coloured by severity (landing demos). */
  pinTone?: "severity" | "neutral";
  className?: string;
}

export function AnnotatedScreenshot({
  imageUrl,
  alt,
  fixes,
  activeId,
  hoverId,
  onHover,
  onSelect,
  numberOf,
  revealOnView,
  pinTone = "severity",
  className,
}: AnnotatedScreenshotProps) {
  // Hover wins over the selection, so moving across pins previews each one.
  const litId = hoverId ?? activeId;
  const lit = fixes.find((f) => f.id === litId && f.region);
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-bg-secondary", className)}>
      <img src={imageUrl} alt={alt} className="block h-auto w-full select-none" draggable={false} />

      {/* Spotlight on the hovered/selected issue */}
      <motion.div
        initial={false}
        animate={{ opacity: lit ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0"
      >
        {lit?.region && (
          <Spotlight
            left={(lit.region.x - PAD) * 100}
            top={(lit.region.y - PAD) * 100}
            width={(Math.max(lit.region.w, 0.02) + PAD * 2) * 100}
            height={(Math.max(lit.region.h, 0.02) + PAD * 2) * 100}
            severity={lit.severity}
          />
        )}
      </motion.div>

      {fixes.map((fix, i) => {
        const r = fix.region;
        if (!r) return null;
        const highlighted = fix.id === lit?.id;
        const n = numberOf ? numberOf(fix.id) : i + 1;
        return (
          <div key={fix.id} className="pointer-events-none absolute inset-0">
            {/* Pin — top-left corner of the region, nudged inside the frame */}
            <motion.button
              type="button"
              aria-label={`Issue ${n}: ${fix.title}`}
              onMouseEnter={() => onHover?.(fix.id)}
              onMouseLeave={() => onHover?.(null)}
              onFocus={() => onHover?.(fix.id)}
              onBlur={() => onHover?.(null)}
              onClick={() => onSelect?.(fix.id)}
              {...(revealOnView
                ? {
                    initial: { scale: 0, opacity: 0 },
                    whileInView: { scale: 1, opacity: 1 },
                    viewport: { once: true, amount: 0.4 },
                    transition: {
                      delay: 0.3 + i * 0.18,
                      type: "spring",
                      stiffness: 420,
                      damping: 22,
                    },
                  }
                : {})}
              className={cn(
                "pointer-events-auto absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[12px] font-bold shadow-elegant ring-2 transition-transform",
                pinTone === "neutral"
                  ? cn(ISSUE_NUMBER, "ring-background")
                  : cn(SEVERITY_FILL[fix.severity], "ring-bg-tertiary"),
                highlighted && "z-10 scale-125 ring-white",
                lit && !highlighted && "opacity-40",
              )}
              style={{
                left: `${Math.min(Math.max(r.x - PAD, 0.03), 0.97) * 100}%`,
                top: `${Math.min(Math.max(r.y - PAD, 0.03), 0.97) * 100}%`,
              }}
            >
              {n}
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}

/** Scores are neutral text; only a score that needs work picks up the accent. */
export function scoreTone(score: number) {
  return score < 60 ? "text-primary" : "text-foreground";
}

export function scoreFill(score: number) {
  if (score >= 80) return "bg-severity-low";
  if (score >= 60) return "bg-severity-medium";
  return "bg-severity-high";
}

/** Natural pixel size of an image, once it has loaded. */
function useImageSize(url: string) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    setSize(null);
    const img = new Image();
    img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, [url]);
  return size;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * A zoomed-in view of the screenshot around one issue's region, spotlit: the
 * element stays bright with a severity ring, everything around it dims, and
 * its number sits on the ring's corner. Each issue in the critique shows
 * exactly what it's about without scrolling back up to the full screenshot.
 */
export function RegionZoom({
  imageUrl,
  region: r,
  severity,
  number,
  className,
}: {
  imageUrl: string;
  region: IssueRegion;
  severity: Severity;
  number: number;
  className?: string;
}) {
  const size = useImageSize(imageUrl);
  if (!size) {
    return <div className={cn("aspect-[16/7] rounded-lg bg-bg-secondary", className)} />;
  }
  const ASPECT = 16 / 7;
  // Crop width: the region with room around it (the dimmed context), at least 28% of the image.
  let cw = clamp(Math.max(r.w * 2.2, 0.28), 0, 1);
  let ch = (cw * size.w) / (ASPECT * size.h);
  const minCh = Math.min(1, Math.max(r.h * 2, 0.12));
  if (ch < minCh) {
    ch = minCh;
    cw = (ch * ASPECT * size.h) / size.w;
  }
  cw = Math.min(cw, 1);
  ch = Math.min(ch, 1);
  const x0 = clamp(r.x + r.w / 2 - cw / 2, 0, 1 - cw);
  const y0 = clamp(r.y + r.h / 2 - ch / 2, 0, 1 - ch);
  const pct = (n: number) => `${n * 100}%`;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-bg-secondary",
        className,
      )}
      style={{ aspectRatio: `${cw * size.w} / ${ch * size.h}` }}
    >
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className="absolute max-w-none select-none"
        style={{ width: pct(1 / cw), left: pct(-x0 / cw), top: pct(-y0 / ch) }}
      />
      <Spotlight
        left={((r.x - PAD - x0) / cw) * 100}
        top={((r.y - PAD - y0) / ch) * 100}
        width={((Math.max(r.w, 0.02) + PAD * 2) / cw) * 100}
        height={((Math.max(r.h, 0.02) + PAD * 2) / ch) * 100}
        severity={severity}
      />
      <span
        aria-hidden
        className={cn(
          "absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[12px] font-bold shadow-elegant ring-2 ring-background",
          ISSUE_NUMBER,
        )}
        style={{
          left: pct(clamp((r.x - PAD - x0) / cw, 0.04, 0.96)),
          top: pct(clamp((r.y - PAD - y0) / ch, 0.08, 0.92)),
        }}
      >
        {number}
      </span>
    </div>
  );
}

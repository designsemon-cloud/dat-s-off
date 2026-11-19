import { Fragment, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";
import {
  RATES,
  splitSentences,
  SpeechPlayerContext,
  usePlayer,
  type SpeechPlayer,
} from "@/lib/speech-player";
import { cn } from "@/lib/utils";
import { GlowButton } from "./GlowButton";

// Listen, on screen: <Speakable> shows text that can be read aloud and, while
// it's being read, highlights the sentence and the word being spoken.
// <ListenBar> is the floating player at the bottom of the critique.
// See design-system/patterns/listen.md.

/**
 * Text that Listen can read. Renders as plain text until the player is on;
 * then each sentence can be clicked to read from there, and the one being
 * read is highlighted (sentence: grey wash, word: accent wash).
 */
export function Speakable({ id, text }: { id: string; text: string }) {
  const player = useContext(SpeechPlayerContext);
  // "" = player off, "o" = on but reading something else, "n,start,end" = reading this.
  const sel = usePlayer((p, s) => {
    if (s.status === "off") return "";
    const cur = p.sentence();
    if (s.status === "ended" || cur?.key !== id) return "o";
    return `${cur.n},${s.word?.[0] ?? -1},${s.word?.[1] ?? -1}`;
  }, "");
  const sentences = useMemo(() => splitSentences(text), [text]);
  const activeRef = useRef<HTMLSpanElement>(null);
  const [n, ws, we] = sel.length > 1 ? sel.split(",").map(Number) : [-1, -1, -1];

  // Keep the sentence being read in view, clear of the toolbar and the player.
  useEffect(() => {
    const el = activeRef.current;
    if (n < 0 || !el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 110 || r.bottom > window.innerHeight - 170)
      el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [n]);

  if (!sel || !player) return <>{text}</>;
  return (
    <>
      {sentences.map((s, i) => {
        const active = i === n;
        return (
          <Fragment key={i}>
            {i > 0 && " "}
            <span
              ref={active ? activeRef : undefined}
              onClick={(e) => {
                // Reading jumps here instead of the click reaching a parent (an issue's header).
                e.stopPropagation();
                // Selecting text to copy shouldn't jump the reading.
                if (window.getSelection()?.isCollapsed !== false) player.seekTo(id, i);
              }}
              className={cn(
                "cursor-pointer rounded-[4px] box-decoration-clone transition-colors duration-300",
                active ? "bg-foreground/[0.08] text-foreground" : "hover:bg-foreground/[0.04]",
              )}
            >
              {active && ws >= 0 ? (
                <>
                  {s.slice(0, ws)}
                  <span className="rounded-[3px] bg-primary/25 text-foreground">
                    {s.slice(ws, we)}
                  </span>
                  {s.slice(we)}
                </>
              ) : (
                s
              )}
            </span>
          </Fragment>
        );
      })}
    </>
  );
}

const time = (secs: number) => {
  const s = Math.max(0, Math.round(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** The floating player: caption, speed, close; then back 30s, play/pause, forward 30s and the timeline. */
export function ListenBar({ player }: { player: SpeechPlayer }) {
  const status = usePlayer((_, s) => s.status, "off");
  const rate = usePlayer((_, s) => s.rate, 1);
  const caption = usePlayer(
    (p, s) =>
      s.status === "ended" ? "Finished. Press play to listen again." : (p.sentence()?.label ?? ""),
    "",
  );
  // Re-render when the timeline moves: on each sentence, and 4× a second while speaking.
  usePlayer((_, s) => `${s.index}|${s.startedAt}|${s.rate}|${s.status}`, "");
  const [, tick] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    if (status !== "playing") return;
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [status]);

  const total = player.total;
  const elapsed = player.elapsed();
  const nextRate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
  const playing = status === "playing";

  return (
    <motion.div
      role="region"
      aria-label="Listen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-x-3 bottom-3 z-20 mx-auto max-w-[560px] rounded-2xl border border-border-strong bg-bg-elevated/95 px-2.5 pb-2 pt-2.5 shadow-elegant backdrop-blur-md"
    >
      <div className="flex items-center gap-1 pl-1.5">
        <p className="min-w-0 flex-1 truncate text-[12px] text-text-tertiary">
          {status === "paused" && <span className="font-medium text-foreground">Paused · </span>}
          {caption}
        </p>
        <GlowButton
          variant="ghost"
          size="sm"
          onClick={() => player.setRate(nextRate)}
          aria-label={`Reading speed ${rate}×. Change to ${nextRate}×`}
          title="Reading speed"
          className="h-7 min-w-[46px] px-2 text-[12px] font-semibold tabular-nums text-foreground"
        >
          {rate}×
        </GlowButton>
        <GlowButton
          variant="ghost"
          size="sm"
          onClick={() => player.stop()}
          aria-label="Stop listening"
          title="Stop listening"
          className="h-7 w-7 px-0"
        >
          <X className="h-4 w-4" />
        </GlowButton>
      </div>

      <div className="mt-1 flex items-center gap-1">
        <SkipButton direction={-1} onClick={() => player.skip(-30)} />
        <button
          type="button"
          onClick={() => player.toggle()}
          aria-label={playing ? "Pause" : "Play"}
          title={playing ? "Pause" : "Play"}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-background transition-opacity hover:opacity-85"
        >
          {playing ? (
            <Pause className="h-4 w-4 fill-current" strokeWidth={0} />
          ) : (
            <Play className="ml-0.5 h-4 w-4 fill-current" strokeWidth={0} />
          )}
        </button>
        <SkipButton direction={1} onClick={() => player.skip(30)} />
        <span className="ml-1.5 w-9 shrink-0 text-right text-[12px] tabular-nums text-muted-foreground">
          {time(elapsed)}
        </span>
        <Timeline elapsed={elapsed} total={total} onSeek={(s) => player.seek(s)} />
        <span className="w-9 shrink-0 text-[12px] tabular-nums text-text-tertiary">
          {time(total)}
        </span>
      </div>
    </motion.div>
  );
}

function SkipButton({ direction, onClick }: { direction: 1 | -1; onClick: () => void }) {
  const Icon = direction < 0 ? RotateCcw : RotateCw;
  const label = direction < 0 ? "Back 30 seconds" : "Forward 30 seconds";
  return (
    <GlowButton
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-9 w-9 shrink-0 px-0"
    >
      <span className="relative grid h-[22px] w-[22px] place-items-center">
        <Icon className="absolute inset-0 h-[22px] w-[22px]" strokeWidth={1.6} />
        <span className="pt-px text-[8px] font-bold leading-none tabular-nums">30</span>
      </span>
    </GlowButton>
  );
}

/** Click or drag to seek; arrow keys move 5s, Home/End jump to the ends. */
function Timeline({
  elapsed,
  total,
  onSeek,
}: {
  elapsed: number;
  total: number;
  onSeek: (secs: number) => void;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const at = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  };
  const pct = total > 0 ? (drag ?? elapsed / total) * 100 : 0;
  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Position"
      aria-valuemin={0}
      aria-valuemax={Math.round(total)}
      aria-valuenow={Math.round(elapsed)}
      aria-valuetext={`${time(elapsed)} of ${time(total)}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag(at(e.clientX));
      }}
      onPointerMove={(e) => drag !== null && setDrag(at(e.clientX))}
      onPointerUp={(e) => {
        if (drag === null) return;
        onSeek(at(e.clientX) * total);
        setDrag(null);
      }}
      onPointerCancel={() => setDrag(null)}
      onKeyDown={(e) => {
        const to =
          e.key === "ArrowRight" || e.key === "ArrowUp"
            ? elapsed + 5
            : e.key === "ArrowLeft" || e.key === "ArrowDown"
              ? elapsed - 5
              : e.key === "Home"
                ? 0
                : e.key === "End"
                  ? total
                  : null;
        if (to === null) return;
        e.preventDefault();
        onSeek(to);
      }}
      className="group relative flex h-6 min-w-0 flex-1 cursor-pointer touch-none items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="h-1 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
      </div>
      <div
        className={cn(
          "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-sm transition-opacity",
          drag === null && "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import {
  BatteryFull,
  ChevronLeft,
  ChevronRight,
  Lock,
  PanelLeft,
  Pause,
  Play,
  RotateCw,
  Search,
  Share,
  Wifi,
  Plus,
} from "lucide-react";
import { SAMPLE_SESSIONS } from "@/lib/samples";
import type { Session } from "@/lib/session-types";
import { AppSidebar } from "@/components/uxcc/AppSidebar";
import { AppTopBar } from "@/components/uxcc/AppTopBar";
import { ChatPane } from "@/components/uxcc/ChatPane";
import { NewCritiqueView } from "@/components/uxcc/NewCritiqueView";
import { ResultsCanvas } from "@/components/uxcc/ResultsCanvas";
import { cn } from "@/lib/utils";

// A scripted, looping "screen recording" of the product, on a full-bleed
// Mac-style desktop (vintage cloud wallpaper, menu bar, browser window).
// Inside the window is the real app, not a drawing of it: the actual
// sidebar, top bar, start page, chat and analysis panel, rendered at desktop
// size (1280 × 760), scaled to fit and made inert. So the demo always matches
// the product (see design-system/organisms/product-demo.md).
//
// Three chapters on the sample sessions, alternating each loop:
//   input      the screenshot lands in the composer, the prompt types, send
//   analyzing  the chat while the review runs
//   output     the result in the chat, then the analysis panel opens
// It plays only while on screen, and has video controls inside the window.

const INPUT_END = 4600;
const ANALYZE_END = 7600;
const OPEN_PANEL = 9600;
const TOTAL = 16000;
const TICK = 50;

const APP_W = 1280;
const APP_H = 760;

const CHAPTERS = [
  { label: "Input", from: 0, to: INPUT_END },
  { label: "Analyzing", from: INPUT_END, to: ANALYZE_END },
  { label: "Output", from: ANALYZE_END, to: TOTAL },
];

const noop = () => {};

export function ProductDemo() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.4 });
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const [loop, setLoop] = useState(0);

  // Reduced motion: hold on the finished output. Set after mount, because the
  // server can't know the preference and the first render must match it.
  useEffect(() => {
    if (!reduce) return;
    setPlaying(false);
    setT(TOTAL - 1);
  }, [reduce]);

  useEffect(() => {
    if (!playing || !inView) return;
    const id = setInterval(() => {
      setT((v) => {
        if (v + TICK < TOTAL) return v + TICK;
        setLoop((l) => l + 1);
        return 0;
      });
    }, TICK);
    return () => clearInterval(id);
  }, [playing, inView]);

  const sample = SAMPLE_SESSIONS[loop % SAMPLE_SESSIONS.length];
  const phase = t < INPUT_END ? "input" : t < ANALYZE_END ? "analyzing" : "output";
  const inSession = phase !== "input";

  return (
    <div ref={rootRef} className="relative overflow-hidden">
      <Wallpaper />
      <MenuBar />

      <div className="relative mx-auto max-w-[1200px] px-3 pb-10 pt-8 sm:px-8 sm:pb-20 sm:pt-16">
        {/* Browser window */}
        <div className="relative overflow-hidden rounded-xl bg-background shadow-[0_0_0_0.5px_rgba(0,0,0,0.25),0_30px_70px_-18px_rgba(0,0,0,0.5)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_30px_70px_-18px_rgba(0,0,0,0.8)]">
          <Toolbar path={inSession ? `/app/s/${sample.id}` : "/app"} />
          <DemoApp t={t} loop={loop} sample={sample} />
        </div>

        {/* Video controls, centred under the window. Inside it they sat over
            the app's own bottom bar, whose centre moves with the sidebar and
            the critique panel, so they never lined up with it. */}
        <div className="mt-4 flex justify-center sm:mt-5">
          <div className="flex items-center gap-3 rounded-full bg-black/75 py-1.5 pl-1.5 pr-4 text-white shadow-lg ring-1 ring-white/10 backdrop-blur-md sm:gap-4">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause demo" : "Play demo"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-black transition-transform hover:scale-105"
            >
              {playing ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="ml-0.5 h-3.5 w-3.5" />
              )}
            </button>
            {CHAPTERS.map((c) => {
              const pct = Math.min(1, Math.max(0, (t - c.from) / (c.to - c.from)));
              const current = phase === c.label.toLowerCase();
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setT(c.from)}
                  aria-label={`Jump to ${c.label}`}
                  className="group w-[58px] text-left sm:w-[84px]"
                >
                  <span
                    className={cn(
                      "block text-[10px] font-medium leading-none transition-colors sm:text-[11px]",
                      current ? "text-white" : "text-white/55 group-hover:text-white",
                    )}
                  >
                    {c.label}
                  </span>
                  <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-white/25">
                    <span
                      className="block h-full rounded-full bg-white"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </span>
                </button>
              );
            })}
            <span className="hidden border-l border-white/20 pl-4 text-[11px] text-white/70 md:block">
              {sample.title}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── The real app, scaled into the window ─────────────────────────────── */

function DemoApp({ t, loop, sample }: { t: number; loop: number; sample: Session }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scale, setScale] = useState(0.8);

  // Fit the 1280px-wide app to the window's width.
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / APP_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const phase = t < INPUT_END ? "input" : t < ANALYZE_END ? "analyzing" : "output";
  const panel = t >= OPEN_PANEL;
  const first = sample.messages[0];
  const prompt = first?.kind === "prompt" ? first.text : "";
  const screens = first?.kind === "prompt" ? first.attachments : [];

  // Input: the screenshot lands, the prompt types itself, then send.
  const typed = prompt.slice(
    0,
    Math.round(Math.min(1, Math.max(0, (t - 1300) / 2200)) * prompt.length),
  );
  const composerProps = {
    mode: sample.mode,
    onModeChange: noop,
    attachments: t >= 700 ? screens : [],
    onAttachmentsChange: noop,
    prompt: typed,
    onPromptChange: noop,
    stack: sample.stack,
    onStackChange: noop,
    device: sample.device,
    onDeviceChange: noop,
    onSubmit: noop,
  };

  // Analyzing: the same session, before its result exists.
  const running: Session = {
    ...sample,
    status: "analyzing",
    messages: sample.messages.slice(0, 1),
    versions: [],
  };

  // The cursor: to the send button, then to the result tile.
  const [cursor, setCursor] = useState({ x: APP_W * 0.62, y: APP_H * 0.7 });
  const target =
    phase === "input" && t >= 3700
      ? "send"
      : phase === "output" && !panel && t >= 8200
        ? "tile"
        : null;
  useLayoutEffect(() => {
    const app = appRef.current;
    if (!app || !target) return;
    const el =
      target === "send"
        ? app.querySelector('[aria-label="Analyze UX"], [aria-label="Analyze flow"]')
        : app.querySelector('[data-demo-chat] button[aria-pressed="false"]');
    if (!el) return;
    const a = app.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setCursor({
      x: (r.left - a.left + r.width * (target === "send" ? 0.5 : 0.82)) / scale,
      y: (r.top - a.top + r.height * 0.6) / scale,
    });
  }, [target, scale, loop]);
  const pressing = (t >= 4200 && t < 4450) || (t >= 9250 && t < 9500);

  return (
    <div ref={frameRef} className="relative overflow-hidden" style={{ height: APP_H * scale }}>
      <div
        ref={appRef}
        // A recording, not the app: nothing in it can be clicked or focused.
        inert
        aria-hidden
        data-app-shell
        className="absolute left-0 top-0 flex bg-background text-foreground"
        style={{
          width: APP_W,
          height: APP_H,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        <AppSidebar
          collapsed={panel}
          onToggleCollapsed={noop}
          preview={{ sessions: SAMPLE_SESSIONS, activeId: phase === "input" ? null : sample.id }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopBar
            onOpenMobileNav={noop}
            preview={phase === "input" ? { path: "/app" } : { path: "", sessionId: sample.id }}
          />
          <main className="relative min-h-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              {phase === "input" ? (
                <motion.div
                  key={`input-${loop}`}
                  exit={{ opacity: 0, filter: "blur(6px)" }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0"
                >
                  <NewCritiqueView composerProps={composerProps} onSuggestion={noop} />
                </motion.div>
              ) : (
                <motion.div
                  key={`session-${loop}`}
                  initial={{ opacity: 0, filter: "blur(6px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 flex"
                >
                  <section
                    data-demo-chat
                    className={cn(
                      "min-h-0 min-w-0",
                      panel ? "w-[420px] shrink-0 border-r border-border/60" : "flex-1",
                    )}
                  >
                    <ChatPane
                      session={phase === "analyzing" ? running : sample}
                      openVersion={panel ? 0 : null}
                      onOpenCritique={noop}
                      onAnswer={noop}
                      onSkip={noop}
                      onRetry={noop}
                      onSend={noop}
                      onSelectIssue={noop}
                      onCloseCritique={noop}
                      onCheck={noop}
                      fileRef={fileRef}
                    />
                  </section>
                  {panel && (
                    <motion.section
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="min-h-0 min-w-0 flex-1 bg-bg-secondary/40"
                    >
                      <ResultsCanvas
                        session={sample}
                        versionIndex={0}
                        onVersionChange={noop}
                        activeFixId={null}
                        onActiveFixChange={noop}
                        activeScreenId={null}
                        onActiveScreenChange={noop}
                        onClose={noop}
                      />
                    </motion.section>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
        {(phase === "input" || (phase === "output" && !panel)) && (
          <Cursor x={cursor.x} y={cursor.y} pressing={pressing} />
        )}
      </div>
    </div>
  );
}

/* ── Desktop: wallpaper + menu bar ─────────────────────────────────────── */

/**
 * Vintage cloud sky (an original image made with Figma AI, in the spirit of
 * the classic Mac OS X cloud desktops). Dimmed in dark mode.
 */
function Wallpaper() {
  return (
    <div aria-hidden className="absolute inset-0">
      <img
        src="/illustrations/clouds.jpg"
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 hidden bg-[#0b0d10]/55 dark:block" />
      {/* Film grain, so the photo sits in the page's paper texture */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{ backgroundImage: "var(--grain-image)" }}
      />
    </div>
  );
}

function MenuBar() {
  return (
    <div className="relative flex h-7 items-center justify-between bg-white/35 px-4 text-[12px] text-black/80 backdrop-blur-xl dark:bg-black/40 dark:text-white/85">
      <div className="flex items-center gap-4">
        <span className="font-bold">Dats Off.</span>
        {["File", "Edit", "View", "Window", "Help"].map((m) => (
          <span key={m} className="hidden sm:inline">
            {m}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <BatteryFull className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <Search className="hidden h-3.5 w-3.5 sm:block" />
        <span className="font-medium">Mon 9:41 AM</span>
      </div>
    </div>
  );
}

/* ── Browser chrome + the app shell ──────────────────────────────────── */

const TRAFFIC = [
  "bg-[#ff5f57] ring-[#e0443e]",
  "bg-[#febc2e] ring-[#dea123]",
  "bg-[#28c840] ring-[#1aab29]",
];

function Toolbar({ path }: { path: string }) {
  return (
    <div className="flex h-10 items-center gap-3 border-b border-border bg-bg-secondary px-3.5">
      <div className="flex shrink-0 items-center gap-2">
        {TRAFFIC.map((c) => (
          <span key={c} className={cn("h-3 w-3 rounded-full ring-[0.5px] ring-inset", c)} />
        ))}
      </div>
      <div className="hidden shrink-0 items-center gap-2 pl-2 text-text-tertiary sm:flex">
        <PanelLeft className="h-4 w-4" />
        <ChevronLeft className="h-4 w-4" />
        <ChevronRight className="h-4 w-4 opacity-50" />
      </div>
      <div className="mx-auto flex h-6 w-full max-w-[340px] items-center justify-center gap-1.5 rounded-md bg-bg-elevated px-3 text-[12px] text-muted-foreground">
        <Lock className="h-3 w-3 shrink-0" />
        <span className="truncate">datsoff.app{path}</span>
        <RotateCw className="ml-auto hidden h-3 w-3 shrink-0 text-text-tertiary sm:block" />
      </div>
      <div className="hidden shrink-0 items-center gap-3 text-text-tertiary sm:flex">
        <Share className="h-4 w-4" />
        <Plus className="h-4 w-4" />
      </div>
    </div>
  );
}

function Cursor({ x, y, pressing }: { x: number; y: number; pressing: boolean }) {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 16 22"
      className="pointer-events-none absolute left-0 top-0 z-20 h-5 w-4 drop-shadow"
      animate={{ x, y, scale: pressing ? 0.85 : 1 }}
      transition={{ duration: 0.7, ease: [0.45, 0, 0.2, 1] }}
    >
      <path
        d="M1 1 L1 17 L5.5 12.8 L9 20.5 L12 19.2 L8.6 11.8 L14.6 11.8 Z"
        className="fill-bg-tertiary stroke-foreground"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

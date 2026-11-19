import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronDown,
  Download,
  GraduationCap,
  MapPinOff,
  Play,
  Volume2,
  X,
} from "lucide-react";
import type { Session, SessionVersion } from "@/lib/session-types";
import type { UXFix } from "@/lib/mock-data";
import type { FlowFix, FlowScreen } from "@/lib/flow-types";
import { FLOW_ISSUE_CATEGORY_LABELS } from "@/lib/flow-types";
import { exportVersionPDF, screenLabeler, versionMarkdown } from "@/lib/export";
import {
  orderedFixes,
  PRIORITY,
  recheckOf,
  scoreVerdict,
  SEVERITY_LABEL,
  STATUS_LABEL,
  type AnyFix,
  type Recheck,
} from "@/lib/critique";
import { issuePrompt, versionPrompt } from "@/lib/fix-prompts";
import {
  learnFor,
  previewImage,
  principlesIn,
  resourceMeta,
  videoLength,
  type CatalogItem,
  type Principle,
} from "@/lib/learn";
import { ResourceCard, Rail, VideoLightbox } from "@/components/learn/LearnMedia";
import { isGrounded, useLocate } from "@/lib/locate";
import { deviceLabel, stackLabel } from "@/lib/prefs";
import { sessionStore } from "@/lib/session-store";
import { versionScore } from "@/lib/session-utils";
import { cn } from "@/lib/utils";
import {
  SpeechPlayer,
  SpeechPlayerContext,
  speechSupported,
  usePlayer,
  useReadingBlock,
  type SpeechSegment,
} from "@/lib/speech-player";
import { AnnotatedScreenshot, ISSUE_NUMBER, RegionZoom } from "./AnnotatedScreenshot";
import { CopyButton } from "./CopyButton";
import { FlowFilmstrip } from "./FlowFilmstrip";
import { GlowButton } from "./GlowButton";
import { ListenBar, Speakable } from "./ListenPlayer";
import { OptionDropdownPill } from "./OptionDropdownPill";
import { Reveal } from "@/lib/reveal";

// The critique panel: opens beside the chat when the user opens the critique.
// It reads as a guided fix plan, in steps: the verdict, what changed since the
// last version (re-checks), where the issues are, fixing them one at a time
// (open an issue, copy its prompt, mark it fixed), and the re-check. A sticky
// step bar shows where you are and how many fixes are done. What already works
// and the all-in-one prompt are extras, collapsed at the end; "Keep learning"
// is a separate shelf after them, with video and article previews. Each issue
// also links to its principle (lib/learn.ts) in a faintly tinted line.
// See design-system/organisms/results-canvas.md.

interface ResultsCanvasProps {
  session: Session;
  versionIndex: number;
  onVersionChange: (i: number) => void;
  activeFixId: string | null;
  onActiveFixChange: (id: string | null) => void;
  /** Flow: which screen the figure shows. */
  activeScreenId: string | null;
  onActiveScreenChange: (id: string | null) => void;
  /** Closes the panel and returns to the conversation. */
  onClose?: () => void;
  /** Opens the file picker for a re-check (absent for samples and while busy). */
  onRecheck?: () => void;
}

export function ResultsCanvas(props: ResultsCanvasProps) {
  const { session, versionIndex, onVersionChange, onClose } = props;
  const version = session.versions[versionIndex];
  const flow = version?.mode === "flow";
  // One reader per open critique. Closing the panel unmounts it, which stops it.
  const [player] = useState(() => new SpeechPlayer());
  const listening = useSyncExternalStore(
    player.subscribe,
    () => player.getState().status !== "off",
    () => false,
  );
  // Known only in the browser, so it's read after mount.
  const [canListen, setCanListen] = useState(false);
  useEffect(() => {
    setCanListen(speechSupported());
    return () => player.stop();
  }, [player]);
  // Switching versions stops the reading.
  useEffect(() => player.stop(), [versionIndex, player]);
  // The step timeline lives in the document (it tracks the scroll) but shows
  // here in the toolbar, beside the title: the document portals it in.
  const [stepSlot, setStepSlot] = useState<HTMLElement | null>(null);

  return (
    <SpeechPlayerContext.Provider value={player}>
      <div className="@container relative flex h-full min-h-0 flex-col">
        {/* Toolbar: what this is, which version, listen, export, close */}
        <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border/60 px-4">
          <span className="shrink-0 text-[14px] font-semibold text-foreground">
            {flow ? "What's off in this flow" : "What's off"}
          </span>
          {session.versions.length > 1 && (
            <OptionDropdownPill
              label="Version"
              selectedId={String(versionIndex)}
              options={session.versions.map((v, i) => ({
                id: String(i),
                label: `v${i + 1} · ${versionScore(v)}`,
              }))}
              onChange={(id) => onVersionChange(Number(id))}
            />
          )}
          <div ref={setStepSlot} className="flex min-w-0 flex-1 items-center" />
          <div className="flex shrink-0 items-center gap-1.5">
            {version && canListen && (
              <GlowButton
                variant="ghost"
                size="sm"
                active={listening}
                aria-pressed={listening}
                aria-label={listening ? "Stop listening" : "Listen to this review"}
                title={listening ? "Stop listening" : "Listen to this review"}
                className="w-8 px-0"
                onClick={() =>
                  listening ? player.stop() : player.start(speechScript(session, versionIndex))
                }
              >
                <Volume2 className="h-4 w-4" />
              </GlowButton>
            )}
            {version && <ExportMenu session={session} version={version} />}
            {onClose && (
              <GlowButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close review"
                title="Close review"
                className="w-8 px-0"
              >
                <X className="h-4 w-4" />
              </GlowButton>
            )}
          </div>
        </div>

        {version ? (
          <CritiqueDocument
            {...props}
            version={version}
            listening={listening}
            stepSlot={stepSlot}
          />
        ) : (
          <PendingCanvas session={session} />
        )}

        <AnimatePresence>{listening && <ListenBar player={player} />}</AnimatePresence>
      </div>
    </SpeechPlayerContext.Provider>
  );
}

function CritiqueDocument({
  session,
  versionIndex,
  version,
  activeFixId,
  onActiveFixChange,
  activeScreenId,
  onActiveScreenChange,
  onRecheck,
  listening,
  stepSlot,
}: ResultsCanvasProps & {
  version: SessionVersion;
  listening: boolean;
  stepSlot: HTMLElement | null;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  // What's being read aloud: an issue opens while it's read, and so do the wins.
  const readingKey = usePlayer(
    (p, s) => (s.status === "off" ? null : (p.sentence()?.key ?? null)),
    null,
  );
  const readingId = readingKey?.startsWith("fix:") ? readingKey.split(":")[1] : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const items = useRef(new Map<string, HTMLElement>());
  const sections = useRef(new Map<string, HTMLElement | null>());
  const sectionRef = (id: string) => (el: HTMLElement | null) => {
    sections.current.set(id, el);
  };
  const locate = useLocate(session, versionIndex);
  const locating = locate === "locating";

  // Markers only once they're grounded: the critique's own coordinates drift,
  // so until the locate pass has confirmed an element, an issue has no marker.
  const grounded = isGrounded(session, versionIndex);
  const fixes = orderedFixes(version).map((f) => (grounded ? f : { ...f, region: null }));
  const pinned = fixes.filter((f) => f.region).length;
  const numberOf = (id: string) => fixes.findIndex((f) => f.id === id) + 1;
  const recheck = recheckOf(session, versionIndex);
  const score = versionScore(version);
  const flow = version.mode === "flow";
  const labelFor = screenLabeler(version.attachments);
  const context = version.mode === "single" ? version.result.contextSummary : undefined;
  const wins = version.mode === "single" ? (version.result.wins ?? []) : [];
  const prompt = versionPrompt(session, version);

  // Fix progress: issues the user marked fixed. Kept on the version, so it
  // survives reloads (samples keep it for the visit only).
  const [done, setDone] = useState<string[]>(version.done ?? []);
  // Every issue is shown in full; one marked fixed folds to a single line,
  // unless it's opened again ("Show") to look back at it.
  const [peekId, setPeekId] = useState<string | null>(null);
  const [winsOpen, setWinsOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [playing, setPlaying] = useState<CatalogItem | null>(null);
  const closeVideo = useCallback(() => setPlaying(null), []);
  const learning = principlesIn([...fixes, ...wins]);
  const [promptOpen, setPromptOpen] = useState(false);
  const allDone = fixes.length > 0 && fixes.every((f) => done.includes(f.id));
  // The next action in the document: one primary at a time.
  const nextFixId = fixes.find((f) => !done.includes(f.id))?.id ?? null;

  const scrollToItem = (id: string, delay = 0) =>
    setTimeout(
      () => items.current.get(id)?.scrollIntoView({ block: "start", behavior: "smooth" }),
      delay,
    );
  const jump = (id: string) =>
    sections.current.get(id)?.scrollIntoView({ block: "start", behavior: "smooth" });

  // New version → start at the top with its own progress.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setDone(version.done ?? []);
    setPeekId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionIndex]);

  // An issue picked in the chat or on the screenshot comes into view (and
  // unfolds if it was marked fixed).
  useEffect(() => {
    if (!activeFixId) return;
    setPeekId(activeFixId);
    const t = scrollToItem(activeFixId, 60);
    return () => clearTimeout(t);
  }, [activeFixId]);

  useEffect(() => {
    if (readingId) setPeekId(readingId);
  }, [readingId]);
  useEffect(() => {
    if (readingKey?.startsWith("win:")) setWinsOpen(true);
  }, [readingKey]);

  const toggleDone = (id: string) => {
    const marking = !done.includes(id);
    const next = marking ? [...done, id] : done.filter((x) => x !== id);
    setDone(next);
    if (!session.readOnly)
      sessionStore.update(session.id, (s) => ({
        ...s,
        versions: s.versions.map((v, i) => (i === versionIndex ? { ...v, done: next } : v)),
      }));
    if (!marking) return;
    // Marked fixed: it folds away; move on to the next one, or to the re-check when all are done.
    setPeekId(null);
    const nextId = fixes.find((f) => !next.includes(f.id))?.id ?? null;
    if (nextId) scrollToItem(nextId, 320);
    else setTimeout(() => jump("recheck"), 320);
  };

  const steps: GuideStep[] = [
    { id: "verdict", label: "Verdict" },
    ...(recheck ? [{ id: "changes", label: "What changed" }] : []),
    fixes.length
      ? { id: "fix", label: "Fix", count: `${done.length}/${fixes.length}`, complete: allDone }
      : { id: "fix", label: "Screen" },
    { id: "recheck", label: "Re-check" },
  ];

  // Which step is on screen: the last section whose top has passed under the step bar.
  const [current, setCurrent] = useState("verdict");
  const stepIds = steps.map((x) => x.id).join(",");
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const ids = stepIds.split(",");
        const line = el.getBoundingClientRect().top + 120;
        let cur = ids[0];
        for (const id of ids) {
          const node = sections.current.get(id);
          if (node && node.getBoundingClientRect().top <= line) cur = id;
        }
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) cur = ids[ids.length - 1];
        setCurrent(cur);
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      el.removeEventListener("scroll", update);
      cancelAnimationFrame(raf);
    };
  }, [stepIds]);

  const counts = PRIORITY.map(({ severity }) => {
    const n = fixes.filter((f) => f.severity === severity).length;
    return n ? `${n} ${SEVERITY_LABEL[severity].toLowerCase()}` : null;
  }).filter(Boolean);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
      {stepSlot &&
        createPortal(<GuideBar steps={steps} current={current} onJump={jump} />, stepSlot)}
      <article
        className={cn(
          "mx-auto max-w-[760px] px-5 pt-8 sm:px-8 sm:pt-10",
          // Room for the player, so it never covers the end of the document.
          listening ? "pb-40" : "pb-16",
        )}
      >
        {/* Step 1: title and verdict */}
        <header ref={sectionRef("verdict")} className="scroll-mt-16">
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
            <Speakable id="title" text={session.title} />
          </h1>
          <p className="mt-1.5 text-[13px] text-text-tertiary">
            {flow ? "What's off in this flow" : "What's off"}
            {session.versions.length > 1 && ` · v${versionIndex + 1}`} ·{" "}
            {new Date(version.createdAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-border py-4">
            <ReadingBlock id="verdict" className="flex items-baseline gap-x-3">
              <span className="text-[40px] font-semibold leading-none tabular-nums text-foreground">
                {score}
              </span>
              <span className="text-[14px] text-text-tertiary">/ 100</span>
              <span className="text-[16px] font-medium text-foreground">{scoreVerdict(score)}</span>
            </ReadingBlock>
            {counts.length > 0 && (
              <span className="text-[13px] text-muted-foreground @md:ml-auto">
                {counts.join(" · ")}
              </span>
            )}
          </div>
          <p className="mt-5 text-[16px] leading-[1.65] text-foreground">
            <Speakable id="summary" text={version.result.summary} />
          </p>
          {context && <p className="mt-2 text-[13px] text-text-tertiary">{context}</p>}
          {version.mode === "flow" && (
            <p className="mt-2 text-[13px] text-text-tertiary">
              Goal reached: {version.result.goalAchieved}
            </p>
          )}
          {version.mode === "flow" && !version.result.flowCoherent && (
            <p className="mt-3 text-[14px] text-severity-high">
              These screens don&rsquo;t appear to form one coherent flow, so treat the findings as
              best-effort rather than a full transition analysis.
            </p>
          )}
        </header>

        {recheck && (
          <RecheckSection
            sectionRef={sectionRef("changes")}
            recheck={recheck}
            before={
              session.versions[versionIndex - 1]?.mode === "single"
                ? session.versions[versionIndex - 1].attachments[0]?.dataUrl
                : undefined
            }
            after={version.mode === "single" ? version.attachments[0]?.dataUrl : undefined}
          />
        )}

        {/* The issues: the screen with its markers, then the list they number. */}
        <DocSection
          sectionRef={sectionRef("fix")}
          title={
            !fixes.length
              ? "The screen"
              : `${fixes.length} ${fixes.length === 1 ? "issue" : "issues"} ${recheck ? "left" : "to fix"}`
          }
          intro={
            fixes.length
              ? "Most important first. Copy each prompt into your AI tool, then mark the issue fixed."
              : undefined
          }
        >
          {version.mode === "flow" ? (
            <FlowFigure
              version={version}
              fixes={fixes}
              numberOf={numberOf}
              activeFixId={activeFixId}
              activeScreenId={activeScreenId}
              onActiveScreenChange={onActiveScreenChange}
            />
          ) : (
            <>
              <div className="rounded-2xl border border-border-strong bg-bg-tertiary p-2">
                <AnnotatedScreenshot
                  imageUrl={version.attachments[0]?.dataUrl ?? ""}
                  alt="The reviewed screenshot"
                  fixes={fixes as UXFix[]}
                  activeId={activeFixId}
                  hoverId={hoverId ?? readingId}
                  onHover={setHoverId}
                  onSelect={(id) => onActiveFixChange(id)}
                  pinTone="neutral"
                />
              </div>
              <p className="mt-2 flex items-center gap-2 text-[13px] text-text-tertiary">
                {locating && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse-dot" />
                )}
                {locating
                  ? "Placing each marker on the exact element and checking it…"
                  : locate === "failed"
                    ? "Markers are unavailable for this screenshot, so each issue says where it is in words."
                    : !fixes.length
                      ? "No issues to mark."
                      : pinned === fixes.length
                        ? "Hover a number to spotlight it. Click it to go to that issue."
                        : pinned
                          ? `${pinned} of ${fixes.length} issues are pinned to a confirmed element. The others say where they are in words.`
                          : "None of the issues could be pinned to one element with confidence, so each says where it is in words."}
              </p>
            </>
          )}
          {fixes.length > 0 && (
            <ol className="mt-10 divide-y divide-border">
              {fixes.map((f) => (
                <IssueStep
                  key={f.id}
                  fix={f}
                  lead={f.id === nextFixId}
                  number={numberOf(f.id)}
                  open={!done.includes(f.id) || peekId === f.id}
                  done={done.includes(f.id)}
                  imageUrl={
                    version.mode === "single"
                      ? version.attachments[0]?.dataUrl
                      : version.attachments.find((a) => a.id === (f as FlowFix).anchorScreenIds[0])
                          ?.dataUrl
                  }
                  anchor={
                    "anchorScreenIds" in f ? labelFor((f as FlowFix).anchorScreenIds) : undefined
                  }
                  recheckLabel={
                    recheck
                      ? f.carriedFrom
                        ? STATUS_LABEL[
                            recheck.items.find((i) => i.previousId === f.carriedFrom)?.status ??
                              "open"
                          ]
                        : "New"
                      : undefined
                  }
                  prompt={issuePrompt(session, version, f)}
                  locating={locating}
                  refFn={(el) => {
                    if (el) items.current.set(f.id, el);
                    else items.current.delete(f.id);
                  }}
                  onHover={setHoverId}
                  onToggle={() => setPeekId((p) => (p === f.id ? null : f.id))}
                  onDone={() => toggleDone(f.id)}
                  onPlay={setPlaying}
                />
              ))}
            </ol>
          )}
        </DocSection>

        {/* Re-check: close the loop */}
        <DocSection sectionRef={sectionRef("recheck")} title="Re-check your fixes">
          <p className="text-[15px] leading-relaxed text-foreground">
            {fixes.length ? (
              <Speakable id="end" text={CLOSING} />
            ) : (
              "Nothing left to fix here. Attach another screen in the chat whenever you want a fresh check."
            )}
          </p>
          {fixes.length > 0 && (
            <p className="mt-1 text-[14px] text-muted-foreground">
              {allDone
                ? `All ${fixes.length} marked fixed. Time to confirm it.`
                : `${done.length} of ${fixes.length} marked fixed so far.`}
            </p>
          )}
          {onRecheck && fixes.length > 0 && (
            <GlowButton
              variant={allDone ? "primary" : "outline"}
              size="sm"
              className="mt-4 min-w-[152px]"
              onClick={onRecheck}
            >
              Re-check
            </GlowButton>
          )}
        </DocSection>

        {/* Extras */}
        <div className="mt-12">
          {prompt && (
            <Collapsible
              title="One prompt for all the fixes"
              meta="Prefer to fix everything in one go"
              open={promptOpen}
              onToggle={() => setPromptOpen((o) => !o)}
            >
              <div className="rounded-xl border border-border bg-bg-secondary">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
                  <span className="text-[13px] font-medium text-text-tertiary">
                    Works in Cursor, Claude Code, v0, Lovable or any AI tool
                  </span>
                  <CopyButton text={prompt} label="Copy prompt" />
                </div>
                <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap p-4 font-mono text-[12.5px] leading-relaxed text-foreground">
                  {prompt}
                </pre>
              </div>
            </Collapsible>
          )}
          {wins.length > 0 && (
            <Collapsible
              title="What already works"
              meta={`${wins.length} ${wins.length === 1 ? "strength" : "strengths"} to keep`}
              open={winsOpen}
              onToggle={() => setWinsOpen((o) => !o)}
            >
              <ul className="space-y-4">
                {wins.map((w) => (
                  <li key={w.id}>
                    <p className="text-[15px] font-medium text-foreground">
                      <Speakable id={`win:${w.id}`} text={w.title} />
                    </p>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">
                      {w.explanation} <span className="text-text-tertiary">({w.principle})</span>
                    </p>
                  </li>
                ))}
              </ul>
            </Collapsible>
          )}
        </div>
        {learning.length > 0 && (
          <LearningShelf
            principles={learning}
            open={learnOpen}
            onToggle={() => setLearnOpen((o) => !o)}
            onPlay={setPlaying}
          />
        )}
        <VideoLightbox item={playing} onClose={closeVideo} />
      </article>
    </div>
  );
}

interface GuideStep {
  id: string;
  label: string;
  /** Shown beside the label, e.g. "2/5" fixed. */
  count?: string;
  complete?: boolean;
}

/**
 * The step timeline, in the toolbar beside the title: Verdict — Fix 1/3 —
 * Re-check. Text only; the step on screen gets the orange dot and the
 * foreground colour, nothing else. Narrow panels show only the current
 * step's label.
 */
function GuideBar({
  steps,
  current,
  onJump,
}: {
  steps: GuideStep[];
  current: string;
  onJump: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Steps"
      className="ml-1 flex min-w-0 items-center border-l border-border/70 pl-3"
    >
      <ol className="flex min-w-0 items-center overflow-x-auto [scrollbar-width:none]">
        {steps.map((st, i) => {
          const active = st.id === current;
          return (
            <li key={st.id} className="flex shrink-0 items-center">
              {i > 0 && (
                <span aria-hidden className="mx-1.5 h-px w-2.5 bg-border-strong @lg:mx-2 @lg:w-4" />
              )}
              <button
                type="button"
                onClick={() => onJump(st.id)}
                aria-current={active ? "step" : undefined}
                title={st.label}
                className={cn(
                  "group flex h-7 items-center gap-1.5 text-[12.5px] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "font-medium text-foreground"
                    : "text-text-tertiary hover:text-foreground",
                )}
                style={{ borderRadius: "8px" }}
              >
                {st.complete ? (
                  <Check className="h-3 w-3 text-foreground" strokeWidth={3} aria-hidden />
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300",
                      active ? "bg-primary" : "bg-border-strong group-hover:bg-text-tertiary",
                    )}
                  />
                )}
                <span className={cn(!active && "hidden @lg:inline")}>{st.label}</span>
                {st.count && (
                  <span
                    className={cn(
                      "tabular-nums text-text-tertiary",
                      !active && "hidden @lg:inline",
                    )}
                  >
                    {st.count}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** A section of the document: a plain heading (only issues carry numbers), an intro and the body. */
function DocSection({
  sectionRef,
  title,
  intro,
  children,
}: {
  sectionRef: (el: HTMLElement | null) => void;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section ref={sectionRef} className="mt-12 scroll-mt-16">
      <h2 className="text-[19px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
      {intro && <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** An extra, collapsed by default: a row with a chevron that unfolds its content. */
function Collapsible({
  title,
  meta,
  open,
  onToggle,
  children,
}: {
  title: string;
  meta?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border last:border-b">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-center gap-3 py-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-foreground">{title}</span>
          {meta && <span className="block text-[13px] text-text-tertiary">{meta}</span>}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-300 group-hover:text-foreground",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <Reveal transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <div className="pb-5">{children}</div>
          </Reveal>
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * One issue as a step of the fix plan. Folded: number, title and the fix in
 * one line. Open: the spotlit crop, the problem and why it matters
 * (secondary), what to do (primary, set apart), then copy its prompt and mark
 * it fixed.
 */
/**
 * An issue without a marker says so, and where it is in words, instead of
 * pointing somewhere it can't vouch for.
 */
// Learning (design-system/patterns/learning.md): secondary to the fix, and
// marked by its own accent, `learn` (indigo), never the orange primary. The
// links are just text in that colour. Articles open in a new tab; videos play
// in place (VideoLightbox).
const LEARN_LINK =
  "font-medium text-learn underline decoration-transparent underline-offset-4 transition-colors duration-300 hover:decoration-learn/50";

/** One line under "why it matters": the principle's first article, plus its video. */
function LearnLine({
  principle: p,
  onPlay,
}: {
  principle: Principle | null;
  onPlay: (item: CatalogItem) => void;
}) {
  if (!p) return null;
  const article = p.resources.find((r) => r.kind !== "video") ?? p.resources[0];
  const video = p.resources.find((r) => r.kind === "video" && r !== article);
  return (
    // No container: the link text carries the accent. Inline text, not flex:
    // non-breaking separators, so a wrap never starts a line with "·".
    <p className="mt-2.5 text-[13px] leading-[1.7] text-text-tertiary">
      <BookOpen
        aria-hidden
        className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px align-middle text-learn"
        strokeWidth={1.75}
      />
      {"Learn:\u00A0"}
      <a href={article.url} target="_blank" rel="noopener noreferrer" className={LEARN_LINK}>
        {p.name}
      </a>
      {`\u00A0·\u00A0${resourceMeta(article)}`}
      {video && (
        <>
          {"\u00A0·\u00A0"}
          <button
            type="button"
            onClick={() => onPlay({ resource: video, principle: p })}
            className={cn(LEARN_LINK, "inline-flex items-center gap-1 align-baseline")}
          >
            <Play className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
            {`Video\u00A0${videoLength(video) ?? ""}`}
          </button>
        </>
      )}
    </p>
  );
}

/**
 * "Keep learning": its own shelf, not another ruled collapsible. A tinted
 * card whose header previews a few thumbnails; open, each principle gets its
 * idea in one line and a rail of video and article cards.
 */
function LearningShelf({
  principles,
  open,
  onToggle,
  onPlay,
}: {
  principles: Principle[];
  open: boolean;
  onToggle: () => void;
  onPlay: (item: CatalogItem) => void;
}) {
  const items = principles.flatMap((p) =>
    p.resources.map((resource) => ({ resource, principle: p })),
  );
  const videos = items.filter((i) => i.resource.kind === "video").length;
  const peek = items
    .map((i) => previewImage(i.resource))
    .filter((u): u is string => !!u)
    .slice(0, 3);
  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-learn/15 bg-gradient-to-b from-learn/[0.05] to-transparent bg-[length:100%_160px] bg-no-repeat dark:border-learn/20 dark:from-learn/[0.08]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-center gap-4 p-5 text-left"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-learn/10 text-learn ring-1 ring-inset ring-learn/15">
          <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-foreground">Keep learning</span>
          <span className="block text-[13px] text-text-tertiary">
            {principles.length === 1 ? "The principle" : `${principles.length} principles`} behind
            this review · {videos} {videos === 1 ? "video" : "videos"}, {items.length - videos} to
            read
          </span>
        </span>
        {!open && peek.length > 0 && (
          <span aria-hidden className="hidden shrink-0 -space-x-4 sm:flex">
            {peek.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                style={{ transform: `rotate(${(i - 1) * 4}deg)` }}
                className="h-9 w-14 rounded-md object-cover shadow-sm ring-2 ring-background transition-transform duration-500 group-hover:-translate-y-0.5"
              />
            ))}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-300 group-hover:text-foreground",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <Reveal transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <div className="space-y-8 px-5 pb-6">
              {principles.map((p) => (
                <div key={p.key} className="border-t border-learn/10 pt-6">
                  <Rail
                    title={p.name}
                    meta={<span className="text-muted-foreground">{p.idea}</span>}
                  >
                    {p.resources.map((resource) => (
                      <div
                        key={resource.url}
                        className="w-[200px] shrink-0 snap-start sm:w-[220px]"
                      >
                        <ResourceCard
                          item={{ resource, principle: p }}
                          onPlay={onPlay}
                          context="shelf"
                        />
                      </div>
                    ))}
                  </Rail>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </AnimatePresence>
    </section>
  );
}

function Unpinned({ fix: f, locating }: { fix: AnyFix; locating: boolean }) {
  const where = f.location || f.locator?.element;
  const text = locating
    ? "Placing the marker…"
    : f.locator?.status === "unconfirmed"
      ? "Couldn't confirm the exact element on the screen, so there's no marker."
      : f.locator?.status === "none"
        ? "Not tied to one element on the screen, so there's no marker."
        : "No marker for this one.";
  return (
    <div className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-text-tertiary">
      {locating ? (
        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse-dot" />
      ) : (
        <MapPinOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-tertiary" />
      )}
      <span>
        {text}
        {where && !locating && (
          <>
            {" "}
            <span className="text-muted-foreground">Where: {where.replace(/[.\s]+$/, "")}.</span>
          </>
        )}
      </span>
    </div>
  );
}

function IssueStep({
  fix: f,
  lead,
  number,
  open,
  done,
  imageUrl,
  anchor,
  recheckLabel,
  prompt,
  locating,
  refFn,
  onHover,
  onToggle,
  onDone,
  onPlay,
}: {
  fix: AnyFix;
  /** The first issue not yet fixed: the next action, so its Copy is the one primary. */
  lead: boolean;
  number: number;
  /** Shown in full (every open issue, or a fixed one opened again). */
  open: boolean;
  done: boolean;
  /** The screenshot the issue is on, for the spotlit crop. */
  imageUrl?: string;
  anchor?: string;
  recheckLabel?: string;
  /** This issue's structured fix prompt. */
  prompt: string;
  /** The locate pass is still placing markers. */
  locating: boolean;
  refFn: (el: HTMLElement | null) => void;
  onHover: (id: string | null) => void;
  /** Folds or unfolds an issue marked fixed. */
  onToggle: () => void;
  onDone: () => void;
  /** Plays a principle's video in place. */
  onPlay: (item: CatalogItem) => void;
}) {
  const meta = [
    f.principle,
    "category" in f ? FLOW_ISSUE_CATEGORY_LABELS[(f as FlowFix).category] : null,
    anchor,
    recheckLabel,
  ].filter(Boolean);
  return (
    // A section of the document, not a card: hairlines between issues, room inside.
    <li
      ref={refFn}
      onMouseEnter={() => onHover(f.id)}
      onMouseLeave={() => onHover(null)}
      className={cn("scroll-mt-16 first:pt-0 last:pb-0", open ? "py-10" : "py-5")}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={cn(
            "mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold transition-colors duration-300",
            done ? "bg-bg-elevated text-muted-foreground" : ISSUE_NUMBER,
          )}
        >
          {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-4">
            <h3
              className={cn(
                "min-w-0 flex-1 text-[17px] font-semibold leading-snug tracking-[-0.01em] transition-colors duration-300",
                done ? "text-text-tertiary" : "text-foreground",
              )}
            >
              <Speakable id={`fix:${f.id}:title`} text={f.title} />
            </h3>
            {/* Severity in words; only critical takes the accent. */}
            <span
              className={cn(
                "mt-[3px] shrink-0 text-[12px] font-medium",
                done
                  ? "text-text-tertiary"
                  : f.severity === "high"
                    ? "text-primary"
                    : "text-muted-foreground",
              )}
            >
              {SEVERITY_LABEL[f.severity]}
            </span>
          </div>

          {done && (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-text-tertiary">
              <span>Marked fixed</span>
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {open ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={onDone}
                className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Undo
              </button>
            </p>
          )}

          <AnimatePresence initial={false}>
            {open && (
              <Reveal
                // Clipped only while it opens or closes: once open, overflow
                // is visible, so the copy button's ring and shadow aren't cut.
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {!done && meta.length > 0 && (
                  <p className="mt-1 text-[13px] text-text-tertiary">{meta.join(" · ")}</p>
                )}

                {/* Where it is, spotlit, right here: no scrolling back up. */}
                {imageUrl && f.region ? (
                  <RegionZoom
                    imageUrl={imageUrl}
                    region={f.region}
                    severity={f.severity}
                    number={number}
                    className="mt-5"
                  />
                ) : (
                  <Unpinned fix={f} locating={locating} />
                )}

                <p className="mt-5 text-[15px] leading-[1.7] text-foreground">
                  <Speakable id={`fix:${f.id}:problem`} text={f.problem} />
                </p>
                <p className="mt-2 text-[14px] leading-[1.7] text-muted-foreground">
                  <Speakable id={`fix:${f.id}:why`} text={f.why} />
                </p>
                <LearnLine principle={learnFor(f)} onPlay={onPlay} />

                <h4 className="mt-7 text-[13px] font-semibold text-foreground">How to fix it</h4>
                <p className="mt-1.5 text-[15px] leading-[1.7] text-foreground">
                  <Speakable id={`fix:${f.id}:fix`} text={f.solution} />
                </p>
                {f.steps && f.steps.length > 0 && (
                  <ul className="mt-2.5 space-y-1.5 text-[14px] leading-[1.65] text-muted-foreground">
                    {f.steps.map((st, i) => (
                      <li key={i} className="flex gap-3">
                        <span
                          aria-hidden
                          className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-text-tertiary"
                        />
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {f.acceptance && f.acceptance.length > 0 && (
                  <p className="mt-3 text-[13px] leading-relaxed text-text-tertiary">
                    <span className="font-medium text-muted-foreground">Done when </span>
                    {f.acceptance.join(" · ")}
                  </p>
                )}

                {!done && (
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <CopyButton text={prompt} label="Copy this fix's prompt" />
                    <GlowButton variant="outline" size="sm" onClick={onDone}>
                      Mark fixed
                    </GlowButton>
                  </div>
                )}
              </Reveal>
            )}
          </AnimatePresence>
        </div>
      </div>
    </li>
  );
}

/** Re-checks: the score change and what happened to each issue of the version before. */
function RecheckSection({
  sectionRef,
  recheck: r,
  before,
  after,
}: {
  sectionRef: (el: HTMLElement | null) => void;
  recheck: Recheck;
  /** Screenshots of the two versions (single screens), for the before/after slider. */
  before?: string;
  after?: string;
}) {
  const delta = r.scoreAfter - r.scoreBefore;
  return (
    <DocSection sectionRef={sectionRef} title={`What changed since v${r.against}`}>
      {before && after && (
        <div className="mb-5">
          <CompareSlider
            before={before}
            after={after}
            beforeLabel={`v${r.against} · ${r.scoreBefore}`}
            afterLabel={`v${r.against + 1} · ${r.scoreAfter}`}
          />
          <p className="mt-2 text-[13px] text-text-tertiary">
            Drag to compare v{r.against} with v{r.against + 1}.
          </p>
        </div>
      )}
      <ReadingBlock id="recheck" className="inline-block text-[15px] text-muted-foreground">
        Score {r.scoreBefore} →{" "}
        <span className="font-semibold text-foreground">{r.scoreAfter}</span>{" "}
        <span className={cn("font-medium", delta < 0 ? "text-primary" : "text-foreground")}>
          ({delta >= 0 ? "+" : "−"}
          {Math.abs(delta)})
        </span>
        {" · "}
        {r.fixed} of {r.items.length} fixed
        {r.newIssues.length > 0 && ` · ${r.newIssues.length} new`}
      </ReadingBlock>
      <ul className="mt-3 divide-y divide-border border-y border-border">
        {r.items.map((item) => (
          <li key={item.previousId} className="flex gap-4 py-3 text-[15px] leading-relaxed">
            <span
              className={cn(
                "w-[92px] shrink-0 text-[13px] font-medium leading-[24px]",
                item.status === "fixed" || item.status === "unseen"
                  ? "text-text-tertiary"
                  : "text-foreground",
              )}
            >
              {STATUS_LABEL[item.status]}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  item.status === "fixed"
                    ? "text-text-tertiary line-through decoration-border-strong"
                    : "font-medium text-foreground",
                )}
              >
                {item.title}
              </span>
              {item.note && (
                <span className="block text-[14px] text-muted-foreground">{item.note}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </DocSection>
  );
}

/** Before/after of two versions: drag (or use arrow keys) to move the divider. */
function CompareSlider({
  before,
  after,
  beforeLabel,
  afterLabel,
}: {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative select-none overflow-hidden rounded-2xl border border-border-strong bg-bg-secondary">
      <img src={after} alt={afterLabel} draggable={false} className="block h-auto w-full" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img
          src={before}
          alt={beforeLabel}
          draggable={false}
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-foreground"
        style={{ left: `${pos}%` }}
      >
        <span className="absolute left-1/2 top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border-strong bg-bg-tertiary text-[12px] font-semibold text-foreground shadow-elegant">
          ‹›
        </span>
      </div>
      <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-bg-tertiary/90 px-2 py-0.5 text-[12px] font-medium text-foreground shadow-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-foreground px-2 py-0.5 text-[12px] font-medium text-background shadow-sm">
        {afterLabel}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Compare ${beforeLabel} with ${afterLabel}`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

const CLOSING =
  "Fixed them? Attach the updated screen to re-check. You’ll see what’s fixed, what’s still open, and the new score.";

/** A block Listen reads without showing the words (the verdict, the re-check line): it gets the sentence wash. */
function ReadingBlock({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const active = useReadingBlock(id);
  return (
    <span
      className={cn(
        "-mx-1.5 rounded-md px-1.5 transition-colors duration-300",
        active && "bg-foreground/[0.08]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * What Listen reads, in document order. Each segment's key matches the
 * <Speakable> or <ReadingBlock> that shows it; `lead` is spoken glue that
 * isn't on screen ("Issue 2, critical.").
 */
function speechScript(session: Session, index: number): SpeechSegment[] {
  const v = session.versions[index];
  if (!v) return [];
  const score = versionScore(v);
  const fixes = orderedFixes(v);
  const r = recheckOf(session, index);
  const segs: SpeechSegment[] = [
    { key: "title", text: session.title, label: "Summary" },
    {
      key: "verdict",
      text: `Score ${score} out of 100: ${scoreVerdict(score).toLowerCase()}.`,
      label: "Summary",
    },
    { key: "summary", text: v.result.summary, label: "Summary" },
  ];
  if (r) {
    const n = r.newIssues.length;
    segs.push({
      key: "recheck",
      text: `Since version ${r.against}, the score went from ${r.scoreBefore} to ${r.scoreAfter}. ${r.fixed} of ${r.items.length} issues are fixed${n ? `, and there ${n === 1 ? "is 1 new issue" : `are ${n} new issues`}` : ""}.`,
      label: `Since v${r.against}`,
    });
  }
  fixes.forEach((f, i) => {
    const label = `Issue ${i + 1} of ${fixes.length} · ${f.title}`;
    const lead = `${i === 0 ? "Here's what to fix, most important first. " : ""}Issue ${i + 1}, ${SEVERITY_LABEL[f.severity].toLowerCase()}.`;
    segs.push(
      { key: `fix:${f.id}:title`, lead, text: f.title, label },
      { key: `fix:${f.id}:problem`, text: f.problem, label },
      { key: `fix:${f.id}:why`, lead: "Why it matters:", text: f.why, label },
      { key: `fix:${f.id}:fix`, lead: "The fix:", text: f.solution, label },
    );
  });
  segs.push(
    fixes.length
      ? { key: "end", lead: "Last step.", text: CLOSING, label: "Re-check" }
      : { key: "end", text: "Nothing left to fix here.", label: "Re-check" },
  );
  const wins = v.mode === "single" ? (v.result.wins ?? []) : [];
  wins.forEach((w, i) =>
    segs.push({
      key: `win:${w.id}`,
      lead: i === 0 ? "Finally, what already works." : undefined,
      text: w.title,
      label: "What already works",
    }),
  );
  return segs;
}

function FlowFigure({
  version,
  fixes,
  numberOf,
  activeFixId,
  activeScreenId,
  onActiveScreenChange,
}: {
  version: Extract<SessionVersion, { mode: "flow" }>;
  fixes: AnyFix[];
  numberOf: (id: string) => number;
  activeFixId: string | null;
  activeScreenId: string | null;
  onActiveScreenChange: (id: string | null) => void;
}) {
  const screens = useMemo(
    () => [...version.attachments].sort((a, b) => a.order - b.order),
    [version.attachments],
  );
  const screenId = activeScreenId ?? screens[0]?.id ?? null;
  const screen = screens.find((s) => s.id === screenId) ?? screens[0];
  const ordinal = screens.findIndex((s) => s.id === screen?.id) + 1;
  const here = fixes.filter((f) => screenId && (f as FlowFix).anchorScreenIds.includes(screenId));
  const screenScore = screen ? version.result.screenScores[screen.id] : undefined;
  return (
    <>
      <div className="rounded-2xl border border-border-strong bg-bg-tertiary p-3">
        <FlowFilmstrip
          screens={screens}
          activeScreenId={screenId}
          onSelect={(id) => onActiveScreenChange(id ?? screens[0]?.id ?? null)}
          scores={version.result.screenScores}
        />
      </div>
      {screen && (
        <div className="mt-3 rounded-2xl border border-border-strong bg-bg-tertiary p-2">
          <AnnotatedScreenshot
            imageUrl={screen.dataUrl}
            alt={screen.name}
            fixes={here as UXFix[]}
            numberOf={numberOf}
            activeId={activeFixId}
          />
        </div>
      )}
      <p className="mt-2 text-[13px] text-text-tertiary">
        Screen {ordinal} of {screens.length}
        {screenScore !== undefined && ` · score ${screenScore}`}
        {here.length > 0 &&
          ` · issues ${here.map((f) => numberOf(f.id)).join(", ")} are on this screen`}
      </p>
    </>
  );
}

function ExportMenu({ session, version }: { session: Session; version: SessionVersion }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const meta = {
    title: session.title,
    stack: stackLabel(session.stack),
    device: deviceLabel(session.device),
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <GlowButton variant="outline" size="sm" active={open} onClick={() => setOpen((o) => !o)}>
        {copied ? (
          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
        ) : (
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        {copied ? "Copied" : "Export"}
      </GlowButton>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-bg-elevated py-1 shadow-elegant">
          <button
            onClick={() => {
              setOpen(false);
              void exportVersionPDF(version, meta);
            }}
            className="flex w-full px-3 py-2 text-left text-[14px] text-foreground transition-colors hover:bg-bg-tertiary"
          >
            Download PDF
          </button>
          <button
            onClick={() => {
              setOpen(false);
              void navigator.clipboard.writeText(versionMarkdown(version, meta));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex w-full px-3 py-2 text-left text-[14px] text-foreground transition-colors hover:bg-bg-tertiary"
          >
            Copy as Markdown
          </button>
        </div>
      )}
    </div>
  );
}

/** Before the first result: the uploaded screen(s) with the run's state over them. */
function PendingCanvas({ session }: { session: Session }) {
  let screens: FlowScreen[] = [];
  for (let i = session.messages.length - 1; i >= 0; i--) {
    const m = session.messages[i];
    if (m.kind === "prompt" && m.attachments.length > 0) {
      screens = [...m.attachments].sort((a, b) => a.order - b.order);
      break;
    }
  }
  const scanning =
    session.status === "analyzing" || session.status === "triaging" || session.status === "new";
  const label =
    session.status === "awaiting-answers"
      ? "Waiting for your answers"
      : session.status === "analyzing"
        ? "Analyzing"
        : session.status === "error" || session.status === "interrupted"
          ? "Not analyzed yet"
          : "Reading";

  return (
    <div className="@container h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-[12px] text-text-tertiary">
          {scanning && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />}
          {label}
        </div>
        <div className={cn("grid gap-3", screens.length > 1 && "@2xl:grid-cols-2")}>
          {screens.map((s, i) => (
            <div
              key={s.id}
              className="rounded-2xl border border-border-strong bg-bg-tertiary p-2.5"
            >
              <div className="relative overflow-hidden rounded-xl bg-bg-secondary">
                <img src={s.dataUrl} alt={s.name} className="block h-auto w-full" />
                {scanning && (
                  <>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-x-0 top-0 h-1/5 animate-scan bg-gradient-to-b from-transparent via-primary/25 to-transparent" />
                  </>
                )}
              </div>
              {screens.length > 1 && (
                <div className="px-1 pt-2 text-[12px] font-medium text-muted-foreground">
                  Screen {i + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

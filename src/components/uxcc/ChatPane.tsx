import { useEffect, useRef, useState } from "react";
import { BorderBeam } from "border-beam";
import { useTheme } from "@/lib/theme";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";
import type { Session, SessionMessage } from "@/lib/session-types";
import type { FlowScreen } from "@/lib/flow-types";
import type { Severity } from "@/lib/mock-data";
import { compressImageDataUrl } from "@/lib/image-utils";
import { FLOW_MAX_SCREENS, FLOW_MIN_SCREENS } from "@/lib/pricing";
import { versionScore } from "@/lib/session-utils";
import {
  orderedFixes,
  recheckOf,
  scoreVerdict,
  SEVERITY_LABEL,
  versionAnswer,
  type Recheck,
} from "@/lib/critique";
import { versionPrompt } from "@/lib/fix-prompts";
import { cn } from "@/lib/utils";
import { CopyButton } from "./CopyButton";
import { QuestionCard } from "./QuestionCard";
import { AttachmentTile, ComposerFrame, ComposerIconButton, SendButton } from "./composer-parts";
import { ISSUE_NUMBER, SEVERITY_TEXT, scoreTone } from "./AnnotatedScreenshot";
import { GlowButton } from "./GlowButton";

// The conversation. Every step of a critique is a message — the user's prompt
// + screenshots, any clarifying questions, live progress, the result (a
// critique tile that opens the critique panel, plus its top issues), and
// follow-up Q&A. Messages sit in a centred reading column so the pane reads
// the same full-width or docked beside the panel. See
// design-system/organisms/chat-pane.md.

interface ChatPaneProps {
  session: Session;
  /** Version shown in the open critique panel, or null when it's closed. */
  openVersion: number | null;
  onOpenCritique: (version: number) => void;
  onAnswer: (messageId: string, answers: Record<string, string>) => void;
  onSkip: (messageId: string) => void;
  onRetry: () => void;
  onSend: (text: string, attachments: FlowScreen[]) => void;
  onSelectIssue: (version: number, fixId: string) => void;
  /** Closes the critique panel (the open tile toggles it). */
  onCloseCritique?: () => void;
  /** The user's answer to an input check: upload another image, or go ahead. */
  onCheck: (messageId: string, choice: "retry" | "proceed") => void;
  /** The composer's file input, owned by the page so the critique can start a re-check too. */
  fileRef?: React.RefObject<HTMLInputElement | null>;
}

export function ChatPane({
  session,
  openVersion,
  onOpenCritique,
  onAnswer,
  onSkip,
  onRetry,
  onSend,
  onSelectIssue,
  onCloseCritique,
  onCheck,
  fileRef: externalFileRef,
}: ChatPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // The composer's file input, so "Re-check" in a result can open the picker.
  const ownFileRef = useRef<HTMLInputElement>(null);
  const fileRef = externalFileRef ?? ownFileRef;
  const canRecheck = !session.readOnly && session.status === "done";
  const { status } = session;

  const last = session.messages[session.messages.length - 1];
  const lastId = last?.id;

  // Follow the conversation, except when it ends on a result: then start at
  // the top of that result, so its answer is the first thing you read.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const result = last?.kind === "result" && status === "done";
    const target = result ? el.querySelector<HTMLElement>(`[data-msg="${lastId}"]`) : null;
    el.scrollTo({ top: target ? target.offsetTop - 20 : el.scrollHeight, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.messages.length, status]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className={cn(COLUMN, "space-y-5")}>
          {session.messages.map((m) => (
            <div key={m.id} data-msg={m.id}>
              <Message
                message={m}
                session={session}
                isLast={m.id === lastId}
                openVersion={openVersion}
                onOpenCritique={onOpenCritique}
                onAnswer={onAnswer}
                onSkip={onSkip}
                onRetry={onRetry}
                onSelectIssue={onSelectIssue}
                onCloseCritique={onCloseCritique}
                onCheck={(mid, choice) => {
                  onCheck(mid, choice);
                  // "Upload another": open the picker right away (it needs the click).
                  if (choice === "retry") fileRef.current?.click();
                }}
                onRecheck={canRecheck ? () => fileRef.current?.click() : undefined}
              />
            </div>
          ))}

          {(status === "new" || status === "triaging") && (
            <Assistant>
              <Thinking label="Looking at your screenshot" />
            </Assistant>
          )}
          {status === "analyzing" && (
            <Assistant>
              <ProgressSteps flow={session.mode === "flow"} />
            </Assistant>
          )}
          {status === "replying" && (
            <Assistant>
              <Thinking label="Thinking" />
            </Assistant>
          )}
          {status === "interrupted" && (
            <Assistant>
              <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-4">
                <p className="text-[14px] text-muted-foreground">
                  This review was interrupted when the page closed. Nothing was charged.
                </p>
                <RetryButton onClick={onRetry} />
              </div>
            </Assistant>
          )}
        </div>
      </div>

      {session.readOnly ? (
        <div className="shrink-0 p-4">
          <div className="mx-auto flex max-w-[720px] items-center justify-between gap-3 rounded-2xl border border-border bg-bg-tertiary/60 p-3 pl-4">
            <p className="text-[14px] text-muted-foreground">This is a sample review.</p>
            <CosmicButton as="link" to="/app" size="sm" className="shrink-0">
              Review yours <ArrowRight className="h-3.5 w-3.5" />
            </CosmicButton>
          </div>
        </div>
      ) : (
        <ChatComposer
          fileRef={fileRef}
          mode={session.mode}
          disabled={status !== "done"}
          hint={
            status === "awaiting-answers"
              ? last?.kind === "check"
                ? "Answer the question above to continue"
                : "Check the details above, then start the review"
              : status === "error" || status === "interrupted"
                ? "Retry the review above to continue"
                : undefined
          }
          onSend={onSend}
        />
      )}
    </div>
  );
}

function Message({
  message: m,
  session,
  isLast,
  openVersion,
  onOpenCritique,
  onAnswer,
  onSkip,
  onRetry,
  onSelectIssue,
  onCloseCritique,
  onCheck,
  onRecheck,
}: {
  message: SessionMessage;
  session: Session;
  isLast: boolean;
  onRecheck?: () => void;
} & Pick<
  ChatPaneProps,
  | "openVersion"
  | "onOpenCritique"
  | "onCloseCritique"
  | "onAnswer"
  | "onSkip"
  | "onRetry"
  | "onSelectIssue"
  | "onCheck"
>) {
  if (m.kind === "prompt") {
    return (
      // The user's turn sits in a bubble, like a messaging app; the assistant's
      // replies sit directly on the surface. Screenshots and text share it.
      <div className="flex justify-end">
        <div
          className={cn(
            "max-w-[85%] rounded-2xl rounded-tr-md bg-foreground/[0.07] p-1.5",
            // One screenshot spans the bubble and the note wraps under it.
            m.attachments.length === 1 ? "w-[264px]" : "sm:max-w-[360px]",
          )}
        >
          {m.attachments.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5">
              {m.attachments.map((a, i) => (
                <div
                  key={a.id}
                  className={cn(
                    "relative overflow-hidden rounded-xl bg-bg-secondary",
                    m.attachments.length === 1 ? "aspect-[16/10] w-full" : "h-20 w-32",
                  )}
                >
                  <img
                    src={a.dataUrl}
                    alt={a.name}
                    className="h-full w-full object-cover object-top"
                  />
                  {m.attachments.length > 1 && (
                    <span className="absolute left-1 top-1 grid h-4 w-4 place-items-center rounded bg-black/60 text-[10px] font-semibold text-white">
                      {i + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {m.text && (
            <p className="whitespace-pre-wrap px-2 pb-1 pt-1.5 text-[14px] leading-relaxed text-foreground">
              {m.text}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (m.kind === "questions") {
    const pending = !m.answers && !m.skipped;
    const n = m.questions.length;
    const ask = n === 1 ? "answer one question" : `answer ${n} quick questions`;
    const lead = !pending
      ? "Thanks, that's what I needed."
      : m.assumed
        ? `Before I start, check what I'm assuming${n > 0 ? ` and ${ask}` : ""}. Correct anything that's off; it makes the review more accurate.`
        : n === 1
          ? "One quick question so the review fits your product:"
          : "A few quick questions so the review fits your product:";
    return (
      <Assistant>
        <p className="mb-2.5 text-[14px] leading-relaxed text-foreground">{lead}</p>
        <QuestionCard
          questions={m.questions}
          assumed={m.assumed}
          answers={m.answers}
          skipped={m.skipped}
          disabled={!pending || session.status !== "awaiting-answers"}
          onSubmit={(answers) => onAnswer(m.id, answers)}
          onSkip={() => onSkip(m.id)}
        />
      </Assistant>
    );
  }

  if (m.kind === "result") {
    const v = session.versions[m.version];
    if (!v) return null;
    const fixes = orderedFixes(v);
    const recheck = recheckOf(session, m.version);
    const latest = m.version === session.versions.length - 1;
    // The chat names the issues that matter most; the critique has them all.
    const important = fixes.filter((f) => f.severity !== "low");
    const shown = (important.length > 0 ? important : fixes).slice(0, 3);
    const rest = fixes.length - shown.length;
    return (
      <Assistant>
        <p className="text-[15px] leading-relaxed text-foreground">{versionAnswer(v)}</p>

        {recheck && <RecheckSummary recheck={recheck} />}

        {shown.length > 0 && (
          <>
            <ChatLabel>{recheck ? "Still to fix" : "What to fix"}</ChatLabel>
            <ol className="space-y-3.5">
              {shown.map((f) => (
                <li key={f.id} className="flex gap-2.5">
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                      ISSUE_NUMBER,
                    )}
                  >
                    {fixes.indexOf(f) + 1}
                  </span>
                  <div className="min-w-0 flex-1 text-[14px] leading-relaxed">
                    <button
                      type="button"
                      onClick={() => onSelectIssue(m.version, f.id)}
                      className="text-left font-semibold text-foreground decoration-border-strong underline-offset-4 hover:underline"
                    >
                      {f.title}
                    </button>
                    <span className={cn("ml-2 text-[12px] font-medium", SEVERITY_TEXT[f.severity])}>
                      {SEVERITY_LABEL[f.severity]}
                    </span>
                    <p className="mt-0.5 text-muted-foreground">{f.why}</p>
                    <p className="mt-0.5 text-muted-foreground">
                      <span className="font-medium text-foreground">Fix: </span>
                      {f.solution}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            {rest > 0 && (
              <p className="mt-2.5 pl-[30px] text-[13px] text-text-tertiary">
                {rest} more lower-priority {rest === 1 ? "issue" : "issues"} in the review.
              </p>
            )}
          </>
        )}

        <div className="mt-4">
          <CritiqueTile
            session={session}
            version={m.version}
            open={openVersion === m.version}
            onOpen={() => onOpenCritique(m.version)}
            onClose={onCloseCritique}
          />
        </div>

        {latest && (
          <NextSteps
            prompt={versionPrompt(session, v)}
            allFixed={fixes.length === 0}
            readOnly={!!session.readOnly}
            onRecheck={onRecheck}
          />
        )}
      </Assistant>
    );
  }

  // The input check: what was uploaded doesn't fit the task, so ask before analysing.
  if (m.kind === "check") {
    const recheck = m.scope === "recheck";
    return (
      <Assistant>
        <div
          className={cn(
            "rounded-2xl border p-4",
            m.choice ? "border-border bg-bg-tertiary/60" : "border-border-strong bg-bg-tertiary/80",
          )}
        >
          <p className="text-[14px] leading-relaxed text-foreground">{m.text}</p>
          {m.choice ? (
            <p className="mt-2 text-[13px] text-text-tertiary">
              {m.choice === "retry"
                ? "Attach the right image below."
                : recheck
                  ? "Comparing anyway, as you asked."
                  : "Critiquing it anyway, as you asked."}
            </p>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                <GlowButton size="sm" onClick={() => onCheck(m.id, "retry")}>
                  {recheck ? "Upload the updated screen" : "Upload a different image"}
                </GlowButton>
                <GlowButton variant="outline" size="sm" onClick={() => onCheck(m.id, "proceed")}>
                  {recheck ? "Compare anyway" : "Review it anyway"}
                </GlowButton>
              </div>
              <p className="mt-2.5 text-[12px] text-text-tertiary">No credit used yet.</p>
            </>
          )}
        </div>
      </Assistant>
    );
  }

  if (m.kind === "text") {
    return (
      <Assistant>
        <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
          {m.text}
        </div>
      </Assistant>
    );
  }

  // error
  return (
    <Assistant>
      <div className="rounded-2xl border border-severity-high/25 bg-severity-high/10 p-4">
        <p className="flex items-start gap-2 text-[14px] text-severity-high">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {m.text}
        </p>
        {isLast && session.status === "error" && <RetryButton onClick={onRetry} />}
      </div>
    </Assistant>
  );
}

/** Centred reading column shared by the messages and the composer. */
const COLUMN = "mx-auto w-full max-w-[720px]";

/**
 * The finished critique as a document in the chat, like an artifact tile in a
 * Claude chat: the screenshot, its title, the score and counts. Clicking it
 * opens the critique panel beside the conversation; while it's open the tile
 * shows that it's the one on screen, and clicking it again hides the panel.
 */
function CritiqueTile({
  session,
  version,
  open,
  onOpen,
  onClose,
}: {
  session: Session;
  version: number;
  open: boolean;
  onOpen: () => void;
  onClose?: () => void;
}) {
  const v = session.versions[version];
  const score = versionScore(v);
  const fixes = v.mode === "flow" ? v.result.findings : v.result.fixes;
  const thumb = [...v.attachments].sort((a, b) => a.order - b.order)[0]?.dataUrl;
  const { theme } = useTheme();
  // cult-ui's Border Beam Card (the border-beam package), in its warm
  // "sunset" palette: a beam runs round the tile while it's closed, to say
  // "open me". It fades out once the analysis is open.
  return (
    <BorderBeam
      size="md"
      colorVariant="sunset"
      theme={theme === "dark" ? "dark" : "light"}
      active={!open}
      // Must match the tile's own corners: rounded-2xl is 24px in this theme
      // (--radius-2xl). At 16 the light traced a tighter shape than the tile
      // and showed as a second container at the corners.
      borderRadius={24}
      duration={3.2}
      strength={0.75}
      className="block w-full max-w-[420px]"
    >
      <button
        type="button"
        onClick={open && onClose ? onClose : onOpen}
        aria-pressed={open}
        aria-label={open ? "Hide the review" : undefined}
        className={cn(
          // Glass: translucent, frosted, a bright top edge. Opaquer while its critique is open.
          "group relative flex w-full max-w-[420px] items-center gap-3 rounded-2xl border p-2 pr-2.5 text-left backdrop-blur-xl transition-[background-color,border-color] duration-300",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
          open
            ? "border-white bg-white/75 dark:border-white/20 dark:bg-white/[0.08]"
            : "border-white/70 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]",
        )}
      >
        <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-secondary">
          {thumb && <img src={thumb} alt="" className="h-full w-full object-cover object-top" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-foreground">
            {v.mode === "flow" ? "What's off in this flow" : "What's off"}
            {session.versions.length > 1 && (
              <span className="ml-1.5 text-[12px] font-normal text-text-tertiary">
                v{version + 1}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-text-tertiary">
            <span className={cn("font-semibold", scoreTone(score))}>{score}</span>/100 ·{" "}
            {scoreVerdict(score)} · {fixes.length} {fixes.length === 1 ? "issue" : "issues"}
          </span>
        </span>
        {/* An outline button, drawn here (the whole tile is the control). Not the
          primary: opening the critique is never the next action on its own. */}
        <span
          className={cn(
            "flex h-8 shrink-0 items-center gap-0.5 rounded-[12px] border pl-3 text-[13px] font-medium text-foreground shadow-sm transition-colors duration-150",
            open ? "pr-3" : "pr-2",
            "border-border bg-bg-tertiary group-hover:border-border-strong group-hover:bg-bg-elevated",
          )}
        >
          {open ? "Close" : "Open"}
          {!open && <ChevronRight className="h-3.5 w-3.5" />}
        </span>
      </button>
    </BorderBeam>
  );
}

function ChatLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 mt-5 text-[13px] font-semibold text-foreground">{children}</p>;
}

/** A re-check in one line: the score change and the counts. The critique itemises them. */
function RecheckSummary({ recheck: r }: { recheck: Recheck }) {
  const delta = r.scoreAfter - r.scoreBefore;
  const counts = [
    r.fixed && `${r.fixed} fixed`,
    r.partly && `${r.partly} partly fixed`,
    r.open && `${r.open} still open`,
    r.unseen && `${r.unseen} not visible`,
    r.newIssues.length && `${r.newIssues.length} new`,
  ].filter(Boolean);
  return (
    <>
      <ChatLabel>Since v{r.against}</ChatLabel>
      <p className="text-[14px] text-muted-foreground">
        Score {r.scoreBefore} →{" "}
        <span className="font-semibold text-foreground">{r.scoreAfter}</span>{" "}
        <span className={cn("font-medium", delta < 0 ? "text-primary" : "text-foreground")}>
          ({delta >= 0 ? "+" : "−"}
          {Math.abs(delta)})
        </span>
        {counts.length > 0 && ` · ${counts.join(" · ")}`}
      </p>
    </>
  );
}

/**
 * The Fix → Re-check loop, spelled out under the latest result: copy the
 * prompt, apply it in your AI tool, attach the updated screen. The re-check
 * compares against this version (design-system/patterns/recheck-loop.md).
 */
function NextSteps({
  prompt,
  allFixed,
  readOnly,
  onRecheck,
}: {
  prompt: string;
  allFixed: boolean;
  readOnly: boolean;
  onRecheck?: () => void;
}) {
  if (allFixed) {
    return (
      <p className="mt-5 text-[14px] leading-relaxed text-muted-foreground">
        Nothing left to fix here. Attach another screen whenever you want a fresh check.
      </p>
    );
  }
  const steps: { text: string; action?: React.ReactNode }[] = [
    {
      text: "Paste the prompt into Cursor, Claude Code, v0 or Lovable.",
      action: prompt ? (
        <CopyButton text={prompt} label="Copy fix prompt" className="min-w-[152px]" />
      ) : undefined,
    },
    {
      text: "Attach the updated screen. I'll mark what's fixed.",
      action:
        !readOnly && onRecheck ? (
          <GlowButton variant="outline" size="sm" className="min-w-[152px]" onClick={onRecheck}>
            Re-check
          </GlowButton>
        ) : undefined,
    },
  ];
  return (
    <div className="relative mt-5 rounded-xl border border-border bg-bg-tertiary/60 p-4">
      <p className="text-[13px] font-semibold text-foreground">Fix it, then re-check</p>
      <ol className="mt-3 space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-[6px] grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border-strong text-[11px] font-semibold tabular-nums text-foreground">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <span className="min-w-0 flex-1 basis-[200px] text-[14px] leading-relaxed text-foreground">
                {step.text}
              </span>
              {step.action && <span className="shrink-0">{step.action}</span>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Assistant({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2.5"
    >
      <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border bg-bg-elevated text-[12px] font-bold text-foreground">
        D.
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </motion.div>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-3 inline-flex h-8 items-center gap-1.5 border border-border bg-bg-tertiary/60 px-3 text-[14px] font-medium text-foreground transition-colors hover:border-border-strong hover:bg-bg-elevated"
      style={{ borderRadius: "12px" }}
    >
      <RotateCcw className="h-3.5 w-3.5" /> Retry
    </button>
  );
}

function Thinking({ label }: { label: string }) {
  return (
    <div className="flex h-6 items-center gap-2 text-[14px] text-muted-foreground">
      {label}
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1 w-1 rounded-full bg-muted-foreground animate-pulse-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </span>
    </div>
  );
}

const STEPS = [
  { at: 0, label: "Reading the screen" },
  { at: 3, label: "Pass 1 · Checking heuristics and accessibility rules" },
  { at: 9, label: "Pass 2 · Judging hierarchy, copy, and flow for your users" },
  { at: 16, label: "Writing paste-ready fix prompts" },
];
const FLOW_STEPS = [
  { at: 0, label: "Reading each screen in order" },
  { at: 4, label: "Walking the flow as your user" },
  { at: 11, label: "Checking transitions for dead ends and lost context" },
  { at: 18, label: "Writing paste-ready fix prompts" },
];

function ProgressSteps({ flow }: { flow: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = window.setInterval(() => setElapsed((Date.now() - start) / 1000), 500);
    return () => clearInterval(t);
  }, []);
  const steps = flow ? FLOW_STEPS : STEPS;
  const current = steps.filter((s) => elapsed >= s.at).length - 1;

  return (
    <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-4">
      <ol className="space-y-2.5">
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={cn(
              "flex items-center gap-2.5 text-[14px] transition-colors",
              i < current
                ? "text-muted-foreground"
                : i === current
                  ? "text-foreground"
                  : "text-text-tertiary/60",
            )}
          >
            {i < current ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />
            ) : i === current ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-text-tertiary" />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border-strong" />
            )}
            {s.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ChatComposer({
  fileRef,
  mode,
  disabled,
  hint,
  onSend,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  mode: Session["mode"];
  disabled: boolean;
  hint?: string;
  onSend: (text: string, attachments: FlowScreen[]) => void;
}) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<FlowScreen[]>([]);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const max = mode === "flow" ? FLOW_MAX_SCREENS : 1;
  const needsMore =
    mode === "flow" && attachments.length > 0 && attachments.length < FLOW_MIN_SCREENS;
  const canSend = !disabled && !needsMore && (text.trim().length > 0 || attachments.length > 0);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  const add = async (files: FileList) => {
    const images = Array.from(files)
      .filter((f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024)
      .slice(0, mode === "flow" ? max - attachments.length : 1);
    if (images.length < files.length)
      toast.error("Some files were skipped (images up to 5MB only).");
    const added: FlowScreen[] = [];
    for (const f of images) {
      added.push({
        id: crypto.randomUUID(),
        order: 0,
        name: f.name,
        dataUrl: await compressImageDataUrl(await readAsDataUrl(f)),
        source: "upload",
      });
    }
    const next = mode === "flow" ? [...attachments, ...added] : added;
    setAttachments(next.map((a, i) => ({ ...a, order: i })));
  };

  const send = () => {
    if (!canSend) return;
    onSend(text, attachments);
    setText("");
    setAttachments([]);
  };

  const remove = (id: string) =>
    setAttachments(attachments.filter((x) => x.id !== id).map((x, j) => ({ ...x, order: j })));

  // Same Claude-style input as the new-critique composer
  // (organisms/prompt-composer.md), compact: smaller tiles, one text row.
  return (
    <div className="shrink-0 p-3">
      <ComposerFrame
        disabled={disabled}
        onFiles={(f) => void add(f)}
        dropLabel={mode === "flow" ? "Drop updated screens" : "Drop an updated screenshot"}
        className={cn(COLUMN, "p-2.5")}
      >
        {attachments.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5 px-1 pt-1">
            {attachments.map((a, i) => (
              <AttachmentTile
                key={a.id}
                size="sm"
                src={a.dataUrl}
                name={a.name}
                order={mode === "flow" ? i + 1 : undefined}
                onRemove={() => remove(a.id)}
              />
            ))}
          </div>
        )}
        <textarea
          ref={areaRef}
          rows={1}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={
            hint ??
            (attachments.length > 0
              ? "Add a note on what changed (optional), then send to re-check"
              : "Ask a question, or attach the updated screen")
          }
          aria-label="Message"
          className="block max-h-[140px] w-full resize-none bg-transparent px-1.5 py-1.5 text-[14px] leading-[1.5] text-foreground placeholder:text-text-tertiary focus:outline-none disabled:cursor-not-allowed"
        />
        <div className="mt-1 flex items-center gap-2">
          <ComposerIconButton
            label={mode === "flow" ? "Attach updated screens" : "Attach updated screenshot"}
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
          >
            <Plus className="h-4 w-4" />
          </ComposerIconButton>
          <div className="ml-auto flex items-center gap-2">
            {needsMore && (
              <span className="text-[12px] text-text-tertiary">
                Add {FLOW_MIN_SCREENS - attachments.length} more screen
              </span>
            )}
            <SendButton label="Send" disabled={!canSend} onClick={send} />
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple={mode === "flow"}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void add(e.target.files);
            e.target.value = "";
          }}
        />
      </ComposerFrame>
    </div>
  );
}

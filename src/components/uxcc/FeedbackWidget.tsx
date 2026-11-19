import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageSquareHeart, Minus, X } from "lucide-react";
import { GlassIcon } from "./GlassIcon";
import { useAuth } from "@/lib/auth-context";
import { HELPED, RATINGS, ROLES } from "@/lib/feedback-types";
import { useSession } from "@/lib/session-store";
import { versionScore } from "@/lib/session-utils";
import { submitFeedback } from "@/server/feedback";
import { cn } from "@/lib/utils";
import { GlowButton } from "./GlowButton";
import { Reveal } from "@/lib/reveal";

// In-app feedback while people test the product (patterns/feedback.md).
//
// - It opens on its own when an analysis finishes on screen (not on old
//   sessions, not on samples), as a small card in the bottom-right corner.
// - One tap rates it; then optional chips and two short text fields.
// - Minimise: it folds to a "Rate this review" pill and waits.
//   Close: it goes away, and comes back as the pill 3 minutes later, so
//   people can read and try the fixes first. Done: not asked again for that
//   session, nor for 12 hours.
// - "Feedback" in the sidebar opens it any time (a window event).

export const OPEN_FEEDBACK_EVENT = "datsoff:feedback";
const STORE_KEY = "datsoff-feedback";
const REMIND_AFTER = 3 * 60_000;
const QUIET_AFTER_SENDING = 12 * 3600_000;

type Memory = { given: string[]; lastSentAt: number };

function readMemory(): Memory {
  try {
    const m = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null") as Memory | null;
    return m && Array.isArray(m.given) ? m : { given: [], lastSentAt: 0 };
  } catch {
    return { given: [], lastSentAt: 0 };
  }
}
function remember(sessionId: string | null) {
  try {
    const m = readMemory();
    if (sessionId) m.given = [sessionId, ...m.given.filter((g) => g !== sessionId)].slice(0, 200);
    m.lastSentAt = Date.now();
    localStorage.setItem(STORE_KEY, JSON.stringify(m));
  } catch {
    // storage blocked: it may ask again, that's all
  }
}
function shouldAsk(sessionId: string) {
  const m = readMemory();
  return !m.given.includes(sessionId) && Date.now() - m.lastSentAt > QUIET_AFTER_SENDING;
}

/** The feedback icon, shared with the sidebar's Feedback item. */
export const FEEDBACK_ICON = MessageSquareHeart;

type View = "hidden" | "open" | "pill";
type Step = "rate" | "more" | "thanks";

export function FeedbackWidget() {
  const params = useParams({ strict: false }) as { sessionId?: string };
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session } = useSession(params.sessionId ?? "");
  const { sessionToken } = useAuth();

  const [view, setView] = useState<View>("hidden");
  const [step, setStep] = useState<Step>("rate");
  const [rating, setRating] = useState<number | null>(null);
  const [helped, setHelped] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [improve, setImprove] = useState("");
  const [idea, setIdea] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remind = useRef<ReturnType<typeof setTimeout>>(undefined);
  const about = useRef<string | null>(null);

  const reset = () => {
    setStep("rate");
    setRating(null);
    setHelped([]);
    setImprove("");
    setIdea("");
    setError(null);
  };

  const open = useCallback((sessionId: string | null) => {
    clearTimeout(remind.current);
    about.current = sessionId;
    setView("open");
  }, []);

  // Trigger: an analysis finishes while this session is on screen.
  const seen = useRef<{ id: string; versions: number; done: boolean } | null>(null);
  const id = session?.id;
  const versions = session?.versions.length ?? 0;
  const done = session?.status === "done";
  const readOnly = !!session?.readOnly;
  useEffect(() => {
    if (!id || readOnly) return;
    const before = seen.current;
    seen.current = { id, versions, done };
    if (!before || before.id !== id) return; // just opened: not a fresh result
    const fresh = done && (versions > before.versions || !before.done);
    if (!fresh || !shouldAsk(id)) return;
    reset();
    const t = setTimeout(() => open(id), 1500); // let the result land first
    return () => clearTimeout(t);
  }, [id, versions, done, readOnly, open]);

  // The sidebar's "Feedback" opens it any time.
  useEffect(() => {
    const onOpen = () => {
      if (step === "thanks") reset();
      open(params.sessionId ?? null);
    };
    window.addEventListener(OPEN_FEEDBACK_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_FEEDBACK_EVENT, onOpen);
  }, [open, params.sessionId, step]);

  useEffect(() => () => clearTimeout(remind.current), []);

  // Esc folds the open card to the pill (answer later), unless a dialog is
  // open on top: then Esc belongs to the dialog.
  useEffect(() => {
    if (view !== "open") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector('[role="dialog"]')) return;
      setView("pill");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  const close = () => {
    setView("hidden");
    clearTimeout(remind.current);
    if (step === "thanks") return;
    remind.current = setTimeout(() => setView((v) => (v === "hidden" ? "pill" : v)), REMIND_AFTER);
  };

  const send = async () => {
    if (rating === null) return;
    setSending(true);
    setError(null);
    const s = about.current === session?.id ? session : undefined;
    const v = s?.versions[s.versions.length - 1];
    try {
      await submitFeedback({
        data: {
          rating,
          helped,
          improve,
          idea,
          role,
          sessionId: about.current,
          mode: v?.mode ?? null,
          score: v ? versionScore(v) : null,
          sessionToken,
          page: pathname,
        },
      });
      remember(about.current);
      setStep("thanks");
      setTimeout(() => setView("hidden"), 2600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that. Try again?");
    } finally {
      setSending(false);
    }
  };

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <div
      data-ui-icons
      className="pointer-events-none fixed inset-x-3 bottom-3 z-40 flex justify-end sm:inset-x-auto sm:bottom-5 sm:right-5"
    >
      <AnimatePresence mode="wait">
        {view === "pill" && (
          <motion.button
            key="pill"
            type="button"
            onClick={() => open(about.current ?? params.sessionId ?? null)}
            // Icon only: a glass FAB. The name lives in the label and tooltip.
            aria-label="Rate this review"
            title="Rate this review"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto rounded-full transition-transform duration-300 ease-out hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <GlassIcon icon={FEEDBACK_ICON} size={52} round />
          </motion.button>
        )}

        {view === "open" && (
          <motion.section
            key="card"
            role="dialog"
            aria-label="Feedback"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto relative w-full rounded-[20px] border border-border bg-bg-tertiary p-4 shadow-elegant sm:w-[360px] sm:p-5"
          >
            <div className="absolute right-2.5 top-2.5 flex items-center">
              {step !== "thanks" && (
                <IconBtn label="Minimise" onClick={() => setView("pill")}>
                  <Minus className="h-4 w-4" />
                </IconBtn>
              )}
              <IconBtn label="Close" onClick={close}>
                <X className="h-4 w-4" />
              </IconBtn>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {step === "thanks" ? (
                <motion.div
                  key="thanks"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 py-2 pr-16"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-foreground text-background">
                    <Check className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">Thank you.</p>
                    <p className="text-[13px] text-text-tertiary">
                      We read every one. It shapes what we fix next.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="form" initial={false} className="space-y-4">
                  <div className="pr-16">
                    <p className="text-[15px] font-semibold leading-snug text-foreground">
                      How did this review land?
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-text-tertiary">
                      We&rsquo;re building this for vibe coders and devs. Tell us what to fix.
                    </p>
                  </div>

                  <div role="radiogroup" aria-label="Rating" className="grid grid-cols-4 gap-1.5">
                    {RATINGS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        role="radio"
                        aria-checked={rating === r.value}
                        onClick={() => {
                          setRating(r.value);
                          setStep("more");
                        }}
                        className={cn(
                          "h-9 rounded-[12px] border text-[12.5px] font-medium transition-colors duration-200",
                          rating === r.value
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-bg-secondary text-muted-foreground hover:border-border-strong hover:text-foreground",
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence initial={false}>
                    {step === "more" && (
                      <Reveal transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                        <div className="space-y-4 pb-0.5">
                          <Field label="What helped?">
                            <div className="flex flex-wrap gap-1.5">
                              {HELPED.map((h) => (
                                <Toggle
                                  key={h}
                                  on={helped.includes(h)}
                                  onClick={() => setHelped((l) => toggle(l, h))}
                                >
                                  {h}
                                </Toggle>
                              ))}
                            </div>
                          </Field>
                          <Field label="What should we fix or add?">
                            <TextArea
                              value={improve}
                              onChange={setImprove}
                              placeholder="Something wrong, confusing or missing…"
                            />
                          </Field>
                          <Field label="An idea for vibe coders and devs?" hint="Optional">
                            <TextArea
                              value={idea}
                              onChange={setIdea}
                              placeholder="A feature, a workflow, a theme you'd like covered…"
                            />
                          </Field>
                          <Field label="You are a">
                            <div className="flex flex-wrap gap-1.5">
                              {ROLES.map((r) => (
                                <Toggle
                                  key={r}
                                  on={role === r}
                                  onClick={() => setRole((x) => (x === r ? null : r))}
                                >
                                  {r}
                                </Toggle>
                              ))}
                            </div>
                          </Field>
                          {error && <p className="text-[12.5px] text-primary">{error}</p>}
                          <GlowButton
                            size="lg"
                            className="w-full justify-center"
                            disabled={sending}
                            onClick={send}
                          >
                            {sending ? "Sending…" : "Send feedback"}
                          </GlowButton>
                        </div>
                      </Reveal>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-foreground"
      style={{ borderRadius: "12px" }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[12.5px] font-medium text-foreground">{label}</span>
        {hint && <span className="text-[11.5px] text-text-tertiary">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-[12px] font-medium transition-colors duration-200",
        on
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-bg-secondary text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      rows={2}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={2000}
      className="w-full resize-none border border-border bg-bg-secondary px-3 py-2 text-[13.5px] leading-snug text-foreground shadow-[inset_0_1px_2px_rgba(15,17,20,0.05)] transition-[border-color,box-shadow] duration-200 placeholder:text-text-tertiary/70 hover:border-border-strong focus:border-primary/60 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_14%,transparent)] focus:outline-none"
      style={{ borderRadius: "12px" }}
    />
  );
}

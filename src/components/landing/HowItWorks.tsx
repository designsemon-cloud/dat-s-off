import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Check, Copy, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlurIn, Card, MockFrame, Section, useLoopStep } from "./primitives";
import { TOOLS } from "./ToolLogos";
import { TYPE } from "./type";

// Three steps as feature cards — two side by side, the last one wide — each
// with a small live mock of that step's UI.

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title={<>Screenshot in. Fixes out.</>}
      lede="No forms to fill in first. It reads the screen, asks only what it can't see, and hands back prompts your AI coding tool understands."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <BlurIn className="h-full">
          <StepCard
            n="01"
            title="Drop a screenshot"
            body="One screen, or 2–8 screens in order to review a whole flow. PNG, JPG, or WEBP."
          >
            <DropVisual />
          </StepCard>
        </BlurIn>
        <BlurIn delay={0.1} className="h-full">
          <StepCard
            n="02"
            title="Answer a question. Maybe."
            body="If it's obviously a checkout, it won't ask your industry. Only the one thing that changes the advice."
          >
            <QuestionVisual />
          </StepCard>
        </BlurIn>
        <BlurIn delay={0.05} className="md:col-span-2">
          <Card className="grid gap-2 p-2 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="order-2 flex flex-col justify-center px-4 pb-4 pt-3 md:order-1 md:px-6 md:py-6">
              <StepText
                n="03"
                title="Paste the fix"
                body="Every issue comes with a ready-to-paste prompt, plus one combined prompt that fixes everything critical in a single pass."
              />
            </div>
            <MockFrame className="order-1 p-4 sm:p-5 md:order-2">
              <PromptVisual />
            </MockFrame>
          </Card>
        </BlurIn>
      </div>
    </Section>
  );
}

/** Reference card layout: a full-width mock inset 8px, then the text. */
function StepCard({
  n,
  title,
  body,
  children,
}: {
  n: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex h-full flex-col p-2">
      <MockFrame className="h-[210px] p-4">{children}</MockFrame>
      <div className="px-4 pb-4 pt-5">
        <StepText n={n} title={title} body={body} />
      </div>
    </Card>
  );
}

function StepText({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <>
      <div className={TYPE.index}>{n}</div>
      <h3 className={cn(TYPE.title, "mt-2")}>{title}</h3>
      <p className={cn(TYPE.body, "mt-1.5")}>{body}</p>
    </>
  );
}

// Each mock loops its step while it's on screen (useLoopStep). The last step
// is the resolved state, which is also what reduced motion shows.

function MiniCursor({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 22" className={cn("h-4 w-3 drop-shadow", className)}>
      <path
        d="M1 1 L1 17 L5.5 12.8 L9 20.5 L12 19.2 L8.6 11.8 L14.6 11.8 Z"
        className="fill-bg-tertiary stroke-foreground"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 0 file waits · 1 dragged over · 2 dropped · 3 typed · 4 send · 5–6 critiquing */
function DropVisual() {
  const { ref, step } = useLoopStep(7, 700);
  const over = step === 1;
  const dropped = step >= 2;
  return (
    <div ref={ref} className="relative flex h-full flex-col justify-end">
      <AnimatePresence>
        {step >= 5 && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 top-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-tertiary px-2.5 py-1 text-[12px] text-muted-foreground shadow-sm"
          >
            <Loader2 className="h-3 w-3 animate-spin" /> Reading the screen…
          </motion.span>
        )}
      </AnimatePresence>

      <motion.div
        animate={
          dropped
            ? { x: 0, y: 40, rotate: 0, scale: 0.5, opacity: 0 }
            : over
              ? { x: 0, y: 40, rotate: 0, scale: 0.92, opacity: 1 }
              : { x: 72, y: -2, rotate: 6, scale: 1, opacity: 1 }
        }
        transition={dropped ? { duration: 0.15 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 top-0 z-10 -ml-12 h-16 w-24"
      >
        <div className="h-full w-full overflow-hidden rounded-md border border-border-strong bg-bg-tertiary shadow-elegant">
          <img src="/amazon.jpg" alt="" className="h-full w-full object-cover object-top" />
        </div>
        <MiniCursor className="absolute -bottom-2 right-3" />
      </motion.div>

      <div
        className={cn(
          "rounded-xl border bg-bg-tertiary p-3 shadow-sm transition-colors duration-300",
          over ? "border-dashed border-foreground" : "border-border",
        )}
      >
        <div className="mb-2.5 flex h-6 items-center gap-2">
          {dropped && (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-6 w-9 shrink-0 overflow-hidden rounded border border-border"
            >
              <img src="/amazon.jpg" alt="" className="h-full w-full object-cover object-top" />
            </motion.span>
          )}
          <span className="truncate text-[12px] text-muted-foreground">
            {over ? (
              "Drop to attach"
            ) : step >= 3 ? (
              <motion.span
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{ duration: 0.6, ease: "linear" }}
                className="inline-block text-foreground"
              >
                Shoppers can&rsquo;t compare products
              </motion.span>
            ) : (
              <span className="text-text-tertiary">Add a screenshot…</span>
            )}
          </span>
        </div>
        <div className="relative flex items-center justify-between">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-border text-text-tertiary">
            <ImageIcon className="h-3.5 w-3.5" />
          </span>
          <motion.span
            animate={{ scale: step === 4 ? 0.82 : 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
          </motion.span>
          <motion.span
            animate={{ opacity: step === 3 || step === 4 ? 1 : 0, x: step >= 3 ? 0 : -24 }}
            transition={{ duration: 0.4 }}
            className="absolute -bottom-1 right-0"
          >
            <MiniCursor />
          </motion.span>
        </div>
      </div>
    </div>
  );
}

/** 0 asked · 1 cursor arrives · 2 picked · 3+ confirmed */
function QuestionVisual() {
  const options = ["First-time buyers", "Returning shoppers", "Both"];
  const { ref, step } = useLoopStep(6, 750);
  return (
    <div ref={ref} className="flex h-full flex-col justify-center">
      <div className="mb-1.5 text-[12px] text-text-tertiary">
        Looks like B2C e-commerce. One question:
      </div>
      <p className="mb-3 text-[14px] font-semibold text-foreground">Who is this page mainly for?</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o, i) => {
          const picked = i === 1 && step >= 2;
          return (
            <span
              key={o}
              className={cn(
                "relative rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors duration-300",
                picked
                  ? "border-foreground bg-foreground text-background"
                  : i === 1 && step === 1
                    ? "border-border-strong bg-bg-elevated text-foreground"
                    : "border-border bg-bg-tertiary text-muted-foreground",
              )}
            >
              {o}
              {i === 1 && (
                <motion.span
                  animate={{
                    x: step === 0 ? 48 : 0,
                    y: step === 0 ? 26 : 0,
                    opacity: step >= 1 && step <= 3 ? 1 : 0,
                    scale: step === 2 ? 0.85 : 1,
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -bottom-3 right-4"
                >
                  <MiniCursor />
                </motion.span>
              )}
            </span>
          );
        })}
      </div>
      <motion.p
        animate={{ opacity: step >= 3 ? 1 : 0, y: step >= 3 ? 0 : 4 }}
        transition={{ duration: 0.35 }}
        className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground"
      >
        <Check className="h-3 w-3 text-foreground" /> Got it. Judging it for repeat visits.
      </motion.p>
    </div>
  );
}

const PASTE_TARGETS = TOOLS.filter((t) => t.Mark);

/**
 * The fix prompt writes in, gets copied, then lands in one AI tool from a
 * row of real logos. Each loop picks the next tool, so the point reads in a
 * glance: one prompt, whichever tool you use.
 *   0 empty · 1 prompt writes in · 2 copied · 3 pasting into <tool> · 4–5 applied
 */
function PromptVisual() {
  const text =
    "In each product carousel, tiles show only an image. Add a one-line name and a bold price under each tile, so shoppers can compare without clicking.";
  const { ref, step } = useLoopStep(6, 900);
  const [round, setRound] = useState(0);
  const prev = useRef(step);
  useEffect(() => {
    if (step === 0 && prev.current !== 0) setRound((r) => r + 1);
    prev.current = step;
  }, [step]);
  const tool = PASTE_TARGETS[round % PASTE_TARGETS.length];
  const copied = step >= 2;
  const pasting = step === 3;
  const applied = step >= 4;

  return (
    <div ref={ref} className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-medium text-text-tertiary">Fix prompt · Issue 1</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] transition-colors",
            step === 2 ? "bg-foreground text-background" : "text-muted-foreground",
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </span>
      </div>
      <motion.p
        animate={{ clipPath: step === 0 ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)" }}
        transition={step === 0 ? { duration: 0 } : { duration: 1.2, ease: "linear" }}
        className="rounded-[10px] border border-border bg-bg-secondary px-3 py-2.5 text-[13px] leading-[1.55] text-muted-foreground"
      >
        <span className="line-clamp-3">{text}</span>
      </motion.p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-medium text-text-tertiary">Paste into</span>
          <div className="flex items-center gap-1.5">
            {PASTE_TARGETS.map((t) => {
              const on = t.name === tool.name && step >= 3;
              const M = t.Mark!;
              return (
                <motion.span
                  key={t.name}
                  title={t.name}
                  animate={{ y: on ? -2 : 0, opacity: step >= 3 && !on ? 0.45 : 1 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-[9px] border bg-bg-tertiary text-foreground transition-[border-color,box-shadow] duration-300",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,17,20,0.06)] dark:bg-bg-elevated dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]",
                    on ? "border-foreground/60 shadow-md" : "border-border",
                  )}
                >
                  <M className={t.wordmark ? "h-[18px] w-[18px]" : "h-4 w-4"} />
                </motion.span>
              );
            })}
          </div>
        </div>

        <span className="flex h-6 items-center gap-1.5 text-[12px] font-medium text-foreground">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={applied ? "done" : pasting ? "paste" : "idle"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1.5"
            >
              {applied ? (
                <>
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-foreground text-background">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  Applied in {tool.name}
                </>
              ) : pasting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-text-tertiary" />
                  Pasting into {tool.name}
                </>
              ) : (
                <span className="text-text-tertiary">Works with any AI tool</span>
              )}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </div>
  );
}

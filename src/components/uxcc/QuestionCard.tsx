import { useState } from "react";
import { motion } from "framer-motion";
import { CONTEXT_KEY, type AssumedContext, type ClarifyingQuestion } from "@/lib/session-types";
import { cn } from "@/lib/utils";
import { GlowButton } from "./GlowButton";

// The intake step, in the chat, before any credit is spent. Two parts:
// 1. What triage assumed about the product, user and main task, as editable
//    fields, so a wrong guess gets corrected instead of silently shaping the
//    critique.
// 2. 0–3 clarifying questions, asked when the answer would change the
//    critique. Each: single-select chips or a typed answer (mutually
//    exclusive). Every answer is optional.
// See design-system/organisms/question-card.md.

const FIELDS: { key: keyof AssumedContext; label: string; placeholder: string }[] = [
  { key: "productType", label: "Product", placeholder: "e.g. B2B security dashboard" },
  { key: "primaryUser", label: "Used by", placeholder: "e.g. network admins" },
  { key: "primaryTask", label: "Main task", placeholder: "e.g. spot threats and act on them" },
];

interface QuestionCardProps {
  questions: ClarifyingQuestion[];
  assumed?: AssumedContext;
  answers?: Record<string, string>;
  skipped?: boolean;
  disabled?: boolean;
  onSubmit: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

export function QuestionCard({
  questions,
  assumed,
  answers: submitted,
  skipped,
  disabled,
  onSubmit,
  onSkip,
}: QuestionCardProps) {
  const [context, setContext] = useState<AssumedContext | undefined>(assumed);
  const [chips, setChips] = useState<Record<string, string>>({});
  const [typed, setTyped] = useState<Record<string, string>>({});

  // Answered or skipped: collapse to a read-only recap.
  if (submitted || skipped) {
    const rows = [
      ...(assumed
        ? FIELDS.map((f) => ({
            label: f.label,
            value: submitted?.[CONTEXT_KEY(f.key)]?.trim() || assumed[f.key],
          }))
        : []),
      ...questions.map((q) => ({ label: q.question, value: submitted?.[q.id]?.trim() ?? "" })),
    ].filter((r) => r.value);
    return (
      <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-4">
        {rows.length === 0 ? (
          <p className="text-[14px] text-text-tertiary">Skipped. I'll work from the screenshot.</p>
        ) : (
          <dl className="space-y-2.5">
            {rows.map((r) => (
              <div key={r.label}>
                <dt className="text-[12px] text-text-tertiary">{r.label}</dt>
                <dd className="mt-0.5 text-[14px] font-medium text-foreground">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    );
  }

  const value = (id: string) => typed[id]?.trim() || chips[id] || "";
  const anyAnswered = questions.some((q) => value(q.id));
  const submit = () =>
    onSubmit({
      ...Object.fromEntries(questions.map((q) => [q.id, value(q.id)])),
      ...(context
        ? Object.fromEntries(FIELDS.map((f) => [CONTEXT_KEY(f.key), context[f.key]]))
        : {}),
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border-strong bg-bg-tertiary/80 p-4"
    >
      {context && (
        <div className="space-y-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex items-center gap-3">
              <span className="w-[72px] shrink-0 text-[13px] text-text-tertiary">{f.label}</span>
              <input
                value={context[f.key]}
                disabled={disabled}
                placeholder={f.placeholder}
                onChange={(e) => setContext({ ...context, [f.key]: e.target.value })}
                className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-bg-secondary/60 px-2.5 text-[14px] text-foreground placeholder:text-text-tertiary focus:border-border-strong focus:outline-none"
              />
            </label>
          ))}
        </div>
      )}

      {questions.length > 0 && (
        <div className={cn("space-y-4", context && "mt-4 border-t border-border pt-4")}>
          {questions.map((q, qi) => (
            <div key={q.id}>
              <p className="mb-2 text-[14px] font-medium text-foreground">
                {questions.length > 1 && (
                  <span className="mr-1.5 text-[12px] tabular-nums text-text-tertiary">
                    {qi + 1}
                  </span>
                )}
                {q.question}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {q.options.map((opt) => {
                  const active = !typed[q.id]?.trim() && chips[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setChips((c) => ({ ...c, [q.id]: c[q.id] === opt ? "" : opt }));
                        setTyped((t) => ({ ...t, [q.id]: "" }));
                      }}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-bg-secondary/60 text-muted-foreground hover:border-border-strong hover:text-foreground",
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <input
                value={typed[q.id] ?? ""}
                disabled={disabled}
                onChange={(e) => setTyped((t) => ({ ...t, [q.id]: e.target.value }))}
                placeholder="or type your own…"
                className="mt-2 h-8 w-full rounded-lg border border-border bg-bg-secondary/60 px-2.5 text-[12px] text-foreground placeholder:text-text-tertiary focus:border-border-strong focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-3">
        {/* With assumptions shown, starting as-is already is the skip. */}
        {!context && (
          <button
            type="button"
            disabled={disabled}
            onClick={onSkip}
            className="mr-auto text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip, just analyze
          </button>
        )}
        <GlowButton size="sm" disabled={disabled || (!context && !anyAnswered)} onClick={submit}>
          Start critique
        </GlowButton>
      </div>
    </motion.div>
  );
}

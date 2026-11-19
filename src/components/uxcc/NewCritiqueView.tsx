import { motion } from "framer-motion";
import { PromptComposer } from "@/components/uxcc/PromptComposer";
import { SessionCard } from "@/components/uxcc/SessionCard";
import { SAMPLE_SESSIONS } from "@/lib/samples";

// The start page of the app (/app): the question, the composer, quick
// prompts and the samples. One component, used by the route and by the
// landing page's product demo, so the demo always shows the real thing.

const SUGGESTIONS = [
  { label: "Accessibility check", prompt: "Check contrast, tap targets, and screen-reader basics" },
  { label: "Conversion review", prompt: "What's stopping users from completing the main action?" },
  {
    label: "Visual hierarchy",
    prompt: "Is the most important thing on this screen the most visible?",
  },
  { label: "Mobile readiness", prompt: "Will this work well on a phone?" },
];

export function NewCritiqueView({
  composerProps,
  onSuggestion,
}: {
  composerProps: React.ComponentProps<typeof PromptComposer>;
  onSuggestion: (prompt: string) => void;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-4 py-10 sm:px-6">
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 text-center text-[28px] font-semibold tracking-[-0.02em] text-foreground sm:text-[32px]"
        >
          What did you build<span className="text-primary">?</span>
        </motion.h1>
        <p className="mb-7 text-center text-[14px] text-muted-foreground">
          Drop a screenshot (or a few, for a flow). You&rsquo;ll get what&rsquo;s off, a prompt to
          fix each one, and the why.
        </p>

        <PromptComposer {...composerProps} />

        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => onSuggestion(s.prompt)}
              className="rounded-full border border-border bg-bg-tertiary/40 px-3 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="mb-3 text-[14px] font-medium text-text-tertiary">
            Or open a sample review
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SAMPLE_SESSIONS.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

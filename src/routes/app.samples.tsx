import { createFileRoute } from "@tanstack/react-router";
import { SessionCard } from "@/components/uxcc/SessionCard";
import { SAMPLE_SESSIONS } from "@/lib/samples";

export const Route = createFileRoute("/app/samples")({
  component: Samples,
});

function Samples() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-lg font-semibold text-foreground">Sample reviews</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Real products, reviewed end to end. Open one to see the annotated screenshot, every issue,
          and the paste-ready fix prompts.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_SESSIONS.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

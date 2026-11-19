import { useMemo, useState } from "react";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { SessionCard } from "@/components/uxcc/SessionCard";
import { sessionStore, useSessions } from "@/lib/session-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/library")({
  component: Library,
});

const FILTERS = [
  { id: "all", label: "All" },
  { id: "single", label: "Single screen" },
  { id: "flow", label: "Flow" },
] as const;

function Library() {
  const { loaded, sessions } = useSessions();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter(
      (s) => (filter === "all" || s.mode === filter) && (!q || s.title.toLowerCase().includes(q)),
    );
  }, [sessions, query, filter]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Library</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Every review you&rsquo;ve run in this browser.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex overflow-hidden border border-border bg-bg-tertiary/40"
              style={{ borderRadius: "12px" }}
            >
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "h-8 px-3 text-[14px] font-medium transition-colors",
                    filter === f.id
                      ? "bg-bg-elevated text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label className="flex h-8 w-56 items-center gap-2 rounded-lg border border-border bg-bg-tertiary/40 px-2.5 text-text-tertiary focus-within:border-border-strong">
              <Search className="h-3.5 w-3.5 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none"
              />
            </label>
          </div>
        </div>

        {loaded && sessions.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border-strong p-10 text-center">
            <p className="text-sm font-medium text-foreground">No reviews yet</p>
            <p className="mt-1 text-[14px] text-text-tertiary">
              Run your first one and it&rsquo;ll be saved here.
            </p>
            <CosmicButton as="link" to="/app" size="sm" className="mt-4">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> New review
            </CosmicButton>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onDelete={() => {
                  if (window.confirm(`Delete "${s.title}"? This can't be undone.`)) {
                    sessionStore.remove(s.id);
                  }
                }}
              />
            ))}
            {loaded && shown.length === 0 && (
              <p className="col-span-full py-8 text-center text-[14px] text-text-tertiary">
                Nothing matches that search.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

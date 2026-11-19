import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { listFeedback } from "@/server/feedback";
import { RATINGS, type FeedbackEntry } from "@/lib/feedback-types";
import { GlowButton } from "@/components/uxcc/GlowButton";
import { cn } from "@/lib/utils";

// Private: the feedback people send from the app (FeedbackWidget). Needs
// FEEDBACK_ADMIN_KEY (in .env.local / the host's env vars); the key is kept
// for this browser tab only. Not linked from anywhere, and not indexed.

export const Route = createFileRoute("/admin/feedback")({
  head: () => ({
    meta: [{ title: "Feedback · Dats Off." }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: FeedbackAdmin,
});

const KEY = "datsoff-admin-key";
const label = (r: number) => RATINGS.find((x) => x.value === r)?.label ?? String(r);

function FeedbackAdmin() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState<FeedbackEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (k: string) => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listFeedback({ data: { key: k } }));
      try {
        sessionStorage.setItem(KEY, k);
      } catch {
        // fine
      }
    } catch (e) {
      setRows(null);
      setError(e instanceof Error ? e.message : "Couldn't load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const k = sessionStorage.getItem(KEY);
      if (k) {
        setKey(k);
        void load(k);
      }
    } catch {
      // fine
    }
  }, []);

  const stats = useMemo(() => {
    if (!rows?.length) return null;
    const avg = rows.reduce((a, r) => a + r.rating, 0) / rows.length;
    const dist = RATINGS.map((r) => rows.filter((x) => x.rating === r.value).length);
    const helped = new Map<string, number>();
    rows.forEach((r) => r.helped.forEach((h) => helped.set(h, (helped.get(h) ?? 0) + 1)));
    const top = [...helped.entries()].sort((a, b) => b[1] - a[1]);
    return { avg, dist, top };
  }, [rows]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void load(key);
  };

  return (
    <div className="min-h-dvh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-[880px]">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em]">Feedback</h1>
        <p className="mt-1 text-[14px] text-text-tertiary">
          What people send from the app, newest first.
        </p>

        {!rows && (
          <form onSubmit={submit} className="mt-6 flex max-w-md gap-2">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Admin key"
              className="h-9 flex-1 border border-border bg-bg-secondary px-3 text-[14px] focus:border-primary/60 focus:outline-none"
              style={{ borderRadius: "12px" }}
            />
            <GlowButton type="submit" disabled={!key || loading}>
              {loading ? "Loading…" : "Open"}
            </GlowButton>
          </form>
        )}
        {error && <p className="mt-3 text-[13px] text-primary">{error}</p>}

        {rows && (
          <>
            {stats ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Stat title="Responses" value={String(rows.length)} />
                <Stat title="Average" value={`${stats.avg.toFixed(1)} / 4`}>
                  <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-bg-elevated">
                    {stats.dist.map((n, i) => (
                      <span
                        key={i}
                        title={`${RATINGS[i].label}: ${n}`}
                        className={cn(
                          i === 3
                            ? "bg-foreground"
                            : i === 2
                              ? "bg-text-tertiary"
                              : i === 1
                                ? "bg-border-strong"
                                : "bg-primary",
                        )}
                        style={{ width: `${(n / rows.length) * 100}%` }}
                      />
                    ))}
                  </div>
                </Stat>
                <Stat title="Helped most" value={stats.top[0]?.[0] ?? "—"}>
                  <p className="mt-1 truncate text-[12px] text-text-tertiary">
                    {stats.top
                      .slice(1, 4)
                      .map(([h, n]) => `${h} ${n}`)
                      .join(" · ")}
                  </p>
                </Stat>
              </div>
            ) : (
              <p className="mt-8 text-[14px] text-text-tertiary">No feedback yet.</p>
            )}

            <ul className="mt-8 space-y-3">
              {rows.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-bg-tertiary p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-text-tertiary">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[12px] font-semibold",
                        r.rating >= 3
                          ? "bg-foreground text-background"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {label(r.rating)}
                    </span>
                    <span>{new Date(r.createdAt).toLocaleString()}</span>
                    {r.role && <span>{r.role}</span>}
                    {r.user && <span className="text-foreground">{r.user.email}</span>}
                    {r.score !== null && <span>score {r.score}</span>}
                    {r.mode && <span>{r.mode === "flow" ? "flow" : "single screen"}</span>}
                  </div>
                  {r.helped.length > 0 && (
                    <p className="mt-2 text-[13px] text-muted-foreground">
                      Helped: {r.helped.join(", ")}
                    </p>
                  )}
                  {r.improve && (
                    <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed">
                      {r.improve}
                    </p>
                  )}
                  {r.idea && (
                    <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">Idea: </span>
                      {r.idea}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-tertiary p-4">
      <p className="text-[12.5px] text-text-tertiary">{title}</p>
      <p className="mt-1 truncate text-[20px] font-semibold tracking-[-0.01em]">{value}</p>
      {children}
    </div>
  );
}

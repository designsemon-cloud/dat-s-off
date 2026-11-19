import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Library,
  Compass,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogIn,
} from "lucide-react";
import { useSessions } from "@/lib/session-store";
import type { Session } from "@/lib/session-types";
import { sessionScore, sessionThumb, STATUS_LABEL } from "@/lib/session-utils";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { scoreFill } from "./AnnotatedScreenshot";
import { FEEDBACK_ICON, OPEN_FEEDBACK_EVENT } from "./FeedbackWidget";

// Left navigation for the /app shell, modeled on chat-app sidebars: New,
// Library and Samples as one list of peers (New is just the page you start
// on, selected like any other), then the session history as a chat list, with account/credits pinned to the bottom. Collapses to an icon
// rail on desktop; rendered inside a drawer on mobile (see routes/app.tsx).

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Called after any navigation — closes the mobile drawer. */
  onNavigate?: () => void;
  /** Mobile drawer always renders expanded and hides the collapse toggle. */
  mobile?: boolean;
  /**
   * The landing page's product demo: show these sessions in Recent, with
   * this one active, instead of the visitor's own.
   */
  preview?: { sessions: Session[]; activeId: string | null };
}

const NAV = [
  { to: "/app", label: "New", icon: Plus, exact: true },
  { to: "/app/library", label: "Library", icon: Library, exact: false },
  { to: "/app/samples", label: "Samples", icon: Compass, exact: false },
] as const;

export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  mobile,
  preview,
}: AppSidebarProps) {
  const { sessions: own } = useSessions();
  const sessions = preview?.sessions ?? own;
  const { user, remainingUses, openCredits, openAuth } = useAuth();
  const routeParams = useParams({ strict: false }) as { sessionId?: string };
  const params = preview ? { sessionId: preview.activeId ?? undefined } : routeParams;
  const [query, setQuery] = useState("");

  const recent = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? sessions.filter((s) => s.title.toLowerCase().includes(q)) : sessions).slice(0, 30);
  }, [sessions, query]);

  const rail = collapsed && !mobile;
  const initials = user ? (user.name || user.email).slice(0, 2).toUpperCase() : "";

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-bg-secondary transition-[width] duration-200",
        rail ? "w-[60px]" : "w-[260px]",
      )}
    >
      {/* Brand + collapse */}
      <div
        className={cn(
          "flex h-12 shrink-0 items-center",
          rail ? "justify-center" : "justify-between pl-4 pr-2",
        )}
      >
        {!rail && <Logo />}
        {!mobile && (
          <button
            onClick={onToggleCollapsed}
            aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
            title={rail ? "Expand sidebar" : "Collapse sidebar"}
            className="grid h-8 w-8 place-items-center text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground"
            style={{ borderRadius: "12px" }}
          >
            {rail ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Primary nav: New, Library, Samples. */}
      <nav className={cn("shrink-0 space-y-0.5 pb-3", rail ? "px-2.5" : "px-3")}>
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            onClick={onNavigate}
            title={to === "/app" ? "New review" : label}
            className={cn(
              "flex h-8 items-center gap-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground",
              rail ? "w-9 justify-center" : "px-2.5",
            )}
            activeProps={{ className: "bg-bg-elevated !text-foreground" }}
            style={{ borderRadius: "12px" }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!rail && label}
          </Link>
        ))}
      </nav>

      {/* History */}
      {!rail ? (
        <div className="flex min-h-0 flex-1 flex-col border-t border-border/60 pt-3">
          <div className="px-3 pb-2">
            <label
              className="flex h-8 items-center gap-2 border border-border bg-bg-tertiary/40 px-2.5 text-text-tertiary focus-within:border-border-strong"
              style={{ borderRadius: "12px" }}
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reviews"
                className="w-full bg-transparent text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none"
              />
            </label>
          </div>
          <div className="px-4 pb-1.5 text-[12px] font-medium text-text-tertiary">Recent</div>
          <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
            {recent.map((s) => {
              const score = sessionScore(s);
              const thumb = sessionThumb(s);
              const active = params.sessionId === s.id;
              const status = s.status === "done" ? null : STATUS_LABEL[s.status];
              return (
                <Link
                  key={s.id}
                  to="/app/s/$sessionId"
                  params={{ sessionId: s.id }}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-elevated",
                    active && "bg-bg-elevated",
                  )}
                >
                  <div className="h-7 w-9 shrink-0 overflow-hidden rounded border border-border bg-bg-tertiary">
                    {thumb && (
                      <img src={thumb} alt="" className="h-full w-full object-cover object-top" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "truncate text-[14px]",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {s.title}
                    </div>
                    {status && <div className="text-[12px] text-text-tertiary">{status}</div>}
                  </div>
                  {score !== null && (
                    <span className="flex shrink-0 items-center gap-1 font-mono text-[12px] text-text-tertiary">
                      <span className={cn("h-1.5 w-1.5 rounded-full", scoreFill(score))} />
                      {score}
                    </span>
                  )}
                </Link>
              );
            })}
            {recent.length === 0 && (
              <p className="px-2 py-3 text-[12px] leading-relaxed text-text-tertiary">
                {query
                  ? "No reviews match that search."
                  : "Your reviews show up here. They're saved in this browser."}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Footer — credits + settings + account */}
      <div
        className={cn(
          "shrink-0 space-y-1 border-t border-border/60 py-3",
          rail ? "px-2.5" : "px-3",
        )}
      >
        {/* Credits and sign-in live here only (not in the top bar). */}
        {rail ? (
          // Collapsed: a usage ring, the way Vercel, Cursor and Linear show a
          // quota in an icon rail. The ring empties as credits go; the count
          // sits inside. Same 36px footprint and radius as the nav items.
          <button
            onClick={openCredits}
            aria-label={`${remainingUses} credits left. Add credits`}
            title={`${remainingUses} credits left · Add credits`}
            className="mb-1 grid h-9 w-9 place-items-center text-foreground transition-colors hover:bg-bg-elevated"
            style={{ borderRadius: "12px" }}
          >
            <CreditRing value={remainingUses} max={5} />
          </button>
        ) : (
          <button
            onClick={openCredits}
            className="mb-2 w-full rounded-lg border border-border bg-bg-tertiary/40 p-2.5 text-left transition-colors hover:border-border-strong"
          >
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-medium text-foreground">{remainingUses} credits left</span>
              <span className="font-semibold text-foreground">Add credits</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${Math.min(100, (remainingUses / 5) * 100)}%` }}
              />
            </div>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event(OPEN_FEEDBACK_EVENT));
            onNavigate?.();
          }}
          title="Send feedback"
          className={cn(
            "flex h-8 items-center gap-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground",
            rail ? "w-9 justify-center" : "w-full px-2.5",
          )}
          style={{ borderRadius: "12px" }}
        >
          <FEEDBACK_ICON className="h-4 w-4 shrink-0" />
          {!rail && "Feedback"}
        </button>
        <Link
          to="/app/settings"
          onClick={onNavigate}
          title="Settings"
          className={cn(
            "flex h-8 items-center gap-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground",
            rail ? "w-9 justify-center" : "px-2.5",
          )}
          activeProps={{ className: "bg-bg-elevated !text-foreground" }}
          style={{ borderRadius: "12px" }}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!rail && "Settings"}
        </Link>
        {user ? (
          <div
            className={cn("flex h-9 items-center gap-2.5", rail ? "w-9 justify-center" : "px-2")}
            title={user.email}
          >
            {user.picture ? (
              <img
                src={user.picture}
                alt=""
                className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">
                {initials}
              </div>
            )}
            {!rail && (
              <span className="truncate text-[14px] text-muted-foreground">
                {user.name || user.email}
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={openAuth}
            title="Sign in"
            className={cn(
              "flex h-8 items-center gap-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground",
              rail ? "w-9 justify-center" : "w-full px-2.5",
            )}
            style={{ borderRadius: "12px" }}
          >
            <LogIn className="h-4 w-4 shrink-0" />
            {!rail && "Sign in to sync credits"}
          </button>
        )}
      </div>
    </aside>
  );
}

/** A 24px ring gauge with the count inside: full at `max`, empty at 0. */
function CreditRing({ value, max }: { value: number; max: number }) {
  const r = 10;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <span className="relative grid h-6 w-6 place-items-center">
      <svg viewBox="0 0 24 24" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="12" cy="12" r={r} fill="none" strokeWidth="2" className="stroke-border" />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          className={cn(
            "transition-[stroke-dashoffset] duration-500",
            value === 0 ? "stroke-primary" : "stroke-foreground",
          )}
        />
      </svg>
      <span className="text-[10.5px] font-semibold leading-none tabular-nums">
        {value > 99 ? "99+" : value}
      </span>
    </span>
  );
}

import { useParams, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useSession } from "@/lib/session-store";
import { getSample } from "@/lib/samples";
import { ThemeToggle } from "./ThemeToggle";

// Slim top bar of the /app shell: what you're looking at (session title, or
// the page name) and the theme toggle. Credits and sign-in live in the
// sidebar footer only; versions and export live in the critique panel's
// toolbar, next to the thing they act on.

const PAGE_TITLES: Record<string, string> = {
  "/app": "New review",
  "/app/library": "Library",
  "/app/samples": "Samples",
  "/app/settings": "Settings",
};

export function AppTopBar({
  onOpenMobileNav,
  preview,
}: {
  onOpenMobileNav: () => void;
  /** The landing page's product demo: which page or session to show. */
  preview?: { path: string; sessionId?: string };
}) {
  const routeParams = useParams({ strict: false }) as { sessionId?: string };
  const routePath = useRouterState({
    select: (s) => s.location.pathname.replace(/\/$/, "") || "/",
  });
  const params = preview ? { sessionId: preview.sessionId } : routeParams;
  const pathname = preview ? preview.path : routePath;
  const { session: stored } = useSession(params.sessionId ?? "");
  const session = params.sessionId ? (getSample(params.sessionId) ?? stored) : undefined;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/60 px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="grid h-8 w-8 shrink-0 place-items-center text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground lg:hidden"
          style={{ borderRadius: "12px" }}
        >
          <Menu className="h-4 w-4" />
        </button>
        {session ? (
          <>
            <h1 className="truncate text-[14px] font-medium text-foreground">{session.title}</h1>
            {session.readOnly && (
              <span className="shrink-0 rounded-md border border-border bg-bg-elevated px-1.5 py-0.5 text-[12px] font-medium text-foreground">
                Sample
              </span>
            )}
          </>
        ) : (
          <h1 className="truncate text-[14px] font-medium text-foreground">
            {PAGE_TITLES[pathname] ?? ""}
          </h1>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}

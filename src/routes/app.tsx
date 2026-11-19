import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AppSidebar } from "@/components/uxcc/AppSidebar";
import { AppTopBar } from "@/components/uxcc/AppTopBar";
import { FeedbackWidget } from "@/components/uxcc/FeedbackWidget";
import { ShellContext } from "@/lib/shell-context";

// The signed-in-feeling product shell: sidebar + top bar around every /app
// screen (see design-system/templates/app-shell-template.md).

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Dats Off. — Reviews" }] }),
  component: AppShell,
});

const COLLAPSE_KEY = "datsoff-sidebar-collapsed";

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // While a page's side panel is open the sidebar folds to its rail. The
  // toggle can still expand it for that while (not remembered).
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedOverPanel, setExpandedOverPanel] = useState(false);
  const rail = panelOpen ? !expandedOverPanel : collapsed;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // storage blocked — start expanded
    }
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => setExpandedOverPanel(false), [panelOpen]);

  const toggle = () => {
    if (panelOpen) {
      setExpandedOverPanel((e) => !e);
      return;
    }
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        // ignore
      }
      return !c;
    });
  };

  return (
    <div data-app-shell className="flex h-dvh overflow-hidden bg-background text-foreground">
      <div className="hidden lg:block">
        <AppSidebar collapsed={rail} onToggleCollapsed={toggle} />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="absolute inset-y-0 left-0"
            >
              <AppSidebar
                mobile
                collapsed={false}
                onToggleCollapsed={toggle}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1">
          <ShellContext.Provider value={{ setPanelOpen }}>
            <Outlet />
          </ShellContext.Provider>
        </main>
      </div>
      <FeedbackWidget />
    </div>
  );
}

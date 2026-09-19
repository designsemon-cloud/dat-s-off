import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { MeshBackground } from "@/components/uxcc/MeshBackground";
import { Landing } from "@/components/uxcc/Landing";
import { AnalyzingState } from "@/components/uxcc/AnalyzingState";
import { ResultsView } from "@/components/uxcc/ResultsView";
import { CreditsModal } from "@/components/uxcc/CreditsModal";
import { BuyCreditsModal } from "@/components/uxcc/BuyCreditsModal";
import { AuthModal } from "@/components/uxcc/AuthModal";
import type { RecentAnalysisItem } from "@/components/uxcc/SampleAnalysis";
import { MOCK_RESULT, TECH_STACKS, DEVICES } from "@/lib/mock-data";
import type { AnalysisResult } from "@/lib/mock-data";
import type { AuthUser } from "@/lib/auth-types";
import { analyzeUI } from "@/lib/analyze-api";
import { getRemainingUsage } from "@/lib/usage-tracker";
import { getSession, signOut, useCredit as deductCredit } from "@/server/auth";

const SESSION_KEY = "uxcc-session-token";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dats Off. — Catch UX Issues Before Your Users Do" },
      {
        name: "description",
        content:
          "Upload a UI screenshot and get a senior-designer-grade critique with prioritized fixes and framework-specific code in seconds.",
      },
      { property: "og:title", content: "Dats Off. — AI UX Critic for Developers" },
      {
        property: "og:description",
        content: "Drop a screenshot, pick your stack, get working code fixes for real UX issues.",
      },
    ],
  }),
  component: Index,
});

type AppState = "landing" | "analyzing" | "results";

function Index() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [preview, setPreview] = useState<{ name: string; dataUrl: string } | null>(null);
  const [stack, setStack] = useState<string>(TECH_STACKS[0].id);
  const [device, setDevice] = useState<string>(DEVICES[0].id);
  const [result, setResult] = useState<AnalysisResult>(MOCK_RESULT);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<"analyze" | undefined>(undefined);

  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [remainingUses, setRemainingUses] = useState(() => getRemainingUsage());

  // Recent analyses — session-only (not persisted; avoids base64 localStorage quota issues)
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysisItem[]>([]);

  // Pending analyze: set when analysis was gated by sign-in
  const pendingAnalyzeRef = useRef(false);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return;
    getSession({ data: { sessionToken: stored } })
      .then((u) => {
        if (u) {
          setUser(u);
          setSessionToken(stored);
          setRemainingUses(u.credits);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      })
      .catch(() => localStorage.removeItem(SESSION_KEY));
  }, []);

  const handleAuth = (authedUser: AuthUser, token: string) => {
    setUser(authedUser);
    setSessionToken(token);
    setRemainingUses(authedUser.credits);
    localStorage.setItem(SESSION_KEY, token);

    if (pendingAnalyzeRef.current) {
      pendingAnalyzeRef.current = false;
      // Run analysis with the freshly authenticated user
      runAnalyze(authedUser, token);
    }
  };

  const handleSignOut = async () => {
    if (sessionToken) {
      await signOut({ data: { sessionToken } }).catch(() => {});
    }
    setUser(null);
    setSessionToken(null);
    setRemainingUses(getRemainingUsage());
    localStorage.removeItem(SESSION_KEY);
  };

  const handleReset = () => {
    setAppState("landing");
    setPreview(null);
  };

  const openCredits = () => setCreditsOpen(true);

  const stackLabel = TECH_STACKS.find((s) => s.id === stack)?.label ?? stack;
  const deviceLabel = DEVICES.find((d) => d.id === device)?.label ?? device;

  // Core analysis execution — accepts explicit auth params so it can be called
  // right after sign-in without waiting for a re-render
  const runAnalyze = async (authUser: AuthUser, authToken: string) => {
    if (!preview) return;

    if (authUser.credits <= 0) {
      setBuyCreditsOpen(true);
      return;
    }

    setAppState("analyzing");

    const apiCall = analyzeUI(preview.dataUrl, stack, device)
      .then((r) => ({ ok: true as const, value: r }))
      .catch((err) => ({
        ok: false as const,
        error: err instanceof Error ? err : new Error("Analysis failed"),
      }));

    const minWait = new Promise<void>((r) => setTimeout(r, 3000));
    const [outcome] = await Promise.all([apiCall, minWait]);

    if (outcome.ok) {
      try {
        const { remainingCredits } = await deductCredit({ data: { sessionToken: authToken } });
        const updated = { ...authUser, credits: remainingCredits };
        setUser(updated);
        setRemainingUses(remainingCredits);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to deduct credit.");
        setAppState("landing");
        return;
      }

      setResult(outcome.value);

      // Track in recent analyses (most recent first, cap at 5)
      if (preview) {
        const item: RecentAnalysisItem = {
          id: crypto.randomUUID(),
          imageUrl: preview.dataUrl,
          imageName: preview.name,
          stack: stackLabel,
          device: deviceLabel,
          result: outcome.value,
          analyzedAt: new Date().toISOString(),
        };
        setRecentAnalyses((prev) => [item, ...prev].slice(0, 5));
      }

      setAppState("results");
    } else {
      toast.error(outcome.error.message);
      setAppState("landing");
    }
  };

  const handleAnalyze = () => {
    if (!preview) return;

    // Gate: must be signed in to analyze
    if (!user || !sessionToken) {
      pendingAnalyzeRef.current = true;
      setAuthIntent("analyze");
      setAuthOpen(true);
      return;
    }

    runAnalyze(user, sessionToken);
  };

  const sharedHeaderProps = {
    remainingUses,
    user,
    onAddCredits: openCredits,
    onSignIn: () => {
      setAuthIntent(undefined);
      setAuthOpen(true);
    },
    onSignOut: handleSignOut,
  };

  if (appState === "analyzing" && preview) {
    return (
      <div className="relative min-h-screen text-foreground">
        <MeshBackground />
        <AnalyzingState
          imageUrl={preview.dataUrl}
          stack={stackLabel}
          device={deviceLabel}
          {...sharedHeaderProps}
        />
        <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <MeshBackground />

      <AnimatePresence mode="sync">
        {appState === "landing" && (
          <Landing
            key="landing"
            preview={preview}
            setPreview={setPreview}
            stack={stack}
            setStack={setStack}
            device={device}
            setDevice={setDevice}
            onAnalyze={handleAnalyze}
            onViewSample={(url) => {
              setPreview({ name: "sample.png", dataUrl: url });
              setResult(MOCK_RESULT);
              setAppState("results");
            }}
            onViewRecent={(item) => {
              setPreview({ name: item.imageName, dataUrl: item.imageUrl });
              setResult(item.result);
              setAppState("results");
            }}
            recentAnalyses={user ? recentAnalyses : []}
            {...sharedHeaderProps}
          />
        )}

        {appState === "results" && preview && (
          <ResultsView
            key="results"
            imageUrl={preview.dataUrl}
            imageName={preview.name}
            stack={stackLabel}
            device={deviceLabel}
            result={result}
            onReset={handleReset}
            {...sharedHeaderProps}
          />
        )}
      </AnimatePresence>

      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
      <BuyCreditsModal isOpen={buyCreditsOpen} onClose={() => setBuyCreditsOpen(false)} />
      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setAuthIntent(undefined);
          pendingAnalyzeRef.current = false;
        }}
        onAuth={handleAuth}
        intent={authIntent}
      />
    </div>
  );
}

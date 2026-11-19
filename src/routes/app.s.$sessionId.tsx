import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ChatPane } from "@/components/uxcc/ChatPane";
import { ResultsCanvas } from "@/components/uxcc/ResultsCanvas";
import { useAuth } from "@/lib/auth-context";
import { getSample } from "@/lib/samples";
import { useSession } from "@/lib/session-store";
import { useShell } from "@/lib/shell-context";
import {
  answerQuestions,
  recoverInterrupted,
  resolveCheck,
  retry,
  sendMessage,
  startSession,
  type RunnerAuth,
} from "@/lib/session-runner";
import { cn } from "@/lib/utils";

// One critique session (see design-system/templates/session-template.md).
// By default it's just the conversation, centred like a chat. The finished
// critique is a document the chat links to: opening it docks the chat to the
// left and slides the critique panel in on the right, the way an artifact
// opens beside a Claude chat. Below lg the panel takes the whole screen.

export const Route = createFileRoute("/app/s/$sessionId")({
  component: SessionPage,
});

function SessionPage() {
  const { sessionId } = Route.useParams();
  const { loaded, session: stored } = useSession(sessionId);
  const session = getSample(sessionId) ?? stored;
  const auth = useAuth();
  const runnerAuth: RunnerAuth = {
    user: auth.user,
    sessionToken: auth.sessionToken,
    setCredits: auth.setCredits,
    openBuyCredits: auth.openBuyCredits,
  };

  const [versionIndex, setVersionIndex] = useState(0);
  const [activeFixId, setActiveFixId] = useState<string | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  // The composer's file input, shared so the critique's Re-check can open it too.
  const fileRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  const versionCount = session?.versions.length ?? 0;
  const status = session?.status;

  // Kick off a fresh session, or mark one cut off by a reload as interrupted.
  useEffect(() => {
    if (!session || session.readOnly) return;
    if (session.status === "new") void startSession(session.id, runnerAuth);
    else recoverInterrupted(session.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, loaded]);

  // Always show the newest version when one arrives.
  useEffect(() => {
    if (versionCount > 0) {
      setVersionIndex(versionCount - 1);
      setActiveFixId(null);
      setActiveScreenId(null);
    }
  }, [versionCount, sessionId]);

  // Each session opens on the conversation; the critique opens on request.
  useEffect(() => setPanelOpen(false), [sessionId]);

  // Tell the shell, so the sidebar folds to its rail while the panel is open.
  const { setPanelOpen: setShellPanel } = useShell();
  const showPanel = panelOpen && versionCount > 0;
  useEffect(() => {
    setShellPanel(showPanel);
    return () => setShellPanel(false);
  }, [showPanel, setShellPanel]);

  if (!session) {
    if (!loaded) return null;
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div>
          <p className="text-sm font-medium text-foreground">This review isn't here.</p>
          <p className="mt-1 text-[14px] text-text-tertiary">
            Reviews are saved in the browser they were made in.
          </p>
          <Link
            to="/app"
            className="mt-4 inline-block text-[14px] font-semibold text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-foreground"
          >
            Start a new review
          </Link>
        </div>
      </div>
    );
  }

  const selectIssue = (version: number, fixId: string) => {
    setVersionIndex(version);
    setActiveFixId(fixId);
    const v = session.versions[version];
    if (v?.mode === "flow") {
      const anchor = v.result.findings.find((f) => f.id === fixId)?.anchorScreenIds[0];
      if (anchor) setActiveScreenId(anchor);
    }
    setPanelOpen(true);
  };

  const openCritique = (version: number) => {
    setVersionIndex(version);
    setActiveFixId(null);
    setPanelOpen(true);
  };

  return (
    <div className="flex h-full min-h-0">
      <section
        className={cn(
          "min-h-0 min-w-0",
          showPanel
            ? "hidden border-r border-border/60 lg:block lg:w-[380px] lg:shrink-0 xl:w-[420px]"
            : "flex-1",
        )}
      >
        <ChatPane
          session={session}
          openVersion={showPanel ? versionIndex : null}
          onOpenCritique={(v) => openCritique(v)}
          onAnswer={(mid, answers) => void answerQuestions(session.id, mid, answers, runnerAuth)}
          onSkip={(mid) => void answerQuestions(session.id, mid, null, runnerAuth)}
          onRetry={() => retry(session.id, runnerAuth)}
          onSend={(text, attachments) =>
            void sendMessage(session.id, text, attachments, runnerAuth)
          }
          onSelectIssue={selectIssue}
          onCloseCritique={() => setPanelOpen(false)}
          onCheck={(mid, choice) => void resolveCheck(session.id, mid, choice, runnerAuth)}
          fileRef={fileRef}
        />
      </section>
      {showPanel && (
        <motion.section
          key="critique-panel"
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          aria-label="What's off"
          className="min-h-0 min-w-0 flex-1 bg-bg-secondary/40"
        >
          <ResultsCanvas
            session={session}
            versionIndex={Math.min(versionIndex, Math.max(0, versionCount - 1))}
            onVersionChange={(i) => {
              setVersionIndex(i);
              setActiveFixId(null);
            }}
            activeFixId={activeFixId}
            onActiveFixChange={setActiveFixId}
            activeScreenId={activeScreenId}
            onActiveScreenChange={setActiveScreenId}
            onClose={() => setPanelOpen(false)}
            onRecheck={
              !session.readOnly && session.status === "done"
                ? () => {
                    // Open the picker first (it needs the click), then go back to the chat,
                    // where the screenshot lands in the composer.
                    fileRef.current?.click();
                    setPanelOpen(false);
                  }
                : undefined
            }
          />
        </motion.section>
      )}
    </div>
  );
}

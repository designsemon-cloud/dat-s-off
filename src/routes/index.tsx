import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { MeshBackground } from "@/components/uxcc/MeshBackground";
import { Landing } from "@/components/uxcc/Landing";
import { AnalyzingState } from "@/components/uxcc/AnalyzingState";
import { ResultsView } from "@/components/uxcc/ResultsView";
import { MOCK_RESULT, TECH_STACKS, DEVICES } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UXCC — Ship Better UX Without a Designer" },
      {
        name: "description",
        content:
          "Upload a UI screenshot and get prioritized UX fixes with framework-specific code in 30 seconds. AI-powered UX critic for developers.",
      },
      { property: "og:title", content: "UXCC — AI UX Critic for Developers" },
      {
        property: "og:description",
        content:
          "Drop a screenshot, pick your stack, get working code fixes for real UX issues.",
      },
    ],
  }),
  component: Index,
});

type AppState = "landing" | "analyzing" | "results";

function Index() {
  const [state, setState] = useState<AppState>("landing");
  const [preview, setPreview] = useState<{ name: string; dataUrl: string } | null>(null);
  const [stack, setStack] = useState<string>(TECH_STACKS[0].id);
  const [device, setDevice] = useState<string>(DEVICES[0].id);

  const handleAnalyze = () => {
    setState("analyzing");
    setTimeout(() => setState("results"), 3200);
  };

  const handleViewSample = (imageDataUrl: string) => {
    setPreview({ name: "sample-analysis.svg", dataUrl: imageDataUrl });
    setState("results");
  };

  const handleReset = () => {
    setState("landing");
    setPreview(null);
  };

  const stackLabel = TECH_STACKS.find((s) => s.id === stack)?.label ?? stack;
  const deviceLabel = DEVICES.find((d) => d.id === device)?.label ?? device;

  return (
    <div className="relative min-h-screen text-foreground">
      <MeshBackground />

      <AnimatePresence mode="popLayout">
        {state === "landing" && (
          <Landing
            key="landing"
            preview={preview}
            setPreview={setPreview}
            stack={stack}
            setStack={setStack}
            device={device}
            setDevice={setDevice}
            onAnalyze={handleAnalyze}
            onViewSample={handleViewSample}
          />
        )}

        {state === "analyzing" && preview && (
          <AnalyzingState key="analyzing" imageUrl={preview.dataUrl} stack={stackLabel} device={deviceLabel} />
        )}

        {state === "results" && preview && (
          <ResultsView
            key="results"
            imageUrl={preview.dataUrl}
            imageName={preview.name}
            stack={stackLabel}
            device={deviceLabel}
            result={MOCK_RESULT}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

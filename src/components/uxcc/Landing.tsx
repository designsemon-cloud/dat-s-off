import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, Code2, Smartphone } from "lucide-react";

import { Header } from "@/components/uxcc/Header";
import { GlowButton } from "@/components/uxcc/GlowButton";
import { UploadZone } from "@/components/uxcc/UploadZone";
import { ConfigPanel } from "@/components/uxcc/ConfigPanel";
import { SampleAnalysis } from "@/components/uxcc/SampleAnalysis";
import type { RecentAnalysisItem } from "@/components/uxcc/SampleAnalysis";
import type { AuthUser } from "@/lib/auth-types";

interface LandingProps {
  preview: { name: string; dataUrl: string } | null;
  setPreview: (p: { name: string; dataUrl: string } | null) => void;
  stack: string;
  setStack: (s: string) => void;
  device: string;
  setDevice: (d: string) => void;
  onAnalyze: () => void;
  onViewSample: (imageDataUrl: string) => void;
  onAddCredits: () => void;
  remainingUses: number;
  user: AuthUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  recentAnalyses?: RecentAnalysisItem[];
  onViewRecent?: (item: RecentAnalysisItem) => void;
}

export function Landing({
  preview,
  setPreview,
  stack,
  setStack,
  device,
  setDevice,
  onAnalyze,
  onViewSample,
  onAddCredits,
  remainingUses,
  user,
  onSignIn,
  onSignOut,
  recentAnalyses,
  onViewRecent,
}: LandingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="relative flex min-h-screen flex-col"
    >
      <Header
        remainingUses={remainingUses}
        user={user}
        onAddCredits={onAddCredits}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />

      {/* Hero + tool */}
      <main className="flex flex-1 items-center justify-center px-6 py-6">
        <div
          className={`w-full transition-[max-width] duration-500 ${preview ? "max-w-5xl" : "max-w-xl"}`}
        >
          {/* Tag — hidden when configuring */}
          {!preview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="mx-auto mb-4 inline-flex w-full justify-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-tertiary/60 px-3 py-1 text-[12px] font-medium text-muted-foreground">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                That doesn&rsquo;t look right—and here&rsquo;s why.
                <ArrowRight className="h-3 w-3 text-text-tertiary" />
              </span>
            </motion.div>
          )}

          {/* Heading — switches when image is uploaded */}
          {!preview ? (
            <>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-center text-[34px] font-medium leading-[1.1] tracking-tight text-foreground sm:text-[40px]"
                style={{ letterSpacing: "-0.02em" }}
              >
                Catch UX issues <span className="text-primary">before your users do</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="mx-auto mt-3 max-w-md text-center text-[14px] leading-relaxed text-muted-foreground"
              >
                Upload a screen, get a senior-designer-grade critique with prioritized fixes and
                code that drops straight into your stack.
              </motion.p>
            </>
          ) : (
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-1"
            >
              <h2
                className="text-[28px] font-medium leading-tight text-foreground"
                style={{ letterSpacing: "-0.02em" }}
              >
                Configure Your <span className="text-primary">Analysis</span>
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Select your tech stack and target device for precise, framework-specific code fixes
              </p>
            </motion.div>
          )}

          {/* Upload + Config (horizontal split when preview exists) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={`mt-6 grid gap-4 ${preview ? "lg:grid-cols-2" : "grid-cols-1"}`}
          >
            <UploadZone
              preview={preview}
              onFile={(file, dataUrl) => setPreview({ name: file.name, dataUrl })}
              onClear={() => setPreview(null)}
            />

            <AnimatePresence>
              {preview && (
                <motion.div
                  key="config"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur"
                >
                  <ConfigPanel
                    stack={stack}
                    device={device}
                    onStackChange={setStack}
                    onDeviceChange={setDevice}
                  />
                  <div className="mt-4">
                    <GlowButton size="md" onClick={onAnalyze} className="w-full">
                      Analyze UX
                      <ArrowRight className="h-3.5 w-3.5" />
                    </GlowButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Trust line */}
          {!preview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-text-tertiary" />
                Honest visual analysis
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-text-tertiary" />
                Production-ready code
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-text-tertiary" />
                Tuned to your stack
              </span>
            </motion.div>
          )}
        </div>
      </main>

      {/* Sample analysis — only on screen 1, pinned to bottom */}
      {!preview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="flex-none mt-4 pb-10"
        >
          <SampleAnalysis
            onViewSample={onViewSample}
            recentAnalyses={recentAnalyses}
            onViewRecent={onViewRecent}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

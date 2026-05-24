import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, Code2, Smartphone, Wallet, Plus } from "lucide-react";
import { Logo } from "@/components/uxcc/Logo";
import { GlowButton } from "@/components/uxcc/GlowButton";
import { UploadZone } from "@/components/uxcc/UploadZone";
import { ConfigPanel } from "@/components/uxcc/ConfigPanel";
import { SampleAnalysis } from "@/components/uxcc/SampleAnalysis";

interface LandingProps {
  preview: { name: string; dataUrl: string } | null;
  setPreview: (p: { name: string; dataUrl: string } | null) => void;
  stack: string;
  setStack: (s: string) => void;
  device: string;
  setDevice: (d: string) => void;
  onAnalyze: () => void;
  onViewSample: (imageDataUrl: string) => void;
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
}: LandingProps) {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      {/* Top nav */}
      <header className="flex-none px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground">
              <Wallet
                className="h-3.5 w-3.5"
                style={{ color: "oklch(0.85 0.14 150)" }}
              />
              5 free credits
            </span>
            <button
              className="inline-flex h-8 items-center gap-1.5 border border-border bg-bg-tertiary/60 px-3 text-[13px] font-medium text-foreground hover:bg-bg-elevated transition-colors"
              style={{ borderRadius: "4px" }}
            >
              <Plus className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
              Add credits
            </button>
          </div>
        </div>
      </header>

      {/* Hero — flex-1 centers it vertically in remaining space */}
      <main className="flex min-h-0 flex-1 items-center justify-center px-6 py-4">
        <div className={`w-full transition-[max-width] duration-500 ${preview ? "max-w-5xl" : "max-w-xl"}`}>
          {/* Tag — Screen 1 only */}
          {!preview && (
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
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

          {/* Heading */}
          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.03 }}
            className="text-center text-[34px] font-medium leading-[1.1] tracking-tight text-foreground sm:text-[40px]"
            style={{ letterSpacing: "-0.02em" }}
          >
            {preview ? (
              <>Configure{" "}<span className="text-primary">Your Analysis</span></>
            ) : (
              <>Catch UX issues{" "}<span className="text-primary">before your users do</span></>
            )}
          </motion.h1>

          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.06 }}
            className="mx-auto mt-3 max-w-md text-center text-[14px] leading-relaxed text-muted-foreground"
          >
            {preview
              ? "Select your tech stack and target device for precise, framework-specific code fixes"
              : "Upload a screen, get a senior-designer-grade critique with prioritized fixes and code that drops straight into your stack."}
          </motion.p>

          {/* Upload + Config */}
          <motion.div
            layout
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.09 }}
            className={`mt-7 grid gap-4 ${preview ? "lg:grid-cols-2" : "grid-cols-1"}`}
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
                  transition={{ duration: 0.15 }}
                  className="flex h-full flex-col rounded-xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur"
                >
                  <div className="flex-1">
                    <ConfigPanel
                      stack={stack}
                      device={device}
                      onStackChange={setStack}
                      onDeviceChange={setDevice}
                    />
                  </div>
                  <div className="mt-4 flex justify-start">
                    <GlowButton size="md" onClick={onAnalyze} className="w-full sm:w-auto">
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
              transition={{ duration: 0.2, delay: 0.12 }}
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
          className="flex-none pb-6 -mt-2"
        >
          <SampleAnalysis onViewSample={onViewSample} />
        </motion.div>
      )}
    </div>
  );
}

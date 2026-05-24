import { Wallet, Plus } from "lucide-react";
import { Logo } from "./Logo";

interface AppHeaderProps {
  onNewAnalysis?: () => void;
  credits?: number;
}

export function AppHeader({ onNewAnalysis, credits = 5 }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 px-6 py-4 border-b border-border/40 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          {onNewAnalysis && (
            <>
              <button
                onClick={onNewAnalysis}
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                New Analysis
              </button>
              <span className="text-text-tertiary select-none">|</span>
            </>
          )}
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground">
            <Wallet
              className="h-3.5 w-3.5"
              style={{ color: "oklch(0.85 0.14 150)" }}
            />
            {credits} free credits
          </span>
          <button
            className="inline-flex h-8 items-center gap-1.5 border border-border bg-bg-tertiary/60 px-3 text-[13px] font-medium text-foreground hover:bg-bg-elevated transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            style={{ borderRadius: "4px" }}
          >
            <Plus className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
            Add credits
          </button>
        </div>
      </div>
    </header>
  );
}

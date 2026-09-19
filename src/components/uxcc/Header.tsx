import { Wallet, Plus, RotateCcw } from "lucide-react";
import { Logo } from "./Logo";
import type { AuthUser } from "@/lib/auth-types";

interface HeaderProps {
  remainingUses: number;
  user: AuthUser | null;
  onAddCredits: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  showNewAnalysis?: boolean;
  onNewAnalysis?: () => void;
}

export function Header({
  remainingUses,
  user,
  onAddCredits,
  onSignIn,
  onSignOut,
  showNewAnalysis,
  onNewAnalysis,
}: HeaderProps) {
  const initials = user ? (user.name || user.email).slice(0, 2).toUpperCase() : "";

  return (
    <header className="px-6 py-4 border-b border-border/40">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          {showNewAnalysis && onNewAnalysis && (
            <>
              <button
                onClick={onNewAnalysis}
                className="inline-flex h-8 items-center gap-1.5 border border-border bg-bg-tertiary/60 px-3 text-[13px] font-medium text-foreground hover:bg-bg-elevated transition-colors"
                style={{ borderRadius: "4px" }}
              >
                <RotateCcw className="h-3.5 w-3.5 text-primary" />
                New Analysis
              </button>
              <span className="text-text-tertiary text-sm select-none">|</span>
            </>
          )}

          {/* Credits — no brackets, grey wallet icon */}
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground">
            <Wallet className="h-3.5 w-3.5 text-text-tertiary" />
            {remainingUses} credits left
          </span>

          <button
            onClick={onAddCredits}
            className="inline-flex h-8 items-center gap-1.5 border border-border bg-bg-tertiary/60 px-3 text-[13px] font-medium text-foreground hover:bg-bg-elevated transition-colors"
            style={{ borderRadius: "4px" }}
          >
            <Plus className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
            Add credits
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground select-none"
                  title={user.name || user.email}
                >
                  {initials}
                </div>
              )}
            </div>
          ) : (
            /* No icon — just text */
            <button
              onClick={onSignIn}
              className="inline-flex h-8 items-center bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{ borderRadius: "4px" }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

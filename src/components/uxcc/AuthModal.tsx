import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowButton } from "./GlowButton";
import { signIn, signUp, signInWithGoogle } from "@/server/auth";
import type { AuthUser } from "@/lib/auth-types";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (r: { credential: string }) => void;
          }): void;
          renderButton(el: HTMLElement, config: object): void;
        };
      };
    };
  }
}

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuth: (user: AuthUser, sessionToken: string) => void;
  /** When "analyze": shows a contextual prompt above the form */
  intent?: "analyze";
}

type Tab = "signin" | "signup";

export function AuthModal({ open, onClose, onAuth, intent }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const googleClientId = (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
  }, [tab, open]);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!open || !googleClientId) return;

    const init = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setLoading(true);
          setError(null);
          try {
            const result = await signInWithGoogle({ data: { credential } });
            onAuth(result.user, result.sessionToken);
            onClose();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Google sign-in failed.");
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        width: 340,
        shape: "rectangular",
      });
    };

    if (window.google?.accounts?.id) {
      init();
    } else if (!document.getElementById("gsi-script")) {
      const script = document.createElement("script");
      script.id = "gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }
  }, [open, googleClientId, tab]);

  const handleSignIn = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signIn({ data: { email, password } });
      onAuth(result.user, result.sessionToken);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signUp({ data: { email, password, name } });
      onAuth(result.user, result.sessionToken);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop — same as BuyCreditsModal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-[400px] rounded-2xl border border-border bg-bg-tertiary p-6 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close — same style as BuyCreditsModal */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-md border border-border bg-bg-secondary hover:bg-bg-elevated transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {/* Header — Dat's Off branding */}
            <div className="mb-5 pr-8">
              <h2 className="text-base font-semibold text-foreground">
                Welcome to Dat's <span className="text-primary">Off.</span>
              </h2>
              <p className="mt-0.5 text-[13px] text-text-tertiary leading-relaxed">
                Sign in to catch UX issues before your users do.
              </p>
            </div>

            {/* Contextual banner when opened from Analyze */}
            {intent === "analyze" && (
              <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5">
                <p className="text-[12px] font-medium text-primary text-center">
                  Sign in to start analyzing your UI!
                </p>
              </div>
            )}

            {/* Tab switcher */}
            <div className="flex rounded-lg border border-border bg-bg-secondary/60 p-1 mb-4">
              {(["signin", "signup"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-md py-1.5 text-[13px] font-medium transition-colors ${
                    tab === t
                      ? "bg-bg-elevated text-foreground"
                      : "text-text-tertiary hover:text-foreground"
                  }`}
                >
                  {t === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Sign In form */}
            {tab === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-bg-secondary border-border text-foreground placeholder:text-text-tertiary/50 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
                    Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-bg-secondary border-border text-foreground placeholder:text-text-tertiary/50 focus:border-primary"
                  />
                </div>
                {error && <p className="text-[12px] text-red-400">{error}</p>}
                <GlowButton
                  type="submit"
                  size="lg"
                  className="w-full justify-center"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign In"}
                </GlowButton>
              </form>
            )}

            {/* Sign Up form */}
            {tab === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
                    Name
                  </Label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-bg-secondary border-border text-foreground placeholder:text-text-tertiary/50 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-bg-secondary border-border text-foreground placeholder:text-text-tertiary/50 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
                    Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                    className="bg-bg-secondary border-border text-foreground placeholder:text-text-tertiary/50 focus:border-primary"
                  />
                </div>
                <p className="text-[11px] text-text-tertiary">
                  You'll start with{" "}
                  <span className="text-primary font-medium">5 free analyses</span> tied to your
                  account.
                </p>
                {error && <p className="text-[12px] text-red-400">{error}</p>}
                <GlowButton
                  type="submit"
                  size="lg"
                  className="w-full justify-center"
                  disabled={loading}
                >
                  {loading ? "Creating account…" : "Create Account"}
                </GlowButton>
              </form>
            )}

            {/* Google OAuth — only shown when client ID is configured */}
            {googleClientId && (
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-text-tertiary">or continue with</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div ref={googleButtonRef} className="flex justify-center" />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

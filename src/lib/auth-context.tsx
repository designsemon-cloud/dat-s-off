import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthModal } from "@/components/uxcc/AuthModal";
import { BuyCreditsModal } from "@/components/uxcc/BuyCreditsModal";
import { CreditsModal } from "@/components/uxcc/CreditsModal";
import { getSession, signOut as serverSignOut } from "@/server/auth";
import type { AuthUser } from "./auth-types";
import { getRemainingUsage } from "./usage-tracker";

// App-wide auth + credits state and the three account modals. Lifted out of
// the old single-page index route so the landing page and every /app screen
// share one session restore, one credits count, and one set of modals.

const SESSION_KEY = "uxcc-session-token";

interface AuthContextValue {
  user: AuthUser | null;
  sessionToken: string | null;
  /** Credits for a signed-in user, else the anonymous free-use count. */
  remainingUses: number;
  setCredits: (credits: number) => void;
  openAuth: () => void;
  openCredits: () => void;
  openBuyCredits: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  // getRemainingUsage reads localStorage, so start at the server-safe value
  // and sync after mount to avoid a hydration mismatch.
  const [remainingUses, setRemainingUses] = useState(5);
  const [authOpen, setAuthOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  useEffect(() => {
    setRemainingUses(getRemainingUsage());
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
  };

  const signOut = useCallback(async () => {
    if (sessionToken) {
      await serverSignOut({ data: { sessionToken } }).catch(() => {});
    }
    setUser(null);
    setSessionToken(null);
    setRemainingUses(getRemainingUsage());
    localStorage.removeItem(SESSION_KEY);
  }, [sessionToken]);

  const setCredits = useCallback((credits: number) => {
    setRemainingUses(credits);
    setUser((u) => (u ? { ...u, credits } : u));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      sessionToken,
      remainingUses,
      setCredits,
      openAuth: () => setAuthOpen(true),
      openCredits: () => setCreditsOpen(true),
      openBuyCredits: () => setBuyOpen(true),
      signOut,
    }),
    [user, sessionToken, remainingUses, setCredits, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
      <BuyCreditsModal isOpen={buyOpen} onClose={() => setBuyOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuth={handleAuth} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

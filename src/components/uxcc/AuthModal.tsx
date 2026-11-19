import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Mail, UserRound } from "lucide-react";
import { GlowButton } from "./GlowButton";
import {
  AccountDialog,
  Chip,
  FormNotice,
  GoogleButton,
  OrDivider,
  Segmented,
  TextField,
} from "./AccountKit";
import { signIn, signUp } from "@/server/auth";
import { useGoogleSignIn } from "@/lib/google-auth";
import type { AuthUser } from "@/lib/auth-types";
import { Reveal } from "@/lib/reveal";

// Sign in / create account. Google comes first: one click, no password to
// remember, and the session then lasts 30 days. Email and password stay as
// the fallback. Built on AccountKit (organisms/modal-shell.md).

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuth: (user: AuthUser, sessionToken: string) => void;
  /** When "analyze": says why we're asking. */
  intent?: "analyze";
}

type Tab = "signin" | "signup";

const TABS: { value: Tab; label: string }[] = [
  { value: "signin", label: "Sign in" },
  { value: "signup", label: "Create account" },
];

export function AuthModal({ open, onClose, onAuth, intent }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = (user: AuthUser, token: string) => {
    onAuth(user, token);
    onClose();
  };
  const google = useGoogleSignIn({ enabled: open, onSuccess: done, onError: setError });

  // Fresh form on open; keep the email when switching tabs.
  useEffect(() => {
    if (open) {
      setName("");
      setPassword("");
      setError(null);
    }
  }, [open]);
  useEffect(() => setError(null), [tab]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r =
        tab === "signin"
          ? await signIn({ data: { email, password } })
          : await signUp({ data: { email, password, name } });
      done(r.user, r.sessionToken);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tab === "signin"
            ? "Sign in failed."
            : "Sign up failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const signup = tab === "signup";
  const busy = loading || google.busy;

  return (
    <AccountDialog
      open={open}
      onClose={onClose}
      title={signup ? "Create your account" : "Welcome back"}
      description={
        intent === "analyze"
          ? "Sign in to run the review. It takes a few seconds."
          : signup
            ? "Catch UX issues before your users do."
            : "Sign in to pick up your reviews and credits."
      }
    >
      <Segmented label="Account" items={TABS} value={tab} onChange={setTab} className="mt-5" />

      {/* Google first: the quickest way in. */}
      {google.status !== "off" ? (
        <div className="mt-5 space-y-5">
          <GoogleButton
            onClick={google.start}
            loading={google.busy}
            disabled={google.status !== "ready" || loading}
          />
          <OrDivider>or with email</OrDivider>
        </div>
      ) : (
        import.meta.env.DEV && (
          <p className="mt-4 text-[12px] leading-relaxed text-text-tertiary">
            Google sign-in is off: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.
          </p>
        )
      )}

      <form onSubmit={submit} className="mt-5 space-y-3.5">
        <AnimatePresence initial={false}>
          {signup && (
            <Reveal key="name" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
              <TextField
                label="Name"
                icon={<UserRound />}
                placeholder="Your name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={busy}
              />
            </Reveal>
          )}
        </AnimatePresence>
        <TextField
          label="Email"
          type="email"
          icon={<Mail />}
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
        />
        <TextField
          label="Password"
          type="password"
          icon={<Lock />}
          hint={signup ? "At least 8 characters" : undefined}
          placeholder={signup ? "Create a password" : "Your password"}
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={signup ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={busy}
        />

        {error && <FormNotice>{error}</FormNotice>}

        <GlowButton
          type="submit"
          size="lg"
          className="mt-1.5 w-full justify-center"
          disabled={busy}
        >
          {loading
            ? signup
              ? "Creating account…"
              : "Signing in…"
            : signup
              ? "Create account"
              : "Sign in"}
        </GlowButton>
      </form>

      <div className="mt-5 flex items-center justify-center gap-2 text-[12.5px] text-text-tertiary">
        {signup ? (
          <>
            <Chip dot>5 free reviews</Chip>
            <span>with every new account</span>
          </>
        ) : (
          <span>You stay signed in on this device for 30 days.</span>
        )}
      </div>
    </AccountDialog>
  );
}

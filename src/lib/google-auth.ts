import { useCallback, useEffect, useRef, useState } from "react";
import { getGoogleAuthConfig, signInWithGoogle } from "@/server/auth";
import type { AuthUser } from "./auth-types";

// "Continue with Google" with Google Identity Services' authorization-code
// popup (initCodeClient, ux_mode "popup"). The browser gets a one-time code;
// the server (signInWithGoogle) swaps it for an ID token with the client
// secret and checks it. Our own button stays on-design, and no redirect
// route is needed. Setup lives in .env.local / patterns/credit-and-auth-gating.md.

type CodeResponse = { code?: string; error?: string };
type CodeClient = { requestCode(): void };

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient(config: {
            client_id: string;
            scope: string;
            ux_mode: "popup";
            select_account?: boolean;
            callback: (r: CodeResponse) => void;
            error_callback?: (e: { type: string }) => void;
          }): CodeClient;
        };
      };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
let configPromise: Promise<string | null> | null = null;
let scriptPromise: Promise<void> | null = null;

function loadConfig() {
  configPromise ??= getGoogleAuthConfig()
    .then((c) => c.clientId)
    .catch(() => {
      configPromise = null; // try again next time
      return null;
    });
  return configPromise;
}

function loadScript() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Couldn't reach Google. Check your connection."));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * `status`: "checking" until we know; "off" when the server has no Google
 * credentials; "ready" once the popup can open on a click.
 */
export function useGoogleSignIn({
  enabled,
  onSuccess,
  onError,
}: {
  /** Load only while the modal is open. */
  enabled: boolean;
  onSuccess: (user: AuthUser, sessionToken: string) => void;
  onError: (message: string) => void;
}) {
  const [status, setStatus] = useState<"checking" | "off" | "ready">("checking");
  const [busy, setBusy] = useState(false);
  const client = useRef<CodeClient | null>(null);
  // Latest callbacks without re-initialising the client.
  const handlers = useRef({ onSuccess, onError });
  handlers.current = { onSuccess, onError };

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    (async () => {
      const clientId = await loadConfig();
      if (!live) return;
      if (!clientId) return setStatus("off");
      try {
        await loadScript();
      } catch (e) {
        if (live) setStatus("off");
        handlers.current.onError((e as Error).message);
        return;
      }
      if (!live || !window.google) return;
      client.current = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: "openid email profile",
        ux_mode: "popup",
        select_account: true,
        callback: async ({ code, error }) => {
          if (!code) {
            setBusy(false);
            if (error && error !== "access_denied")
              handlers.current.onError("Google sign-in failed. Please try again.");
            return;
          }
          try {
            const r = await signInWithGoogle({ data: { code } });
            handlers.current.onSuccess(r.user, r.sessionToken);
          } catch (e) {
            handlers.current.onError(
              e instanceof Error ? e.message : "Google sign-in failed. Please try again.",
            );
          } finally {
            setBusy(false);
          }
        },
        // The person closed the popup, or the browser blocked it.
        error_callback: (e) => {
          setBusy(false);
          if (e.type === "popup_failed_to_open")
            handlers.current.onError(
              "Your browser blocked the Google popup. Allow popups and try again.",
            );
        },
      });
      setStatus("ready");
    })();
    return () => {
      live = false;
    };
  }, [enabled]);

  // Must run straight from the click, or the popup gets blocked.
  const start = useCallback(() => {
    if (!client.current) return;
    setBusy(true);
    client.current.requestCode();
  }, []);

  return { status, busy, start };
}

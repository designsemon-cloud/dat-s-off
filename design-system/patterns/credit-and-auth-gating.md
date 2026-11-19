# Pattern → Credit & Auth Gating

**Where it lives**: [`src/routes/index.tsx`](../../src/routes/index.tsx) + [`src/server/auth.ts`](../../src/server/auth.ts). Every "run an analysis" action passes through the same two gates, in the same order, before any API call happens.

## The two gates, in order

1. **Auth gate** (`handleAnalyze`/`handleAnalyzeFlow`): if no `user`/`sessionToken`, set `pendingAnalyzeRef.current = true`, open `AuthModal` with `intent="analyze"`, and stop — the actual analysis call happens later, from `handleAuth`, once sign-in succeeds.
2. **Credit gate** (`runAnalyze`/`runAnalyzeFlow`, now guaranteed to have a real user): if `user.credits < cost`, open `BuyCreditsModal` and stop.

Only after both gates pass does `appState` flip to `"analyzing"` and the real API call fire.

## Credit deduction is success-gated, not request-gated

```ts
const { remainingCredits } = await deductCredit({ data: { sessionToken, cost } });
```

`useCredit` is called **after** the analysis API call has already succeeded (schema-valid response in hand) — never before, and never if the call fails or fails validation. This is why [`server/analyze-flow.ts`](../../src/server/analyze-flow.ts) throws instead of returning a partial/best-effort result on a second failed retry: a thrown error is what keeps the credit un-charged. **Any new billable action must follow this same success-gated order — determine cost via a shared constant (`src/lib/pricing.ts`), call `deductCredit` only after the paid-for work has verifiably succeeded, never optimistically.**

## Cost is a parameter, not a hardcoded decrement

`useCredit`'s `cost` parameter defaults to `1` (so the pre-existing single-screen call site needed no changes when this was added) — a new billable feature passes its own cost explicitly (`FLOW_ANALYSIS_COST` from `src/lib/pricing.ts`), it does not add a new server function. **Rule: a new billable action extends `useCredit`'s existing `cost` parameter via a new named constant in `pricing.ts` — it does not fork a parallel credit-deduction function.**

## Signing in: Google first

The sign-in modal offers **Continue with Google** above the email form, on both tabs. One click, no password, and like every session it lasts 30 days on that device (`SESSION_TTL`), so people aren't asked again.

How it works (Nov 2026):

1. When the modal opens, [`useGoogleSignIn`](../../src/lib/google-auth.ts) asks the server for the public client ID (`getGoogleAuthConfig`). With none, the button is hidden; in dev a one-line note says which env vars to set.
2. It loads Google Identity Services and prepares an **authorization-code client in popup mode** (`initCodeClient`, `ux_mode: "popup"`, scope `openid email profile`). Our own button stays on-design, and no redirect route is needed. `requestCode()` runs straight from the click so the popup isn't blocked.
3. The popup returns a one-time **code**, never a token. `signInWithGoogle` in [`server/auth.ts`](../../src/server/auth.ts) swaps it at `oauth2.googleapis.com/token` with the client secret (`redirect_uri: "postmessage"`). The ID token comes back from Google directly over TLS, and the server checks `iss`, `aud` (our client ID), `exp` and `email_verified` before trusting it (OpenID Connect Core §3.1.3.7).
4. It finds the user by Google `sub`, else by email. An email/password account with the same verified address is linked, not duplicated, and a new user gets the usual 5 free credits. Then it's a normal session token.

The old flow decoded a Google ID token in the browser's hands without checking it, so anyone could forge a sign-in; it's gone.

**Setup** (once per environment):

1. Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → **Web application**. (First time: set up the OAuth consent screen, with the app name, support email and the `email`/`profile` scopes.)
2. **Authorized JavaScript origins**: `http://localhost:8080` and the production URL. No redirect URIs.
3. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`, and in the host's env vars (Vercel: Project → Settings → Environment Variables). Restart the dev server.

# Pattern → Session Lifecycle

**Replaces [`app-state-machine.md`](app-state-machine.md).** Code: [`lib/session-runner.ts`](../../src/lib/session-runner.ts), types in [`lib/session-types.ts`](../../src/lib/session-types.ts), storage in [`lib/session-store.ts`](../../src/lib/session-store.ts).

```
composer submit ──► createSession (status "new", prompt message) ──► navigate /app/s/$id
  └► startSession: triage (gpt-4o-mini, low-detail images)
       ├─ questions? ──► "awaiting-answers" ──► answer / skip ──┐
       └─ none ─────────────────────────────────────────────────┴► runAnalysis
runAnalysis: credit check → analyze (gpt-4o) → deduct (signed-in only) → version + result message → "done"
done ──► text follow-up (free, gpt-4o-mini) ──► "replying" → text message → "done"
     └─► new screenshot ──► runAnalysis again (new version)
failure ──► error message, "error" (Retry)   reload mid-run ──► "interrupted" (Retry)
```

- Every step is written to the store as chat messages; the page only renders what's stored.
- Triage context (product/user/task) + answers become the analysis's `AnalysisContext` and `notes` (flow: folded into `flowGoal`). Triage failure never blocks — it just means no questions.
- An in-memory `inFlight` set prevents double runs (StrictMode, double clicks) and lets a page tell a live run from one a reload cut off.
- Credits follow [`credit-and-auth-gating.md`](credit-and-auth-gating.md) unchanged: check first, deduct only after success, and (TEMP on this branch) no deduction without a signed-in user.
- Sessions are **IndexedDB, this browser only** (screenshots are too big for localStorage). No server copy, so no sharing across devices yet. Samples are read-only in-code sessions, never persisted.

# Pattern → App State Machine

> **Superseded.** `/` is now a marketing page and critiques run as sessions under `/app`. See [`session-lifecycle.md`](session-lifecycle.md). Kept as a record.

**Where it lives**: [`src/routes/index.tsx`](../../src/routes/index.tsx). The entire app is one file-based route (`/`) with a local `appState: "landing" | "analyzing" | "results"` state machine — there is no per-screen sub-route, even for Flow Analysis (a deliberate decision — see the Flow Analysis PRD's "route structure" question).

## Shape

```ts
type AppState = "landing" | "analyzing" | "results";
const [appState, setAppState] = useState<AppState>("landing");
const [mode, setMode] = useState<"single" | "flow">("single");
```

`mode` is orthogonal to `appState` — it's set once (via the [`templates/landing-template.md`](../templates/landing-template.md) toggle) and read at every `appState` branch to pick which template/organism renders:

```tsx
if (appState === "analyzing" && mode === "flow" && flowScreens.length > 0) return <FlowAnalyzingState .../>;
if (appState === "analyzing" && preview) return <AnalyzingState .../>;
// landing / results below, also mode-branched
```

## Rules for adding a third mode or a third app state

- **A third analysis mode** (e.g. a future Figma-import mode) adds a third `mode` value and a third branch at each `appState` checkpoint — it does **not** get its own `appState` value. `appState` describes _where in the flow_ the user is (landing/analyzing/results), `mode` describes _what kind_ of analysis they're doing; keep these two axes independent, don't collapse them into a combined enum like `"flow-analyzing"`.
- **A genuinely new app-level phase** (not a variant of an existing one) is the only thing that should add a new `appState` value.
- `runAnalyze`/`runAnalyzeFlow` are separate functions (not one parameterized function) because their side effects genuinely differ (different API call, different credit cost, different minimum-wait formula) — but they share the exact same **shape**: gate on credits → set `appState = "analyzing"` → race the API call against a minimum wait → deduct credit only on success → set the result state → `appState = "results"` (or roll back to `"landing"` with a toast on failure). Any third analysis type's run function should follow this same shape.
- The pending-auth-then-resume flow (`pendingAnalyzeRef`) is mode-agnostic — `handleAuth` checks the _current_ `mode` state to decide which run function to resume, rather than storing "which mode was pending" separately, because `mode` doesn't change while an auth modal is open. Don't add a second ref for this; branching on live `mode` state is sufficient as long as that invariant holds.

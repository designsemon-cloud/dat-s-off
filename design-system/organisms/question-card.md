# Organism → Question Card (intake)

**Component**: [`QuestionCard.tsx`](../../src/components/uxcc/QuestionCard.tsx). **Replaces [`context-intake.md`](context-intake.md).** The intake step happens _in the chat_, before any credit is spent. It's never on the landing page and never a fixed questionnaire.

## Why it exists

A critique is only as accurate as its picture of the product. Earlier, triage guessed silently ("network security dashboard") and was told to ask "ZERO questions by default". So the user never saw the guess and never got asked, even when their question ("Is the most important thing the most visible?") depended on something only they know: what _is_ most important.

## Behaviour

- [`server/triage.ts`](../../src/server/triage.ts) (gpt-4o-mini; a single screenshot at `detail: "high"`, flows at `"low"`) infers **product, user and main task**, and writes 0–3 questions.
- **Questions are asked when** the user's question depends on priorities they haven't stated, the audience is ambiguous (admins vs. end users, novices vs. experts), or the domain would change the advice.
- **Questions are never** about what's visible, what the problems are, or "what is Amazon". Each must say how its answer changes the critique, or it's dropped.
- [`lib/session-runner.ts`](../../src/lib/session-runner.ts) shows the card whenever triage inferred anything or has questions. If triage failed (no key, error), the critique just runs.
- Chat lead: "Before I start, check what I'm assuming (and answer one question). Correct anything that's off; it makes the critique more accurate."
- Composer hint while waiting: "Check the details above, then start the critique".

## Anatomy

1. **Assumptions**: three rows. Each is a label (72px, 13px tertiary: Product / Used by / Main task) + an editable `h-8` input pre-filled with triage's guess (placeholder example when empty). Edits are sent as `ctx.productType` etc. ([`CONTEXT_KEY`](../../src/lib/session-types.ts)) and replace the inferred context.
2. **Questions** (after a hairline): the question in 14px medium (numbered only when there are several), option chips (`px-2.5 py-1 text-[12px]`, selected = foreground fill), "or type your own…" input. Chip and typed answer are mutually exclusive; all optional.
3. **Footer**: primary `GlowButton sm` "Start critique". "Skip, just analyze" appears only when there are no assumptions to confirm (with assumptions, starting as-is _is_ the skip).
4. **After**: collapses to a read-only recap of the context and the answers (label in tertiary, value 14px medium; no icons).

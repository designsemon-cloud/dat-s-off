# Pattern → Fix prompts

**Builders**: [`lib/fix-prompts.ts`](../../src/lib/fix-prompts.ts): `issuePrompt` (one issue), `combinedPrompt` (several), `versionPrompt` (a version's "fix everything": critical + medium issues, or all when only low ones are left).

Every prompt the product hands over is assembled in code from the critique's structured fields, not free-written by the model, so it has the same sections in the same order whichever tool it's pasted into (Cursor, Claude Code, v0, Lovable, Copilot, ChatGPT…). Plain Markdown headings, no tool-specific syntax.

## Structure

1. **# Task**: one line: what to do, and "make the smallest change that fully solves it".
2. **# Context**: what the tool can't see: screen title (and flow length), product, users, their main task (from the intake answers), platform, stack, and that the source is a screenshot review so elements are named as seen, and the code must be found first.
3. **# The issue / # Issues** (numbered, most important first). Per issue:
   - `## title (severity)`
   - **Where**: flow screen(s) + the model's `location` ("account header, right of the title").
   - **Problem**, **Why it matters** + the principle.
   - **What to change**: the model's numbered `steps`. Older critiques: the solution + the model's own fix prompt as detail.
   - **Don't change**: the model's `avoid` list (only when given).
   - **Done when**: the model's `acceptance` checks. Fallback: the problem no longer happens, and nothing else changed.
4. **# Constraints**: shared rules: change only what's needed; reuse existing components and tokens; don't touch copy, data or logic unless required; no new dependencies; WCAG AA, focus, keyboard, 44px touch targets; if something doesn't match the code, say so instead of guessing.
5. **# When you're done**: report files changed and one line per issue; list anything not fully fixed and why.

## Where the fields come from

The analyzers ([`server/analyze.ts`](../../src/server/analyze.ts), [`server/analyze-flow.ts`](../../src/server/analyze-flow.ts)) return `location`, `steps` (2–4), `avoid` (0–2) and `acceptance` (1–2) per issue. All are optional with zod defaults, so older or partial results still build a complete prompt.

## Rules

- One template. Never hand the user the model's raw `consolidatedFixPrompt`.
- Shown and copied the same way: [`atoms/copy-button.md`](../atoms/copy-button.md).

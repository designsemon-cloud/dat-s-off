import { z } from "zod";
import type { PreviousCritique } from "@/lib/mock-data";

// Prompt pieces shared by the single-screen and flow analyzers: the direct
// answer to the user's question, and the re-check pass that marks each issue
// from the previous version as fixed / partly / open (the Fix → Re-check
// loop, design-system/patterns/recheck-loop.md).

/** Answer the user's own question first, as a verdict plus the one change that matters most. */
export const ANSWER_INSTRUCTIONS = `ANSWER FIRST: The user's notes may contain a question (e.g. "Is the most important thing the most visible?"). Write "answer": 1-3 plain sentences that answer it directly. Start with the verdict (yes / no / partly, or the direct reply), then name the one change that matters most and where it is. If they didn't ask anything specific, answer "What should I fix first, and why?". No hedging, don't restate the question.`;

export function recheckInstructions(previous: PreviousCritique | undefined, idField: string) {
  if (!previous?.issues.length) return "";
  const list = previous.issues
    .map((i) => `- [${i.id}] (${i.severity}) ${i.title}: ${i.problem}`)
    .join("\n");
  return `
RE-CHECK: This is an UPDATED version of a design you critiqued before (previous score: ${previous.score}). The previous issues were:
${list}

If the previous version's screenshot is attached, compare the two images directly.
Be honest about what changed. The user calls this an update, but it may be unchanged, only slightly changed, cropped, or zoomed. Never say something improved unless you can point to the visible difference between the two images; if they look the same, say so ("I can't see any changes yet").
Set "sameScreen": false if the new screenshot is NOT the same product or screen (a different app, a document, an unrelated image); then don't pretend to compare: return "progress": [] and start "answer" by saying it doesn't look like an updated version of the same screen.
Otherwise set "sameScreen": true and, for EVERY previous issue (all ${previous.issues.length} of them), add an entry to "progress" with its previous id, a status and a one-sentence "note" on what you can see changed (or didn't):
- "fixed": the problem is visibly gone.
- "partly": visibly improved but not solved.
- "open": the same problem is still visible.
- "unseen": the part of the screen it was about isn't in the new screenshot (cropped out, scrolled away), so you can't judge it. Don't guess.
Cropping: if the new screenshot shows less of the screen than the previous one (its edges cut through panels, or whole areas from before simply aren't in frame), elements outside the frame were cropped out, not removed. Mark their issues "unseen", and never report something as missing or removed just because it's outside the new capture.
Issues that are "partly" fixed or still "open" must also appear in "${idField}" with "carriedFrom" set to the previous id. "unseen" issues don't go in "${idField}". Report genuinely new issues with "carriedFrom": null. Score this version on its own merits.
`;
}

export const ProgressSchema = z
  .array(
    z.object({
      previousId: z.string(),
      status: z.enum(["fixed", "partly", "open", "unseen"]),
      note: z.string().default(""),
    }),
  )
  .optional()
  .catch(undefined);

/**
 * A re-check that came back without a verdict for each previous issue, when
 * the screen is the same: the message for one corrective retry, else null.
 */
export function missingProgress(
  previous: PreviousCritique | undefined,
  result: { progress?: { previousId: string }[]; sameScreen?: boolean },
): string | null {
  if (!previous?.issues.length || result.sameScreen === false) return null;
  const have = new Set((result.progress ?? []).map((p) => p.previousId));
  const missing = previous.issues.filter((i) => !have.has(i.id));
  if (!missing.length) return null;
  return `Your response is missing "progress" entries for these previous issues: ${missing
    .map((i) => `[${i.id}] ${i.title}`)
    .join(
      ", ",
    )}. Compare the two screenshots and return the COMPLETE JSON again with a "progress" entry (fixed, partly, open or unseen) for every previous issue, and "sameScreen".`;
}

/** Findings must be about what's on this screen, not generic advice. */
export const SPECIFICITY_RULES = `- Every finding must be about specific elements you can see, named by their visible text, label or look (e.g. "the six orange tiles in Licenses: Support, Updates, IPS..."), in "problem" and "location". Don't report a generic quality ("low contrast", "inconsistent patterns", "improve hierarchy") without naming which elements show it and what exactly you see.
- At most one finding may be about the screen as a whole.
- If the user asked a question, the top findings should be the ones that answer it.`;

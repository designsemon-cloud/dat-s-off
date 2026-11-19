import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { FLOW_ISSUE_CATEGORIES } from "@/lib/flow-types";
import type { FlowAnalysisResult } from "@/lib/flow-types";
import { FLOW_MAX_SCREENS, FLOW_MIN_SCREENS } from "@/lib/pricing";
import { checkRateLimit } from "@/server/rate-limit";
import type { PreviousCritique } from "@/lib/mock-data";
import {
  ANSWER_INSTRUCTIONS,
  missingProgress,
  ProgressSchema,
  recheckInstructions,
  SPECIFICITY_RULES,
} from "./critique-prompts";
import { principleKeyList, readablePrinciple } from "@/lib/learn";

function getLanguageForStack(stack: string): string {
  const map: Record<string, string> = {
    "react-tailwind": "tsx",
    "react-css": "tsx",
    vue: "vue",
    "html-css": "html",
    swiftui: "swift",
    flutter: "dart",
  };
  return map[stack] ?? "tsx";
}

const FlowFixSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(["high", "medium", "low"]),
  principle: z.string().transform(readablePrinciple),
  principleKey: z.string().optional().catch(undefined),
  problem: z.string(),
  why: z.string(),
  solution: z.string(),
  code: z.string(),
  language: z.string(),
  fixPrompt: z.string().default(""),
  location: z.string().default("").catch(""),
  steps: z.array(z.string()).default([]).catch([]),
  avoid: z.array(z.string()).default([]).catch([]),
  acceptance: z.array(z.string()).default([]).catch([]),
  scope: z.enum(["screen", "transition", "flow"]),
  category: z.enum(FLOW_ISSUE_CATEGORIES),
  anchorScreenIds: z.array(z.string()),
  heuristic: z.string(),
  carriedFrom: z.string().nullable().optional().catch(null),
});

const FlowAnalysisResultSchema = z.object({
  flowScore: z.number().min(0).max(100),
  screenScores: z.record(z.string(), z.number()),
  flowCoherent: z.boolean(),
  goalAchieved: z.enum(["yes", "no", "unclear"]),
  answer: z.string().optional(),
  summary: z.string(),
  screens: z.array(z.object({ id: z.string(), name: z.string() })),
  findings: z.array(FlowFixSchema),
  progress: ProgressSchema,
  sameScreen: z.boolean().optional().catch(undefined),
});

function buildFlowPrompt(
  screens: { id: string; name: string }[],
  flowGoal: string,
  techStack: string,
  deviceTarget: string,
  previous?: PreviousCritique,
): string {
  const language = getLanguageForStack(techStack);
  const recheck = recheckInstructions(previous, "findings");
  const screenList = screens.map((s, i) => `  ${i + 1}. id="${s.id}" — "${s.name}"`).join("\n");

  return `You are a senior UX researcher performing a structured cognitive walkthrough across
an ordered sequence of ${screens.length} screens from a single user flow.

Screens, in order (use these exact ids in "anchorScreenIds"):
${screenList}

Tech Stack: ${techStack}
Target Device: ${deviceTarget}
Stated user goal for this flow: ${flowGoal ? `"${flowGoal}"` : '(not provided — infer the most likely goal from the screens themselves and state your inference in "summary".)'}

Ground EVERY finding in exactly one of these categories — do not invent new ones:
${FLOW_ISSUE_CATEGORIES.join(", ")}

For EACH pair of consecutive screens, apply this cognitive walkthrough:
1. Will the user know what to do next on the source screen?
2. Will they notice/find the correct control to make this transition?
3. After acting, will the destination screen's feedback confirm progress toward the goal?
4. If any answer is "no" or "unclear", record a "transition" scope finding anchored to
   both screen ids, in order [fromId, toId].

Also check across the WHOLE sequence for Nielsen heuristic violations: visibility of
system status, consistency and standards, error prevention, user control and freedom,
recognition rather than recall, help users recover from errors. Record these as "flow"
scope findings with an empty anchorScreenIds array, or "screen" scope with a single id
if localized to one screen.

If a screen's viewport doesn't match the declared device target while others do, or the
screens otherwise don't appear to belong to the same product/flow, or the sequence order
looks implausible, set "flowCoherent" to false and explain why in "summary" — do not
fabricate a full transition analysis in that case. Still return your best-effort findings.
${recheck}
${ANSWER_INSTRUCTIONS}

Respond with ONLY raw JSON — no markdown, no code fences, no explanation — matching this
exact shape:
{
  "flowScore": <integer 0-100, overall flow health, distinct from any single screen>,
  "screenScores": { "<screenId>": <integer 0-100>, ... one entry per screen ... },
  "flowCoherent": <boolean>,
  "goalAchieved": "<yes|no|unclear>",
  "answer": "<direct answer to the user's question, 1-3 sentences, per ANSWER FIRST>",
  "summary": "<3-4 sentence overall assessment of this flow>",
  "screens": [ { "id": "<screenId>", "name": "<screen name>" }, ... echo all screens back ... ],
  "findings": [
    {
      "id": "<sequential string: '1', '2', ...>",
      "title": "<issue title, max 8 words>",
      "severity": "<high|medium|low>",
      "principle": "<UX principle violated, in words a person would write; never the key>",
      "principleKey": "<the closest key from this list, or 'other': ${principleKeyList()}>",
      "problem": "<specific problem, 1-2 sentences>",
      "why": "<why this hurts users, 1-2 sentences>",
      "solution": "<concrete fix, 1-2 sentences>",
      "code": "<working ${language} code snippet implementing the fix, or a short comment if the fix is not code-shaped (e.g. 'Add a confirmation step before...')>",
      "language": "${language}",
      "fixPrompt": "<a self-contained, ready-to-paste prompt for an AI coding tool (Cursor/v0/Lovable) that fixes this specific issue — name the affected screen(s) and the exact change, 2-4 sentences>",
      "location": "<where on the screen, in words a developer can find, e.g. 'account header, right of the title'>",
      "steps": ["<concrete implementation step>", "... 2-4 steps, in order"],
      "avoid": ["<something that must NOT change while fixing this>", "... 0-2"],
      "acceptance": ["<observable check that proves it's fixed>", "... 1-2"],
      "scope": "<screen|transition|flow>",
      "category": "<one of the categories listed above>",
      "anchorScreenIds": [<screen id(s) this finding is anchored to, per the rules above>],
      "heuristic": "<the specific named heuristic or cognitive-walkthrough question violated>",
      "carriedFrom": <previous finding id if this continues one from the RE-CHECK list, else null>
    }
  ]${
    recheck
      ? `,
  "sameScreen": <true|false>,
  "progress": [ { "previousId": "<id from the RE-CHECK list>", "status": "<fixed|partly|open|unseen>", "note": "<one sentence>" } ]`
      : ""
  }
}

Rules:
${SPECIFICITY_RULES}
- Find 4-10 real findings across screen/transition/flow scopes combined — no generic advice
- "high" = blocks task completion or accessibility, "medium" = friction, "low" = polish
- All code must be valid ${language}
- flowScore: 90-100 excellent, 70-89 good, 50-69 needs work, <50 significant issues`;
}

type FlowAnalyzeInput = {
  screens: { id: string; name: string; imageBase64: string; mimeType: string }[];
  flowGoal: string;
  techStack: string;
  deviceTarget: string;
  /** Set on a re-check: the critique of the previous version. */
  previous?: PreviousCritique;
  sessionKey: string;
};

export const analyzeFlow = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as FlowAnalyzeInput)
  .handler(async ({ data }): Promise<FlowAnalysisResult> => {
    if (data.screens.length < FLOW_MIN_SCREENS || data.screens.length > FLOW_MAX_SCREENS) {
      throw new Error(
        `Flow analysis supports ${FLOW_MIN_SCREENS}-${FLOW_MAX_SCREENS} screens (got ${data.screens.length}).`,
      );
    }

    if (!(await checkRateLimit(`flow:${data.sessionKey}`))) {
      throw new Error("Daily flow-analysis limit reached. Try again tomorrow.");
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured. Add it to your .env.local file.");
    }

    // Dynamic import keeps the OpenAI SDK out of the browser bundle
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const screenMeta = data.screens.map((s) => ({ id: s.id, name: s.name }));
    const prompt = buildFlowPrompt(
      screenMeta,
      data.flowGoal,
      data.techStack,
      data.deviceTarget,
      data.previous,
    );

    const content: Array<
      { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
    > = [];
    data.screens.forEach((s, i) => {
      content.push({
        type: "text",
        text: `--- Screen ${i + 1} of ${data.screens.length} (id="${s.id}", "${s.name}") ---`,
      });
      content.push({
        type: "image_url",
        image_url: { url: `data:${s.mimeType || "image/png"};base64,${s.imageBase64}` },
      });
    });
    content.push({ type: "text", text: prompt });

    async function requestCompletion(extra?: string) {
      // gpt-4.1 follows the honesty and re-check rules far more reliably; fall back if the key can't use it.
      const ask = (model: string) =>
        client.chat.completions.create({
          model,
          max_tokens: 8192,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: extra ? [...content, { type: "text" as const, text: extra }] : content,
            },
          ],
        });
      const response = await ask("gpt-4.1").catch(() => ask("gpt-4o"));
      return response.choices[0].message.content || "";
    }

    function tryParse(
      raw: string,
    ): { success: true; data: FlowAnalysisResult } | { success: false; error: string } {
      const cleaned = raw
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      try {
        const parsed = FlowAnalysisResultSchema.safeParse(JSON.parse(cleaned));
        return parsed.success
          ? { success: true, data: parsed.data }
          : { success: false, error: parsed.error.message };
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : "Invalid JSON" };
      }
    }

    const first = tryParse(await requestCompletion());
    if (first.success) {
      // A re-check must say what happened to every previous issue; one retry if it didn't.
      const gap = missingProgress(data.previous, first.data);
      if (!gap) return first.data;
      const again = tryParse(await requestCompletion(gap));
      return again.success &&
        (again.data.progress?.length ?? 0) > (first.data.progress?.length ?? 0)
        ? again.data
        : first.data;
    }

    // One corrective retry: echo the validation error back and ask for a fix.
    const retryRaw = await requestCompletion(
      `Your previous response failed schema validation: ${first.error}. Return ONLY corrected JSON matching the schema exactly.`,
    );
    const retry = tryParse(retryRaw);
    if (retry.success) return retry.data;

    throw new Error("Flow analysis failed to produce a valid response. Please try again.");
  });

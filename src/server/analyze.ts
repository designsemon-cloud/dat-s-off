import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AnalysisContext, AnalysisResult, PreviousCritique } from "@/lib/mock-data";
import {
  ANSWER_INSTRUCTIONS,
  missingProgress,
  ProgressSchema,
  recheckInstructions,
  SPECIFICITY_RULES,
} from "./critique-prompts";
import { principleKeyList, readablePrinciple } from "@/lib/learn";

// TODO: Re-enable rate limiting before production deployment
// TESTING ONLY - Rate limit temporarily disabled
const requestLog = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 999;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = requestLog.get(key);
  if (!entry || now > entry.resetAt) {
    requestLog.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Skipped/unanswered intake questions arrive as "" (and the input isn't
// schema-validated), so any missing field falls back to an "infer it"
// instruction rather than a made-up value; contextSummary then reports what
// the model assumed.
function resolveContext(
  partial: Partial<AnalysisContext> | undefined,
  deviceTarget: string,
): AnalysisContext {
  return {
    productType: partial?.productType || "general digital",
    primaryUser:
      partial?.primaryUser || "a typical end user (infer a more specific user from the screenshot)",
    primaryTask:
      partial?.primaryTask || "the main task this screen supports (infer it from the screenshot)",
    focusArea: partial?.focusArea || "Everything",
    platform: partial?.platform ?? (deviceTarget === "mobile" ? "mobile" : "web"),
    stage: partial?.stage || "unspecified",
  };
}

function buildPrompt(
  techStack: string,
  deviceTarget: string,
  context: AnalysisContext,
  notes = "",
  previous?: PreviousCritique,
): string {
  const { productType, primaryUser, primaryTask, focusArea, platform, stage } = context;
  const recheck = recheckInstructions(previous, "fixes");
  return `You are a senior UX designer reviewing a UI screenshot for a ${productType} product.
Primary user: ${primaryUser}. Primary task: ${primaryTask}. Platform: ${platform}.
Tech stack: ${techStack}. Device: ${deviceTarget}.
Review focus: ${focusArea}. Product stage: ${stage}.
${notes ? `Additional notes from the user: ${notes}\n` : ""}${recheck}
Evaluate the screenshot in two passes. Only report what you can actually SEE in this screenshot — no generic advice.

PASS 1 — RULE ENGINE (deterministic checks — flag if violated):
- Nielsen #1: Missing loading states, success confirmations, error feedback
- Nielsen #3: No back/undo/cancel, trapped flows or dead ends
- Nielsen #4: Cross-screen label, style, or pattern inconsistency
- Nielsen #5: Missing form validation, no confirm on destructive actions
- Nielsen #9: Error messages that don't explain the problem or suggest a fix
- Hick's Law: More than 7 ungrouped options in navigation or forms
- Fitts' Law: Click/touch targets below 44×44px
- Von Restorff: Primary CTA not visually distinct from secondary actions
- WCAG 1.4.3: Text contrast below 4.5:1, UI component contrast below 3:1
- Color-only errors (no icon or label alternative)
- Generic CTA copy: "Click Here", "Submit", "OK", "Button"
- Missing empty state copy

PASS 2 — AI JUDGMENT (context-aware, requires interpretation):
- Nielsen #2: Does copy match the mental model of ${primaryUser} in a ${productType} product?
- Nielsen #6: Are key options visible or hidden behind memory recall?
- Nielsen #7: Is there a faster path for experienced users?
- Nielsen #8: Visual clutter — irrelevant content competing for attention
- Nielsen #10: Does this flow complexity require contextual help that isn't there?
- Visual hierarchy: Given this is a ${productType} product and the user's goal is ${primaryTask}, is the most important element visually dominant?
- UX copy quality: Does every label and CTA make sense to ${primaryUser} seeing it cold?
- Flow logic: Can the user fail gracefully, or do errors strand them?

WINS: Also identify 2-3 things the developer got right, and name the UX principle each one follows.

FIX PROMPTS: For each finding, write a "fixPrompt" — plain English the developer can paste directly into Cursor, v0, or Lovable to fix the issue. Use this format:
"In [location on screen], [describe the problem]. Please [specific fix]. Make sure [principle-based requirement]."

${ANSWER_INSTRUCTIONS}

CONSOLIDATED PROMPT: Finally, write a "consolidatedFixPrompt" — one combined prompt covering all high-severity issues, formatted so it can be pasted into a single AI session. If there are no high-severity issues, cover the medium-severity ones instead.

Respond with ONLY raw JSON — no markdown, no code fences, no explanation — matching this exact shape:
{
  "score": <integer 0-100>,
  "answer": "<direct answer to the user's question, 1-3 sentences, per ANSWER FIRST>",
  "summary": "<2-3 sentence overall UX assessment specific to this screen>",
  "contextSummary": "<one sentence confirming how you interpreted the product, user, and task context, including anything you had to infer>",
  "fixes": [
    {
      "id": "<sequential string: '1', '2', ...>",
      "title": "<issue title, max 8 words>",
      "severity": "<high|medium|low>",
      "principle": "<the rule or heuristic violated, in words a person would write, e.g. 'Fitts' Law' or 'Nielsen #9: Help users recover from errors'; never the key>",
      "principleKey": "<the closest key from this list, or 'other': ${principleKeyList()}>",
      "problem": "<specific problem visible in this screenshot, 1-2 sentences>",
      "why": "<why this hurts ${primaryUser}, 1-2 sentences>",
      "solution": "<concrete fix, 1-2 sentences>",
      "fixPrompt": "<paste-ready prompt in the format above>",
      "location": "<where on the screen, in words a developer can find, e.g. 'account header, right of the title'>",
      "steps": ["<concrete implementation step>", "... 2-4 steps, in order"],
      "avoid": ["<something that must NOT change while fixing this>", "... 0-2"],
      "acceptance": ["<observable check that proves it's fixed>", "... 1-2"],
      "region": {"x": <0-1 left edge>, "y": <0-1 top edge>, "w": <0-1 width>, "h": <0-1 height>} or null,
      "carriedFrom": <previous issue id if this continues one from the RE-CHECK list, else null>,
      "code": "",
      "language": "text"
    }
  ],
  "wins": [
    {
      "id": "<sequential string: 'w1', 'w2', ...>",
      "title": "<what they got right, max 8 words>",
      "principle": "<UX principle it follows, in words; never the key>",
      "principleKey": "<closest key from the same list as fixes, or 'other'>",
      "explanation": "<why it works for ${primaryUser}, 1-2 sentences>"
    }
  ],
  "consolidatedFixPrompt": "<one combined paste-ready prompt>"${
    recheck
      ? `,
  "sameScreen": <true|false>,
  "progress": [ { "previousId": "<id from the RE-CHECK list>", "status": "<fixed|partly|open|unseen>", "note": "<one sentence>" } ]`
      : ""
  }
}

Rules:
${SPECIFICITY_RULES}
- Report 3-8 real findings across both passes, ordered by severity
- "high" = blocks the primary task or fails accessibility, "medium" = friction, "low" = polish
- Always set "code" to an empty string and "language" to "text"
- "region" is the bounding box of the element the issue is about, as fractions of the screenshot's width and height (0,0 = top-left). Use null only for issues that aren't tied to one area
- Score: 90-100 excellent, 70-89 good, 50-69 needs work, <50 significant issues`;
}

type AnalyzeInput = {
  imageBase64: string;
  mimeType: string;
  techStack: string;
  deviceTarget: string;
  context: AnalysisContext;
  notes?: string;
  /** Set on a re-check: the critique of the previous version. */
  previous?: PreviousCritique;
  sessionKey: string;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const RegionSchema = z
  .object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() })
  .transform((r) => ({ x: clamp01(r.x), y: clamp01(r.y), w: clamp01(r.w), h: clamp01(r.h) }));

// Defaults keep a mostly-right response usable instead of failing the whole
// analysis over one missing optional field.
const AnalysisResultSchema = z.object({
  score: z.number().min(0).max(100),
  answer: z.string().optional(),
  summary: z.string(),
  contextSummary: z.string().optional(),
  fixes: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: z.enum(["high", "medium", "low"]),
      principle: z.string().transform(readablePrinciple),
      principleKey: z.string().optional().catch(undefined),
      problem: z.string(),
      why: z.string(),
      solution: z.string(),
      fixPrompt: z.string().default(""),
      location: z.string().default("").catch(""),
      steps: z.array(z.string()).default([]).catch([]),
      avoid: z.array(z.string()).default([]).catch([]),
      acceptance: z.array(z.string()).default([]).catch([]),
      region: RegionSchema.nullable().optional().catch(null),
      carriedFrom: z.string().nullable().optional().catch(null),
      code: z.string().default(""),
      language: z.string().default("text"),
    }),
  ),
  wins: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        principle: z.string().transform(readablePrinciple),
        principleKey: z.string().optional().catch(undefined),
        explanation: z.string(),
      }),
    )
    .default([]),
  consolidatedFixPrompt: z.string().default(""),
  progress: ProgressSchema,
  sameScreen: z.boolean().optional().catch(undefined),
});

export const analyzeImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as AnalyzeInput)
  .handler(async ({ data }): Promise<AnalysisResult> => {
    if (!checkRateLimit(data.sessionKey)) {
      throw new Error("Daily limit reached. You get 3 analyses per day — try again tomorrow.");
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured. Add it to your .env.local file.");
    }

    // Dynamic import keeps the OpenAI SDK out of the browser bundle
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail?: "high" | "low" | "auto" } }
    > = [
      // Re-checks: the previous version first, so the model compares the two images.
      ...(data.previous?.image
        ? [
            { type: "text" as const, text: "PREVIOUS VERSION (for comparison only):" },
            {
              type: "image_url" as const,
              image_url: { url: data.previous.image, detail: "low" as const },
            },
            { type: "text" as const, text: "NEW VERSION (the screenshot to critique):" },
          ]
        : []),
      {
        type: "image_url",
        image_url: {
          url: `data:${data.mimeType || "image/png"};base64,${data.imageBase64}`,
          detail: "high",
        },
      },
      {
        type: "text",
        text: buildPrompt(
          data.techStack,
          data.deviceTarget,
          resolveContext(data.context, data.deviceTarget),
          data.notes ?? "",
          data.previous,
        ),
      },
    ];

    async function requestCompletion(extra?: string) {
      // gpt-4.1 follows the honesty and re-check rules far more reliably; fall back if the key can't use it.
      const ask = (model: string) =>
        client.chat.completions.create({
          model,
          max_tokens: 6000,
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
    ): { success: true; data: AnalysisResult } | { success: false; error: string } {
      const cleaned = raw
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      try {
        const parsed = AnalysisResultSchema.safeParse(JSON.parse(cleaned));
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
    const retry = tryParse(
      await requestCompletion(
        `Your previous response failed schema validation: ${first.error}. Return ONLY corrected JSON matching the schema exactly.`,
      ),
    );
    if (retry.success) return retry.data;

    throw new Error("Analysis failed to produce a valid response. Please try again.");
  });

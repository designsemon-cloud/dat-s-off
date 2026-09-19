import { createServerFn } from "@tanstack/react-start";
import type { AnalysisResult } from "@/lib/mock-data";

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

function buildPrompt(techStack: string, deviceTarget: string): string {
  const language = getLanguageForStack(techStack);
  return `You are a senior UX engineer reviewing a UI screenshot. Identify real UX issues.

Tech Stack: ${techStack}
Target Device: ${deviceTarget}

Respond with ONLY raw JSON — no markdown, no code fences, no explanation:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence overall UX assessment specific to this screen>",
  "fixes": [
    {
      "id": "<sequential string: '1', '2', ...>",
      "title": "<issue title, max 8 words>",
      "severity": "<high|medium|low>",
      "principle": "<UX principle violated, e.g. 'Visual Hierarchy & Fitts\\'s Law'>",
      "problem": "<specific problem visible in this screenshot, 1-2 sentences>",
      "why": "<why this hurts users, 1-2 sentences>",
      "solution": "<concrete fix, 1-2 sentences>",
      "code": "<working ${language} code snippet that implements the fix>",
      "language": "${language}"
    }
  ]
}

Rules:
- Find 3-6 real issues from what you SEE in the screenshot — no generic advice
- "high" = blocks conversion or accessibility, "medium" = friction, "low" = polish
- All code must be valid ${language}
- Score: 90-100 excellent, 70-89 good, 50-69 needs work, <50 significant issues`;
}

type AnalyzeInput = {
  imageBase64: string;
  mimeType: string;
  techStack: string;
  deviceTarget: string;
  sessionKey: string;
};

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

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${data.mimeType || "image/png"};base64,${data.imageBase64}`,
              },
            },
            {
              type: "text",
              text: buildPrompt(data.techStack, data.deviceTarget),
            },
          ],
        },
      ],
    });

    const raw = response.choices[0].message.content || "";
    // Strip accidental markdown code fences that models sometimes add
    const cleaned = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    return JSON.parse(cleaned) as AnalysisResult;
  });

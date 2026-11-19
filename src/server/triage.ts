import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Runs before every analysis. Looks at the screenshot(s) and the user's
// prompt, infers the product, user and main task (which the user then
// confirms or corrects in the chat), and asks the questions whose answers
// would change the critique. Never blocks: any failure falls back to "no
// questions" so the analysis still runs.

export interface TriageResult {
  title: string;
  inferred: {
    productType: string;
    primaryUser: string;
    primaryTask: string;
  };
  questions: { id: string; question: string; options: string[] }[];
}

type TriageInput = {
  images: { imageBase64: string; mimeType: string }[];
  prompt: string;
  mode: "single" | "flow";
  deviceTarget: string;
};

const TriageSchema = z.object({
  title: z.string().default(""),
  inferred: z
    .object({
      productType: z.string().default(""),
      primaryUser: z.string().default(""),
      primaryTask: z.string().default(""),
    })
    .default({ productType: "", primaryUser: "", primaryTask: "" }),
  questions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        options: z.array(z.string()).max(6).default([]),
        changes: z.string().default(""),
      }),
    )
    .default([]),
});

function buildTriagePrompt(prompt: string, mode: "single" | "flow", device: string) {
  return `You are the intake step of a UX critique tool. Before a senior UX designer critiques ${
    mode === "flow" ? "this sequence of screens (a user flow)" : "this UI screenshot"
  }, decide whether you need to ask the user anything.

The user's request: ${prompt ? `"${prompt}"` : "(none — they only uploaded the screenshot)"}
Target device: ${device}

Step 1 — Infer from what you can SEE and from the request:
- productType: what kind of product this is, as specific as the evidence allows (e.g. "B2C fashion e-commerce", "B2B CRM", "consumer fitness app")
- primaryUser: who uses this screen
- primaryTask: what this screen is for
Leave a field as "" if you genuinely can't tell.

Step 2 — Decide on questions. The user will see your Step 1 guesses and can correct them, so don't ask for those directly. Ask about the facts the critique depends on that you can't see in pixels and the request doesn't state. Ask 1-3 when:
- The user's question depends on priorities they haven't told you. "Is the most important thing the most visible?" or "Is this converting well?" needs to know what IS most important on this screen for this user, or what the conversion goal is. A question to the tool is not a goal statement.
- The audience is ambiguous (e.g. admins vs. end users, first-time vs. daily users, experts vs. novices) and the advice would differ.
- The domain, regulation or business model would change the advice (e.g. healthcare, finance, B2B buyers vs. consumers).
Ask ZERO only when the request and the screen already make the product, the user, the main task and the user's goal clear.
Rules:
- Never ask what the problems are or what users struggle with: finding that is the critique's job.
- Never ask what is obvious from the screenshot or the request. A well-known product (e.g. Amazon, Salesforce) needs no "what is this" question.
- Good: "What should an admin do first on this screen?", "Is this for first-time visitors or logged-in customers?", "Do your buyers purchase for themselves or for a company?". Bad: "What products are shoppers looking for?", "What issue do users face?", "Are users familiar with this site?" (for a famous site).
- At most 3. For each, fill "changes" with how the answer would change the critique; if you can't say, don't ask it.
- Each question is short, plain English, specific to THIS screen, with 3–5 short answer options (1–4 words). The user can type their own answer, so don't add "Other".

Also write a short session title (3–6 words) describing what's being reviewed, e.g. "Checkout page review" or "CRM account record".

Respond with ONLY raw JSON:
{
  "title": "<3-6 words>",
  "inferred": { "productType": "<string or ''>", "primaryUser": "<string or ''>", "primaryTask": "<string or ''>" },
  "questions": [ { "id": "q1", "question": "<question>", "options": ["<option>", "..."], "changes": "<how the answer changes the critique>" } ]
}`;
}

export const triage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as TriageInput)
  .handler(async ({ data }): Promise<TriageResult> => {
    const fallback: TriageResult = {
      title: "",
      inferred: { productType: "", primaryUser: "", primaryTask: "" },
      questions: [],
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return fallback;

    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey });

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              ...data.images.slice(0, 3).map((img) => ({
                type: "image_url" as const,
                image_url: {
                  url: `data:${img.mimeType || "image/png"};base64,${img.imageBase64}`,
                  // One screenshot is read at full resolution so small UI text
                  // counts; flows send several, so they stay at low detail.
                  detail: data.images.length === 1 ? ("high" as const) : ("low" as const),
                },
              })),
              {
                type: "text" as const,
                text: buildTriagePrompt(data.prompt, data.mode, data.deviceTarget),
              },
            ],
          },
        ],
      });

      const parsed = TriageSchema.safeParse(
        JSON.parse(response.choices[0].message.content || "{}"),
      );
      if (!parsed.success) return fallback;

      return {
        ...parsed.data,
        questions: parsed.data.questions
          // A question the model can't justify is one it shouldn't ask.
          .filter((q) => q.question.trim() && q.changes.trim())
          .slice(0, 3)
          .map((q, i) => ({ id: q.id || `q${i + 1}`, question: q.question, options: q.options })),
      };
    } catch {
      return fallback;
    }
  });

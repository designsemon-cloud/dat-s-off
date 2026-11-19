import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// The input check: runs before any credit is spent, on the first critique and
// on every re-check. It looks at what was actually uploaded instead of
// trusting the label the flow gives it ("this is v2"):
// - First run: is this an interface at all, and is enough of it visible?
//   Flows: do the screens belong to one product?
// - Re-check: is the new screenshot the same product/screen as the version
//   it will be compared with? A redesign can look completely different and
//   still be the same screen; an unrelated image is not a re-check.
// When the answer is no or unclear, the session asks the user before going on.
// See design-system/patterns/input-check.md.

export interface InputCheck {
  /** What the new image(s) show, in a short phrase. */
  shows: string;
  /** What the previous version showed (re-checks). */
  previousShows: string;
  verdict: "proceed" | "ask";
  /** Why it would ask, for logs/tests. */
  reason: "ok" | "not-ui" | "too-little" | "unrelated-to-previous" | "mixed-flow" | "unclear";
  /** The question for the user, when verdict is "ask". */
  message: string;
}

interface CheckInput {
  images: { imageBase64: string; mimeType: string }[];
  /** Re-checks: the version the new upload will be compared with. */
  previous?: {
    image?: { imageBase64: string; mimeType: string };
    title: string;
    productType: string;
    summary: string;
  };
  mode: "single" | "flow";
  prompt: string;
}

const CheckSchema = z.object({
  shows: z.string().default(""),
  previousShows: z.string().default(""),
  isInterface: z.enum(["yes", "partly", "no"]).catch("yes"),
  enoughVisible: z.boolean().catch(true),
  sameProduct: z
    .enum(["same-screen", "redesign", "other-screen-same-product", "unrelated", "unclear"])
    .optional()
    .catch(undefined),
  flowRelated: z.enum(["yes", "partly", "no"]).optional().catch(undefined),
  question: z.string().default(""),
});

function buildPrompt(d: CheckInput) {
  const recheck = !!d.previous;
  return `You check uploads for a UX critique tool before it spends the user's credit. Don't judge the design; only decide whether the input is valid for the task.

${
  recheck
    ? `TASK: a RE-CHECK. The user critiqued a screen before and is now uploading its updated version to see what's fixed.
The FIRST image is the previous version ("${d.previous!.title}"${d.previous!.productType ? `, a ${d.previous!.productType}` : ""}; the critique said: "${d.previous!.summary}").
The LAST image is the new upload.
Decide "sameProduct" by comparing them:
- "same-screen": the same interface, changed or not.
- "redesign": the same screen or purpose redesigned, even if it looks completely different (same product, same job).
- "other-screen-same-product": a different screen of the same product.
- "unrelated": a different product, or not the same thing at all (e.g. a document, a case-study page, a photo, a different app).
- "unclear": you can't tell.`
    : d.mode === "flow"
      ? `TASK: a FLOW critique of ${d.images.length} screens that should be steps of one product's user journey. Decide "flowRelated": "yes" if they belong to one product, "partly" if one or more clearly don't, "no" if they're unrelated.`
      : `TASK: a critique of one UI screenshot.`
}

The user's message: ${d.prompt ? `"${d.prompt}"` : "(none)"}

For the new upload, decide:
- "shows": what it is, in a short specific phrase naming the product when you can (e.g. "Spotify desktop player, now-playing view", "a news article page, mostly text", "banking app transfer form on mobile").
- "isInterface": "yes" if it's a screenshot or mockup of a software interface (app, website, dashboard, component, form, wireframe); "partly" if it's mainly something else with a small UI in it (a slide or case-study page showing a screen); "no" if it isn't an interface (a document, an article, a photo, a chart alone, a logo).
- "enoughVisible": false if it's so cropped, tiny or blurry that a critique would be guesswork.
${recheck ? `- "previousShows": what the previous version shows, in a short phrase.\n` : ""}
If anything makes the task invalid or doubtful, write "question": 1-2 plain sentences to the user that say what you see${recheck ? " in each image" : ""} and ask whether they uploaded the right image. Example: "These look like different things: v1 is a banking app's transfer form, but this one is a photo of a whiteboard. Did you mean to upload the updated transfer form?" Otherwise "question" is "".

Return ONLY JSON:
{"shows": "", "previousShows": "", "isInterface": "yes|partly|no", "enoughVisible": true${recheck ? `, "sameProduct": "same-screen|redesign|other-screen-same-product|unrelated|unclear"` : d.mode === "flow" ? `, "flowRelated": "yes|partly|no"` : ""}, "question": ""}`;
}

const image = (img: { imageBase64: string; mimeType: string }) => ({
  type: "image_url" as const,
  image_url: {
    url: `data:${img.mimeType || "image/png"};base64,${img.imageBase64}`,
    detail: "low" as const,
  },
});

export const checkInput = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as CheckInput)
  .handler(async ({ data }): Promise<InputCheck> => {
    const pass: InputCheck = {
      shows: "",
      previousShows: "",
      verdict: "proceed",
      reason: "ok",
      message: "",
    };
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !data.images.length) return pass;
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const content = [
      ...(data.previous?.image ? [image(data.previous.image)] : []),
      ...data.images.slice(0, 6).map(image),
      { type: "text" as const, text: buildPrompt(data) },
    ];
    const ask = (model: string) =>
      client.chat.completions.create({
        model,
        temperature: 0,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content }],
      });
    let raw: string;
    try {
      raw = (await ask("gpt-4.1")).choices[0].message.content ?? "";
    } catch {
      raw = (await ask("gpt-4o")).choices[0].message.content ?? "";
    }
    const c = CheckSchema.parse(JSON.parse(raw));

    const reason: InputCheck["reason"] =
      c.isInterface === "no"
        ? "not-ui"
        : data.previous && (c.sameProduct === "unrelated" || c.sameProduct === "unclear")
          ? c.sameProduct === "unrelated"
            ? "unrelated-to-previous"
            : "unclear"
          : data.mode === "flow" && !data.previous && c.flowRelated && c.flowRelated !== "yes"
            ? "mixed-flow"
            : !c.enoughVisible || c.isInterface === "partly"
              ? "too-little"
              : "ok";
    const fallbackQuestion: Record<InputCheck["reason"], string> = {
      ok: "",
      "not-ui": `This doesn't look like an interface${c.shows ? `: it looks like ${c.shows}` : ""}. Did you upload the right image?`,
      "too-little": `I can only see part of an interface here${c.shows ? ` (${c.shows})` : ""}, so a critique would be guesswork. Do you have a fuller screenshot?`,
      "unrelated-to-previous": `This doesn't look like the same product as v1${c.previousShows && c.shows ? `: v1 is ${c.previousShows}, but this is ${c.shows}` : ""}. Did you upload the right updated screen?`,
      unclear: `I can't tell whether this is the same screen as v1${c.previousShows && c.shows ? ` (v1: ${c.previousShows}; this: ${c.shows})` : ""}. Is it the updated version?`,
      "mixed-flow":
        "These screens don't all look like one product's flow. Did you upload the right screens?",
    };
    return {
      shows: c.shows,
      previousShows: c.previousShows,
      verdict: reason === "ok" ? "proceed" : "ask",
      reason,
      message: reason === "ok" ? "" : c.question.trim() || fallbackQuestion[reason],
    };
  });

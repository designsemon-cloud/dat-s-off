import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// The locate pass: one single-purpose call that only finds where each issue
// is. The critique call is busy judging the screen, and models are poor at
// writing coordinates, so its boxes drift (a pin on empty space). Here the
// browser first detects the real elements on the screenshot
// (lib/ui-proposals.ts) and draws them as numbered boxes on zoomed tiles; the
// model only picks numbers (set-of-marks), which it does far more reliably.
// The marker is then the element's own pixels, and each one is verified on a
// close-up (verifyMarks) before it's shown. No credit is charged.
// See design-system/patterns/annotation-accuracy.md.

export interface LocateIssue {
  id: string;
  title: string;
  problem: string;
  solution: string;
  location?: string;
}

interface PickInput {
  /** The whole screenshot, clean, base64 JPEG. */
  image: string;
  /** Zoomed parts of it with the detected elements outlined and numbered. */
  tiles: { label: string; image: string }[];
  /** How many numbered elements there are in total. */
  count: number;
  issues: LocateIssue[];
  /** A second try: picks that failed verification, and why. */
  rejected?: { id: string; marks: number[]; why: string }[];
}

export interface PickedMarks {
  id: string;
  element: string;
  /** Numbers of the marks that make up the element, main one first; empty when none fits. */
  marks: number[];
}

const ResultSchema = z.object({
  regions: z.array(
    z.object({
      id: z.string(),
      element: z.string().default("").catch(""),
      marks: z.array(z.number()).default([]).catch([]),
    }),
  ),
});

type Part =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "high" } };

const jpeg = (b64: string): Part => ({
  type: "image_url",
  image_url: { url: `data:image/jpeg;base64,${b64}`, detail: "high" },
});

const describe = (i: LocateIssue) =>
  `- id "${i.id}": ${i.title}\n  Problem: ${i.problem}\n  Fix: ${i.solution}${i.location ? `\n  Location hint: ${i.location}` : ""}`;

export const pickMarks = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as PickInput)
  .handler(async ({ data }): Promise<PickedMarks[]> => {
    if (!data.issues.length || !data.count) return [];
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const content: Part[] = [
      {
        type: "text",
        text: `You are marking where UX issues are on a screenshot, so a designer sees exactly which element each issue is about.

The first image is the whole screenshot. The next images are zoomed parts of it (they overlap). In them, the visible elements are outlined and numbered 1-${data.count}: the number tag sits on each box's top-left corner, in the box's colour. The same element keeps the same number in every part it appears in.`,
      },
      jpeg(data.image),
    ];
    data.tiles.forEach((t) => content.push({ type: "text", text: t.label }, jpeg(t.image)));
    content.push({
      type: "text",
      text: `For each issue, pick the numbered box(es) of the element it is about.

Rules:
- Use the title, problem, fix and location hint to decide which element the issue is about, then find its number.
- Prefer the single box that covers the element. Add more numbers only when they sit right next to it and together make up the element (a label and its value, a button's icon and text, a row of competing buttons). Put the main one first.
- Pick the element itself, never empty space, and never a whole panel unless the issue is about that whole area.
- If the issue is about something missing or weak (e.g. "no clear primary action"), pick the existing element(s) that should carry it.
- If it's about several identical elements (e.g. list rows), pick every box of one whole example (all parts of the first row), not a single word.
- If the issue is about the screen as a whole or a quality spread across many different elements (overall contrast, spacing, consistency, density, too much going on), return an empty list: a marker on one arbitrary element would mislead.
- If no box fits, return an empty list.

Issues:
${data.issues.map(describe).join("\n")}
${
  data.rejected?.length
    ? `\nThis is a second try. These earlier picks were checked on a close-up and rejected; pick again, differently (or return an empty list if no box fits):\n${data.rejected.map((r) => `- id "${r.id}": picked [${r.marks.join(", ")}], rejected because: ${r.why}`).join("\n")}\n`
    : ""
}
Return ONLY JSON: {"regions": [{"id": "<issue id>", "element": "<what you picked, in a few words>", "marks": [<numbers>]}]}`,
    });

    const ask = (model: string) =>
      client.chat.completions.create({
        model,
        temperature: 0,
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content }],
      });
    // gpt-4.1 reads small marks noticeably better than gpt-4o; fall back if the key can't use it.
    let raw = "";
    try {
      raw = (await ask("gpt-4.1")).choices[0].message.content ?? "";
    } catch {
      raw = (await ask("gpt-4o")).choices[0].message.content ?? "";
    }
    const parsed = ResultSchema.safeParse(JSON.parse(raw.replace(/^```(?:json)?\n?|\n?```$/g, "")));
    if (!parsed.success) throw new Error("Couldn't read the marker positions.");
    const ids = new Set(data.issues.map((i) => i.id));
    return parsed.data.regions.filter((r) => ids.has(r.id));
  });

interface VerifyInput {
  checks: { issue: LocateIssue; element: string; image: string }[];
}

const VerifySchema = z.object({
  checks: z.array(
    z.object({
      id: z.string(),
      ok: z.boolean().catch(false),
      why: z.string().default("").catch(""),
    }),
  ),
});

/**
 * The second look: each picked element is shown as a close-up with a magenta
 * outline, and must be confirmed as the element the issue is about. Only
 * confirmed picks become markers.
 */
export const verifyMarks = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as VerifyInput)
  .handler(async ({ data }): Promise<{ id: string; ok: boolean; why: string }[]> => {
    if (!data.checks.length) return [];
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });
    const content: Part[] = [
      {
        type: "text",
        text: "You are checking markers on a UX critique before they're shown. Each image below is a close-up of a screenshot with one area outlined in magenta. For each, decide whether the outlined area is the element the issue is about. It doesn't matter whether the problem is visible or fixed: only whether this is the right element. Be strict, because a wrong marker misleads the designer. Answer false if the outline is on empty space or on a different element; if it covers only a fragment that isn't what the issue is about; or if it's much bigger than the element (a whole banner, panel or row of text when the issue is about one small link, label or button inside it). Also answer false if the issue is about the screen as a whole or a quality spread across many elements (overall contrast, spacing, consistency), since one outlined element would misrepresent it. Answer true only when the outline sits on the element itself, tightly enough that someone glancing at it would look at the right thing.",
      },
    ];
    data.checks.forEach((c) =>
      content.push(
        {
          type: "text",
          text: `Issue id "${c.issue.id}": ${c.issue.title}. Problem: ${c.issue.problem}${c.element ? ` (expected element: ${c.element})` : ""}`,
        },
        jpeg(c.image),
      ),
    );
    content.push({
      type: "text",
      text: 'Return ONLY JSON: {"checks": [{"id": "<issue id>", "ok": true|false, "why": "<a few words>"}]}',
    });
    const ask = (model: string) =>
      client.chat.completions.create({
        model,
        temperature: 0,
        max_tokens: 800,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content }],
      });
    let raw = "";
    try {
      raw = (await ask("gpt-4.1")).choices[0].message.content ?? "";
    } catch {
      raw = (await ask("gpt-4o")).choices[0].message.content ?? "";
    }
    const parsed = VerifySchema.safeParse(JSON.parse(raw.replace(/^```(?:json)?\n?|\n?```$/g, "")));
    if (!parsed.success) throw new Error("Couldn't verify the markers.");
    return parsed.data.checks.map((c) => ({ id: c.id, ok: c.ok, why: c.why }));
  });

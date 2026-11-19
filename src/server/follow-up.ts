import { createServerFn } from "@tanstack/react-start";

// Answers text questions about a finished critique ("why is #2 high?",
// "how would this work on mobile?") in a fixed, directional shape: the answer,
// the steps in order, then the one next step. Text-only and cheap: the critique JSON
// is the context, so the screenshot isn't re-sent and no credit is charged.

type FollowUpInput = {
  question: string;
  /** JSON of the AnalysisResult / FlowAnalysisResult being discussed. */
  resultJson: string;
  history: { role: "user" | "assistant"; text: string }[];
};

export const followUp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as FollowUpInput)
  .handler(async ({ data }): Promise<{ text: string }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured. Add it to your .env.local file.");
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content: `You are a senior UX designer who just critiqued a UI. Answer the user's follow-up questions about your critique so they always know what to do next.

Format every reply like this, in plain text (no markdown symbols like ** or #):
1. First line: the direct answer to their question, in one or two sentences. Lead with the verdict (yes / no / it depends on X), never with background.
2. If they need to act: a short numbered list of steps in the order to do them ("1. … 2. …"), each one concrete (what to change, where).
3. Last line: the single next step, e.g. "Next: copy the fix prompt for #2 into Cursor, then attach the updated screenshot here to re-check it."

Keep it under 150 words unless they ask for more. Refer to issues by their number and title. If they ask for a fix, give a paste-ready prompt for an AI coding tool on its own lines. If the question needs the screenshot re-analyzed (e.g. they changed the design), tell them to attach the new screenshot to re-check it.

Your critique (JSON):
${data.resultJson.slice(0, 24000)}`,
        },
        ...data.history.slice(-8).map((m) => ({ role: m.role, content: m.text })),
        { role: "user", content: data.question },
      ],
    });

    return {
      text: response.choices[0].message.content?.trim() || "Sorry — I couldn't answer that.",
    };
  });

import { followUp } from "@/server/follow-up";

export async function askFollowUp(
  question: string,
  result: unknown,
  history: { role: "user" | "assistant"; text: string }[],
): Promise<string> {
  const { text } = await followUp({
    data: { question, resultJson: JSON.stringify(result), history },
  });
  return text;
}

import { analyzeFlow } from "@/server/analyze-flow";
import type { FlowAnalysisResult, FlowScreen } from "./flow-types";
import type { PreviousCritique } from "./mock-data";
import { parseMimeType, extractBase64, getSessionKey } from "./session";

export async function analyzeFlowUI(
  screens: FlowScreen[],
  flowGoal: string,
  techStack: string,
  deviceTarget: string,
  previous?: PreviousCritique,
): Promise<FlowAnalysisResult> {
  return analyzeFlow({
    data: {
      screens: [...screens]
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          id: s.id,
          name: s.name,
          imageBase64: extractBase64(s.dataUrl),
          mimeType: parseMimeType(s.dataUrl),
        })),
      flowGoal,
      techStack,
      deviceTarget,
      previous,
      sessionKey: getSessionKey(),
    },
  });
}

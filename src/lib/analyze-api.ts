import { analyzeImage } from "@/server/analyze";
import type { AnalysisContext, AnalysisResult, PreviousCritique } from "./mock-data";
import { parseMimeType, extractBase64, getSessionKey } from "./session";

export async function analyzeUI(
  imageDataUrl: string,
  techStack: string,
  deviceTarget: string,
  context: AnalysisContext,
  notes = "",
  previous?: PreviousCritique,
): Promise<AnalysisResult> {
  return analyzeImage({
    data: {
      imageBase64: extractBase64(imageDataUrl),
      mimeType: parseMimeType(imageDataUrl),
      techStack,
      deviceTarget,
      context,
      notes,
      previous,
      sessionKey: getSessionKey(),
    },
  });
}

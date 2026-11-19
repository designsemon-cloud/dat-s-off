import { triage, type TriageResult } from "@/server/triage";
import type { FlowScreen } from "./flow-types";
import type { AnalysisMode } from "./session-types";
import { parseMimeType, extractBase64 } from "./session";

export type { TriageResult };

// Samples and other non-data-URL images can't be sent as base64, so they're
// skipped; triage still runs on the prompt alone.
export async function triageUI(
  attachments: FlowScreen[],
  prompt: string,
  mode: AnalysisMode,
  deviceTarget: string,
): Promise<TriageResult> {
  return triage({
    data: {
      images: attachments
        .filter((a) => a.dataUrl.startsWith("data:"))
        .slice(0, 3)
        .map((a) => ({
          imageBase64: extractBase64(a.dataUrl),
          mimeType: parseMimeType(a.dataUrl),
        })),
      prompt,
      mode,
      deviceTarget,
    },
  });
}

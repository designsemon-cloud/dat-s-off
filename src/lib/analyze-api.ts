import { analyzeImage } from "@/server/analyze";
import type { AnalysisResult } from "./mock-data";

function parseMimeType(dataUrl: string): string {
  return dataUrl.match(/data:([^;]+)/)?.[1] ?? "image/png";
}

function extractBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma !== -1 ? dataUrl.slice(comma + 1) : dataUrl;
}

// Stable session key stored in sessionStorage for per-session rate limiting.
// This is best-effort — the server uses it as the rate-limit bucket key.
function getSessionKey(): string {
  const stored = sessionStorage.getItem("uxcc-session");
  if (stored) return stored;
  const key = crypto.randomUUID();
  sessionStorage.setItem("uxcc-session", key);
  return key;
}

export async function analyzeUI(
  imageDataUrl: string,
  techStack: string,
  deviceTarget: string,
): Promise<AnalysisResult> {
  return analyzeImage({
    data: {
      imageBase64: extractBase64(imageDataUrl),
      mimeType: parseMimeType(imageDataUrl),
      techStack,
      deviceTarget,
      sessionKey: getSessionKey(),
    },
  });
}

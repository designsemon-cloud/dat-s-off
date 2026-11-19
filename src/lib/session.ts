export function parseMimeType(dataUrl: string): string {
  return dataUrl.match(/data:([^;]+)/)?.[1] ?? "image/png";
}

export function extractBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma !== -1 ? dataUrl.slice(comma + 1) : dataUrl;
}

// Stable session key stored in sessionStorage for per-session rate limiting.
// This is best-effort — the server uses it as the rate-limit bucket key.
export function getSessionKey(): string {
  const stored = sessionStorage.getItem("uxcc-session");
  if (stored) return stored;
  const key = crypto.randomUUID();
  sessionStorage.setItem("uxcc-session", key);
  return key;
}

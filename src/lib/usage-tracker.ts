const STORAGE_KEY = "ux-critic-usage";
const MAX_FREE_USES = 5;

interface UsageData {
  usageCount: number;
  lastUpdated: string;
}

export function getUsageCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    return (JSON.parse(data) as UsageData).usageCount || 0;
  } catch {
    return 0;
  }
}

export function incrementUsage(): void {
  if (typeof window === "undefined") return;
  try {
    const newData: UsageData = {
      usageCount: getUsageCount() + 1,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  } catch {
    // silently ignore storage errors
  }
}

export function hasUsageRemaining(): boolean {
  return getUsageCount() < MAX_FREE_USES;
}

export function getRemainingUsage(): number {
  return Math.max(0, MAX_FREE_USES - getUsageCount());
}

export function resetUsage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

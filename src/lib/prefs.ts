import { DEVICES, TECH_STACKS } from "./mock-data";

// Defaults for new critiques, edited on the Settings screen.

const KEY = "datsoff-prefs";

export interface Prefs {
  stack: string;
  device: string;
}

const DEFAULTS: Prefs = { stack: TECH_STACKS[0].id, device: DEVICES[0].id };

export function getPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULTS;
  }
}

export function setPrefs(next: Partial<Prefs>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getPrefs(), ...next }));
  } catch {
    // storage blocked — defaults just won't persist
  }
}

export const stackLabel = (id: string) => TECH_STACKS.find((s) => s.id === id)?.label ?? id;
export const deviceLabel = (id: string) => DEVICES.find((d) => d.id === id)?.label ?? id;

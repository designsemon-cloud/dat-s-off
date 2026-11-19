import { useCallback, useSyncExternalStore } from "react";

// Light is the source theme; dark is derived (see styles.css). The choice is
// stored per browser and applied to <html> by THEME_INIT_SCRIPT before first
// paint, so there's no flash of the wrong theme.

export type Theme = "light" | "dark";
const KEY = "datsoff-theme";

/** Inlined into <head> by the root route. Keep it dependency-free. */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

const listeners = new Set<() => void>();

function current(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // storage blocked — theme still applies for this page view
  }
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    current,
    (): Theme => "light",
  );
  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme]);
  return { theme, toggle };
}

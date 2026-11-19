import { createContext, useContext } from "react";

// Lets a page tell the app shell that a side panel (the critique panel) is
// open, so the shell can fold the sidebar to its icon rail and give the
// panel room — the way a Claude chat makes space when an artifact opens.
// See design-system/templates/app-shell-template.md.

export const ShellContext = createContext<{ setPanelOpen: (open: boolean) => void }>({
  setPanelOpen: () => {},
});

export const useShell = () => useContext(ShellContext);

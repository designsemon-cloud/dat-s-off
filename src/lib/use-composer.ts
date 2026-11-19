import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { FlowScreen } from "./flow-types";
import type { AnalysisMode } from "./session-types";
import { FLOW_MIN_SCREENS } from "./pricing";
import { getPrefs } from "./prefs";
import { createSession } from "./session-runner";

// State behind every "start a critique" PromptComposer (landing hero and
// /app). Submitting creates a session and opens it; the session page then
// runs triage → questions → analysis in the chat.
export function useComposer() {
  const navigate = useNavigate();
  const [mode, setModeState] = useState<AnalysisMode>("single");
  const [attachments, setAttachments] = useState<FlowScreen[]>([]);
  const [prompt, setPrompt] = useState("");
  const [stack, setStack] = useState(() => getPrefs().stack);
  const [device, setDevice] = useState(() => getPrefs().device);

  // Prefs live in localStorage; re-read after mount so SSR markup matches.
  useEffect(() => {
    const p = getPrefs();
    setStack(p.stack);
    setDevice(p.device);
  }, []);

  // Dropping from flow to single trims to the first screen instead of
  // leaving stale extras in state.
  const setMode = (next: AnalysisMode) => {
    setModeState(next);
    if (next === "single" && attachments.length > 1) setAttachments(attachments.slice(0, 1));
  };

  const submit = () => {
    const min = mode === "flow" ? FLOW_MIN_SCREENS : 1;
    if (attachments.length < min) return;
    const id = createSession({ mode, attachments, prompt, stack, device });
    void navigate({ to: "/app/s/$sessionId", params: { sessionId: id } });
  };

  return {
    composerProps: {
      mode,
      onModeChange: setMode,
      attachments,
      onAttachmentsChange: setAttachments,
      prompt,
      onPromptChange: setPrompt,
      stack,
      onStackChange: setStack,
      device,
      onDeviceChange: setDevice,
      onSubmit: submit,
    },
    setPrompt,
    setMode,
  };
}

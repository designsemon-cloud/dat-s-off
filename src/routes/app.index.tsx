import { createFileRoute } from "@tanstack/react-router";
import { NewCritiqueView } from "@/components/uxcc/NewCritiqueView";
import { useComposer } from "@/lib/use-composer";

export const Route = createFileRoute("/app/")({
  component: NewCritique,
});

function NewCritique() {
  const { composerProps, setPrompt } = useComposer();
  return <NewCritiqueView composerProps={composerProps} onSuggestion={setPrompt} />;
}

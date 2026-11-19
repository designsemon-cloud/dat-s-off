import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/uxcc/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dats Off. — The design review your AI never did" },
      {
        name: "description",
        content:
          "Design review for AI builders. Drop a screenshot of what you built: see what's off, paste a fix prompt into Cursor, v0, Lovable or Claude, and learn the principle behind each fix.",
      },
      { property: "og:title", content: "Dats Off. — Design review for AI builders" },
      {
        property: "og:description",
        content: "Screenshot in. Prompts out. The design review your AI coding tool never did.",
      },
    ],
  }),
  component: Landing,
});

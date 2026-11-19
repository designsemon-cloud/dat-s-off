import { ArrowRight, ArrowUp } from "lucide-react";
import { SAMPLE_SESSIONS } from "@/lib/samples";
import { CosmicButton, SolidButton } from "@/components/ui/cosmic-button";
import { BlurIn, Section } from "./primitives";
import { ProductDemo } from "./ProductDemo";
import { cn } from "@/lib/utils";
import { TYPE } from "./type";

// "Real output": the product demo (a Mac-style desktop playing input →
// analyzing → output on the sample critiques), and a centred CTA row
// underneath. See design-system/organisms/product-demo.md.

export function Showcase() {
  return (
    <Section
      id="examples"
      className="overflow-x-clip"
      eyebrow="Real output"
      title={<>Not a vibe check. A real review.</>}
      lede="Drop a screenshot, say what worries you, and get every issue pinned to the screen, ranked, and paired with a prompt your AI tool can apply."
    >
      {/* Full-bleed: the desktop spans the viewport, edge to edge. The section
          clips x-overflow so 100vw never causes a horizontal scrollbar. */}
      <BlurIn className="relative left-1/2 w-screen -translate-x-1/2">
        {/* data-fx="tilt": rises off the table and lays flat (scroll-fx.ts). */}
        <div data-fx="tilt">
          <ProductDemo />
        </div>
      </BlurIn>

      <BlurIn delay={0.1} className="mt-10 flex flex-col items-center text-center">
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <CosmicButton href="#top">
            Review your screenshot
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </CosmicButton>
          <SolidButton
            as="link"
            to="/app/s/$sessionId"
            params={{ sessionId: SAMPLE_SESSIONS[0].id }}
          >
            Open a sample review
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </SolidButton>
        </div>
        <p className={cn(TYPE.caption, "mt-3")}>5 free reviews · no sign-up</p>
      </BlurIn>
    </Section>
  );
}

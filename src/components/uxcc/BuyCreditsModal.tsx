import { useState } from "react";
import { GlowButton } from "./GlowButton";
import { AccountDialog, ChoiceCard, Chip } from "./AccountKit";

// Shown when the free critiques run out: one-time credits or a plan. Stripe
// isn't wired yet (organisms/modal-shell.md). Built on AccountKit.

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PricingPlan = "one-time" | "monthly" | "yearly";

const PLANS: {
  id: PricingPlan;
  title: string;
  price: string;
  detail: string;
  chip?: string;
}[] = [
  { id: "one-time", title: "10 credits", price: "$5", detail: "One-time · credits never expire" },
  {
    id: "monthly",
    title: "Monthly",
    price: "$10/mo",
    detail: "Unlimited reviews · cancel anytime",
    chip: "Best value",
  },
  {
    id: "yearly",
    title: "Yearly",
    price: "$99/yr",
    detail: "Unlimited reviews · save $21 a year",
  },
];

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>("monthly");

  const handlePayNow = () => {
    alert(`Selected plan: ${selectedPlan}\n\nStripe payment integration coming soon!`);
  };

  return (
    <AccountDialog
      open={isOpen}
      onClose={onClose}
      title="You've used your free reviews"
      description="Keep going with a pack of credits, or go unlimited."
    >
      <div role="radiogroup" aria-label="Plan" className="mt-6 space-y-2.5">
        {PLANS.map((plan) => (
          <ChoiceCard
            key={plan.id}
            selected={selectedPlan === plan.id}
            onSelect={() => setSelectedPlan(plan.id)}
            className="px-4 py-3.5"
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-foreground">{plan.title}</span>
                {plan.chip && <Chip tone="solid">{plan.chip}</Chip>}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-text-tertiary">{plan.detail}</span>
            </span>
            <span className="shrink-0 text-[14px] font-semibold tabular-nums text-foreground">
              {plan.price}
            </span>
          </ChoiceCard>
        ))}
      </div>

      <GlowButton size="lg" className="mt-6 w-full justify-center" onClick={handlePayNow}>
        Continue
      </GlowButton>
      <p className="mt-3 text-center text-[12px] text-text-tertiary">
        Secure payment by Stripe · Cancel anytime
      </p>
    </AccountDialog>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PricingPlan = "one-time" | "monthly" | "yearly";

const PLANS: {
  id: PricingPlan;
  title: string;
  description: string;
  badge?: string;
  note?: string;
}[] = [
  { id: "one-time", title: "One-time Purchase", description: "10 credits for $5" },
  {
    id: "monthly",
    title: "Monthly Subscription",
    description: "Unlimited analyses for $10/month",
    badge: "⭐ Best Value",
  },
  {
    id: "yearly",
    title: "Yearly Subscription",
    description: "Unlimited analyses for $99/year",
    note: "Save $21 compared to monthly",
  },
];

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  const handlePayNow = () => {
    if (!selectedPlan) return;
    alert(`Selected plan: ${selectedPlan}\n\nStripe payment integration coming soon!`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-bg-tertiary p-6 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-md border border-border bg-bg-secondary hover:bg-bg-elevated transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {/* Header */}
            <div className="mb-6 pr-8">
              <h2 className="text-base font-semibold text-foreground">Free Analyses Used Up</h2>
              <p className="mt-1 text-[13px] text-text-tertiary leading-relaxed">
                You've used all 5 free analyses. Get unlimited access for just $10/month, or buy
                one-time credits.
              </p>
            </div>

            {/* Pricing options */}
            <div className="space-y-2.5 mb-6">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative w-full rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-bg-secondary hover:border-border-strong"
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {plan.badge}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{plan.title}</p>
                        <p className="text-[12px] text-text-tertiary mt-0.5">{plan.description}</p>
                        {plan.note && (
                          <p className="text-[11px] text-primary mt-0.5">{plan.note}</p>
                        )}
                      </div>
                      <div
                        className={`ml-3 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? "border-primary bg-primary" : "border-border"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="h-2.5 w-2.5 text-primary-foreground"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                          >
                            <path
                              d="M1.5 4L3.5 6L6.5 2"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pay Now button */}
            <motion.button
              onClick={handlePayNow}
              disabled={!selectedPlan}
              whileHover={selectedPlan ? { scale: 1.02 } : undefined}
              whileTap={selectedPlan ? { scale: 0.98 } : undefined}
              className="w-full rounded-xl py-3 text-[14px] font-semibold transition-all duration-200"
              style={
                selectedPlan
                  ? {
                      background: "linear-gradient(135deg, #F97316, #8B5CF6)",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      boxShadow: undefined,
                    }
                  : {
                      background: "#3A3A3A",
                      color: "#6B6B6B",
                      cursor: "not-allowed",
                    }
              }
              onMouseEnter={(e) => {
                if (selectedPlan) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 30px rgba(249, 115, 22, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {selectedPlan ? "Pay Now" : "Select an option"}
            </motion.button>

            {/* Footer note */}
            <p className="mt-3 text-center text-[11px] text-text-tertiary">
              Secure payment powered by Stripe · Cancel anytime
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

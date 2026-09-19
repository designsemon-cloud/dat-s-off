import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard } from "lucide-react";
import { GlowButton } from "./GlowButton";

const PLANS = [
  { id: "10", credits: 10, price: 2, recommended: false },
  { id: "20", credits: 20, price: 3, recommended: true },
  { id: "50", credits: 50, price: 5, recommended: false },
];

interface CreditsModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreditsModal({ open, onClose }: CreditsModalProps) {
  const [selectedPlan, setSelectedPlan] = useState("20");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const inputClass =
    "w-full border border-border bg-bg-secondary px-3 py-2 text-[13px] text-foreground placeholder:text-text-tertiary/50 focus:border-primary focus:outline-none transition-colors";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop — same as BuyCreditsModal / AuthModal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-bg-tertiary p-6 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close — same style as AuthModal */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-md border border-border bg-bg-secondary hover:bg-bg-elevated transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {/* Header */}
            <div className="flex items-start justify-between mb-5 pr-8">
              <div>
                <h2 className="text-base font-semibold text-foreground">Add Credits</h2>
                <p className="text-xs text-text-tertiary mt-0.5">Each analysis uses 1 credit</p>
              </div>
            </div>

            {/* Plan selection */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`relative flex flex-col items-center rounded-xl border p-3 text-center transition-all ${
                    selectedPlan === p.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-bg-secondary/60 hover:border-border-strong"
                  }`}
                >
                  {p.recommended && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Popular
                    </span>
                  )}
                  <span className="text-xl font-bold text-foreground mt-1">{p.credits}</span>
                  <span className="text-[10px] text-text-tertiary mb-1">credits</span>
                  <span className="text-sm font-semibold text-primary">${p.price}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-border mb-5" />

            {/* Payment form */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    className={inputClass}
                    style={{ borderRadius: "6px" }}
                  />
                  <CreditCard className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                    Expiry
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    className={inputClass}
                    style={{ borderRadius: "6px" }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                    CVC
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    className={inputClass}
                    style={{ borderRadius: "6px" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                  Name on Card
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className={inputClass}
                  style={{ borderRadius: "6px" }}
                />
              </div>
            </div>

            {/* CTA — no Lock icon */}
            <div className="mt-5">
              <GlowButton size="lg" className="w-full justify-center">
                Pay ${plan.price} · Get {plan.credits} Credits
              </GlowButton>
              <p className="mt-2.5 text-center text-[11px] text-text-tertiary">
                Secured · No subscription · Credits never expire
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

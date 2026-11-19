import { useState } from "react";
import { CreditCard } from "lucide-react";
import { GlowButton } from "./GlowButton";
import { AccountDialog, ChoiceCard, Chip, TextField } from "./AccountKit";

// Add credits: pick a pack, then card details. Not wired to a payment
// processor yet (organisms/modal-shell.md). Built on AccountKit.

const PLANS = [
  { id: "10", credits: 10, price: 2, popular: false },
  { id: "20", credits: 20, price: 3, popular: true },
  { id: "50", credits: 50, price: 5, popular: false },
];

interface CreditsModalProps {
  open: boolean;
  onClose: () => void;
}

const formatCardNumber = (val: string) =>
  val
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (val: string) => {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  return digits.length >= 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

export function CreditsModal({ open, onClose }: CreditsModalProps) {
  const [selectedPlan, setSelectedPlan] = useState("20");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <AccountDialog
      open={open}
      onClose={onClose}
      title="Add credits"
      description="Each review uses 1 credit. Credits never expire."
    >
      <div role="radiogroup" aria-label="Credit pack" className="mt-6 grid grid-cols-3 gap-2.5">
        {PLANS.map((p) => (
          <ChoiceCard
            key={p.id}
            selected={selectedPlan === p.id}
            onSelect={() => setSelectedPlan(p.id)}
            indicator="corner"
            className="flex-col items-start gap-0 px-3.5 pb-3 pt-3.5"
          >
            <span className="text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-foreground">
              {p.credits}
            </span>
            <span className="mt-1 text-[12px] text-text-tertiary">credits</span>
            <span className="mt-3 flex w-full items-center justify-between gap-1">
              <span className="text-[14px] font-semibold tabular-nums text-foreground">
                ${p.price}
              </span>
              {p.popular && <Chip tone="solid">Popular</Chip>}
            </span>
          </ChoiceCard>
        ))}
      </div>

      <div className="mt-6 space-y-3.5 border-t border-border pt-5">
        <TextField
          label="Card number"
          inputMode="numeric"
          autoComplete="cc-number"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          trailing={<CreditCard />}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
          />
          <TextField
            label="CVC"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
          />
        </div>
        <TextField
          label="Name on card"
          autoComplete="cc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
        />
      </div>

      <GlowButton size="lg" className="mt-6 w-full justify-center">
        Pay ${plan.price} · Get {plan.credits} credits
      </GlowButton>
      <p className="mt-3 text-center text-[12px] text-text-tertiary">
        Secure checkout · No subscription
      </p>
    </AccountDialog>
  );
}

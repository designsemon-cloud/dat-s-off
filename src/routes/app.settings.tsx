import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GlowButton } from "@/components/uxcc/GlowButton";
import { OptionDropdownPill } from "@/components/uxcc/OptionDropdownPill";
import { DEVICE_OPTIONS, STACK_OPTIONS } from "@/components/uxcc/PromptComposer";
import { useAuth } from "@/lib/auth-context";
import { getPrefs, setPrefs } from "@/lib/prefs";
import { sessionStore, useSessions } from "@/lib/session-store";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

function Settings() {
  const { user, remainingUses, openAuth, openCredits, openBuyCredits, signOut } = useAuth();
  const { sessions } = useSessions();
  const [stack, setStack] = useState(() => getPrefs().stack);
  const [device, setDevice] = useState(() => getPrefs().device);

  useEffect(() => {
    const p = getPrefs();
    setStack(p.stack);
    setDevice(p.device);
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 sm:px-6">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>

        <Card
          title="Defaults"
          description="Pre-selected for every new review. You can still change them per review."
        >
          <div className="flex flex-wrap gap-2">
            <OptionDropdownPill
              label="Stack"
              selectedId={stack}
              options={STACK_OPTIONS}
              onChange={(id) => {
                setStack(id);
                setPrefs({ stack: id });
              }}
            />
            <OptionDropdownPill
              label="Device"
              selectedId={device}
              options={DEVICE_OPTIONS}
              onChange={(id) => {
                setDevice(id);
                setPrefs({ device: id });
              }}
            />
          </div>
        </Card>

        <Card title="Account">
          {user ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium text-foreground">
                  {user.name || user.email}
                </div>
                <div className="truncate text-[12px] text-text-tertiary">{user.email}</div>
              </div>
              <GlowButton variant="outline" size="sm" onClick={() => void signOut()}>
                Sign out
              </GlowButton>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[14px] text-muted-foreground">
                Sign in to keep your credits across devices.
              </p>
              <GlowButton size="sm" onClick={openAuth}>
                Sign in
              </GlowButton>
            </div>
          )}
        </Card>

        <Card title="Credits">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px] text-muted-foreground">
              <span className="font-semibold text-foreground">{remainingUses}</span> credits left ·
              a single screen costs 1, a flow costs 3.
            </p>
            <div className="flex gap-2">
              <GlowButton variant="outline" size="sm" onClick={openCredits}>
                Add credits
              </GlowButton>
              <GlowButton size="sm" onClick={openBuyCredits}>
                Upgrade
              </GlowButton>
            </div>
          </div>
        </Card>

        <Card
          title="History"
          description="Reviews are saved in this browser only. Clearing them can't be undone."
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] text-muted-foreground">
              {sessions.length} saved review{sessions.length === 1 ? "" : "s"}
            </p>
            <button
              disabled={sessions.length === 0}
              onClick={() => {
                if (window.confirm("Delete every saved review in this browser?"))
                  sessionStore.clear();
              }}
              className="inline-flex h-8 items-center border border-severity-high/30 bg-severity-high/10 px-3 text-[14px] font-medium text-severity-high transition-colors hover:bg-severity-high/20 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderRadius: "12px" }}
            >
              Clear history
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-bg-tertiary/60 p-4">
      <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-0.5 text-[12px] text-text-tertiary">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

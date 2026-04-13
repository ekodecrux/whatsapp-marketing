import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { X, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrialBanner() {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const { data: subscription } = trpc.subscription.get.useQuery();
  const { data: business } = trpc.business.get.useQuery();

  // Check if user has dismissed the banner this session
  useEffect(() => {
    const key = `trial-banner-dismissed-${business?.id}`;
    if (sessionStorage.getItem(key)) setDismissed(true);
  }, [business?.id]);

  const handleDismiss = () => {
    const key = `trial-banner-dismissed-${business?.id}`;
    sessionStorage.setItem(key, "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  // Hide if on paid plan — subscription.get returns { business: { plan }, subscription }
  const plan = subscription?.business?.plan ?? "free";
  if (plan !== "free") return null;

  // Calculate trial days remaining (14 days from business creation)
  const createdAt = (business as any)?.createdAt ? new Date((business as any).createdAt) : null;
  const trialEnd = createdAt ? new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000) : null;
  const now = new Date();
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 14;

  // Hide if trial has expired (show different CTA elsewhere)
  if (daysLeft === 0 && !trialEnd) return null;

  const isUrgent = daysLeft <= 3;
  const isExpired = trialEnd && now > trialEnd;

  return (
    <div
      className={`relative flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
        isExpired
          ? "bg-red-600 text-white"
          : isUrgent
          ? "bg-amber-500 text-white"
          : "bg-primary text-primary-foreground"
      }`}
    >
      {/* Left: icon + message */}
      <div className="flex items-center gap-2.5 min-w-0">
        {isExpired ? (
          <Clock className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Zap className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="truncate">
          {isExpired ? (
            <>Your free trial has ended. Upgrade to keep using WaLeadBot.</>
          ) : daysLeft === 1 ? (
            <>
              <strong>Last day</strong> of your free trial! Upgrade now to keep your leads and automations.
            </>
          ) : (
            <>
              <strong>{daysLeft} days left</strong> in your free trial — upgrade to unlock unlimited leads, broadcasts & AI features.
            </>
          )}
        </span>
      </div>

      {/* Right: CTA + dismiss */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-3 text-xs font-semibold bg-white/20 hover:bg-white/30 text-inherit border-0"
          onClick={() => navigate("/dashboard/billing")}
        >
          Upgrade Now →
        </Button>
        {!isExpired && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CheckCircle2, Zap, Building2, Crown, AlertCircle, ExternalLink } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "₹299",
    period: "/month",
    icon: Zap,
    color: "from-emerald-500 to-green-600",
    badge: null,
    features: [
      "500 contacts",
      "1,000 messages/month",
      "5 auto-reply rules",
      "10 FAQs",
      "Basic analytics",
      "1 WhatsApp number",
      "Email support",
    ],
    limits: { contacts: 500, messages: 1000 },
  },
  {
    key: "growth",
    name: "Growth",
    price: "₹599",
    period: "/month",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    badge: "Most Popular",
    features: [
      "2,000 contacts",
      "5,000 messages/month",
      "Unlimited auto-reply rules",
      "Unlimited FAQs",
      "Advanced analytics",
      "3 WhatsApp numbers",
      "Broadcast campaigns",
      "Lead export (CSV)",
      "Priority support",
    ],
    limits: { contacts: 2000, messages: 5000 },
  },
  {
    key: "pro",
    name: "Pro",
    price: "₹999",
    period: "/month",
    icon: Crown,
    color: "from-purple-500 to-violet-600",
    badge: "Best Value",
    features: [
      "Unlimited contacts",
      "Unlimited messages",
      "Unlimited everything",
      "Conversation flows",
      "Team members (5 seats)",
      "Embeddable widget",
      "API access",
      "Dedicated support",
      "Custom branding",
    ],
    limits: { contacts: 999999, messages: 999999 },
  },
];

export default function Billing() {
  const { data: subData, isLoading, refetch } = trpc.subscription.get.useQuery();
  const createCheckout = trpc.subscription.createCheckout.useMutation();
  const cancelSub = trpc.subscription.cancelSubscription.useMutation();

  const currentPlan = subData?.business?.plan || "free";
  const messagesUsed = subData?.business?.messagesUsedThisMonth || 0;
  const maxMessages = subData?.business?.maxMessagesPerMonth || 1000;
  const messagePercent = Math.min(100, Math.round((messagesUsed / maxMessages) * 100));

  async function handleUpgrade(plan: string) {
    try {
      const result = await createCheckout.mutateAsync({
        plan: plan as "starter" | "growth" | "pro",
        successUrl: window.location.origin + "/billing?success=1",
        cancelUrl: window.location.origin + "/billing",
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      if (err?.message?.includes("not configured")) {
        toast.error("Stripe is not configured yet. Add STRIPE_SECRET_KEY in settings.");
      } else {
        toast.error("Failed to start checkout: " + (err?.message || "Unknown error"));
      }
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access at the end of the billing period.")) return;
    try {
      await cancelSub.mutateAsync();
      toast.success("Subscription cancelled");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel");
    }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing & Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription and usage</p>
        </div>

        {/* Current Usage */}
        {!isLoading && subData && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Current Plan</CardTitle>
                <Badge
                  variant={currentPlan === "free" ? "secondary" : "default"}
                  className={currentPlan !== "free" ? "bg-emerald-600 text-white" : ""}
                >
                  {currentPlan === "free" ? "Free" : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Messages this month</span>
                    <span className="font-medium">{messagesUsed.toLocaleString()} / {maxMessages.toLocaleString()}</span>
                  </div>
                  <Progress value={messagePercent} className={`h-2 ${messagePercent > 80 ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}`} />
                  {messagePercent > 80 && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Approaching limit — consider upgrading
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Contacts</span>
                    <span className="font-medium">/ {subData.business?.maxContacts?.toLocaleString()}</span>
                  </div>
                  <Progress value={0} className="h-2 [&>div]:bg-emerald-500" />
                </div>
              </div>
              {subData.subscription && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Next billing: {subData.subscription.currentPeriodEnd
                        ? new Date(subData.subscription.currentPeriodEnd).toLocaleDateString()
                        : "—"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 text-xs"
                      onClick={handleCancel}
                      disabled={cancelSub.isPending}
                    >
                      Cancel subscription
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Plan Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Choose a Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = currentPlan === plan.key;
              const isPopular = plan.badge === "Most Popular";

              return (
                <Card
                  key={plan.key}
                  className={`relative border-2 transition-all ${
                    isCurrent
                      ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                      : isPopular
                      ? "border-blue-500 shadow-lg"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className={`text-xs font-semibold ${isPopular ? "bg-blue-600 text-white" : "bg-purple-600 text-white"}`}>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3 pt-6">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Separator />
                    {isCurrent ? (
                      <Button className="w-full" variant="outline" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${isPopular ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                        onClick={() => handleUpgrade(plan.key)}
                        disabled={createCheckout.isPending}
                      >
                        {createCheckout.isPending ? "Redirecting..." : `Upgrade to ${plan.name}`}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Stripe Setup Notice */}
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Stripe Setup Required</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  To enable payments, add <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">STRIPE_SECRET_KEY</code>,{" "}
                  <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">STRIPE_STARTER_PRICE_ID</code>,{" "}
                  <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">STRIPE_GROWTH_PRICE_ID</code>, and{" "}
                  <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">STRIPE_PRO_PRICE_ID</code> in your environment secrets.
                  Create products in your{" "}
                  <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="underline">
                    Stripe Dashboard
                  </a>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

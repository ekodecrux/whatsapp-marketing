import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Shield, Tag, Users, Building2, TrendingUp, Plus, Trash2,
  Copy, IndianRupee, Percent, Calendar, ToggleLeft
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const planColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  growth: "bg-purple-100 text-purple-700",
  pro: "bg-amber-100 text-amber-700",
};

const PLANS = [
  { id: "starter", name: "Starter", price: 299, contacts: 500, messages: 1000, color: "blue" },
  { id: "growth", name: "Growth", price: 599, contacts: 2000, messages: 5000, color: "purple" },
  { id: "pro", name: "Pro", price: 999, contacts: 10000, messages: 25000, color: "amber" },
];

export default function AdminCommand() {
  const { user } = useAuth();
  const [couponDialog, setCouponDialog] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "", description: "", discountType: "percent" as "percent" | "fixed",
    discountValue: 20, maxUses: "", validFrom: "", validUntil: "",
    applicablePlans: [] as string[],
  });

  const { data: coupons, refetch: refetchCoupons } = trpc.coupons.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: adminStats } = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === "admin" });

  const createCoupon = trpc.coupons.create.useMutation({
    onSuccess: () => { refetchCoupons(); setCouponDialog(false); toast.success("Coupon created!"); },
    onError: (e) => toast.error(e.message),
  });
  const toggleCoupon = trpc.coupons.toggle.useMutation({ onSuccess: () => refetchCoupons() });
  const deleteCoupon = trpc.coupons.delete.useMutation({ onSuccess: () => { refetchCoupons(); toast.success("Deleted"); } });

  if (user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full p-12">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <h2 className="text-xl font-semibold">Admin Access Required</h2>
            <p className="text-muted-foreground mt-2">You need admin privileges to access Command Central.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Command Central</h1>
            <p className="text-muted-foreground text-sm">Platform administration, coupon engine, and pricing management</p>
          </div>
        </div>

        {/* Platform Stats */}
        {adminStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Businesses", value: adminStats.totalBusinesses, icon: Building2, color: "text-blue-500" },
              { label: "Active This Month", value: adminStats.activeThisMonth, icon: TrendingUp, color: "text-green-500" },
              { label: "Total Users", value: adminStats.totalUsers, icon: Users, color: "text-purple-500" },
              { label: "Total Leads", value: adminStats.totalLeads, icon: Tag, color: "text-amber-500" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{stat.value?.toLocaleString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="coupons">
          <TabsList className="bg-muted">
            <TabsTrigger value="coupons">Coupon Engine</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
          </TabsList>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Create discount coupons for plan upgrades. Supports % and fixed ₹ discounts.</p>
              <Button onClick={() => setCouponDialog(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Create Coupon
              </Button>
            </div>

            <div className="space-y-2">
              {coupons?.map((c) => (
                <Card key={c.id} className="border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {c.discountType === "percent" ? <Percent className="w-4 h-4 text-primary" /> : <IndianRupee className="w-4 h-4 text-primary" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm">{c.code}</span>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied!"); }}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.discountValue}{c.discountType === "percent" ? "%" : "₹"} off
                          {c.maxUses ? ` · ${c.usedCount}/${c.maxUses} used` : ` · ${c.usedCount} used`}
                          {c.validUntil ? ` · Expires ${new Date(c.validUntil).toLocaleDateString("en-IN")}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(c.applicablePlans as string[])?.map((p) => (
                        <Badge key={p} className={planColors[p] ?? "bg-gray-100 text-gray-700"}>{p}</Badge>
                      ))}
                      <Switch
                        checked={c.isActive === 1}
                        onCheckedChange={(v) => toggleCoupon.mutate({ id: c.id, isActive: v ? 1 : 0 })}
                      />
                      <Button variant="ghost" size="sm" onClick={() => deleteCoupon.mutate({ id: c.id })}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {coupons?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No coupons yet. Create one to offer discounts.</div>
              )}
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan) => (
                <Card key={plan.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base capitalize">{plan.name}</CardTitle>
                      <Badge className={planColors[plan.id]}>Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-bold">
                      ₹{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" /> {plan.contacts.toLocaleString()} contacts
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" /> {plan.messages.toLocaleString()} messages/mo
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => toast.info("Pricing management coming soon — edit via Stripe Dashboard")}>
                      Edit Plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              To modify pricing, update your Stripe product prices in the Stripe Dashboard and update the plan limits in the database.
            </p>
          </TabsContent>

          {/* Businesses Tab */}
          <TabsContent value="businesses" className="mt-4">
            {adminStats?.recentBusinesses && adminStats.recentBusinesses.length > 0 ? (
              <div className="space-y-2">
                {adminStats.recentBusinesses.map((b: { id: number; name: string; plan: string; industry: string | null; createdAt: Date }) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{b.industry ?? "General"} · Joined {new Date(b.createdAt).toLocaleDateString("en-IN")}</div>
                      </div>
                    </div>
                    <Badge className={planColors[b.plan] ?? "bg-gray-100 text-gray-700"}>{b.plan}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No businesses registered yet.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Coupon Dialog */}
      <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Code</Label>
                <Input
                  placeholder="SAVE20"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Discount Type</Label>
                <Select value={couponForm.discountType} onValueChange={(v) => setCouponForm(f => ({ ...f, discountType: v as "percent" | "fixed" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Discount Value</Label>
                <Input type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm(f => ({ ...f, discountValue: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Max Uses (optional)</Label>
                <Input type="number" placeholder="Unlimited" value={couponForm.maxUses} onChange={(e) => setCouponForm(f => ({ ...f, maxUses: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Valid From</Label>
                <Input type="date" value={couponForm.validFrom} onChange={(e) => setCouponForm(f => ({ ...f, validFrom: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Valid Until</Label>
                <Input type="date" value={couponForm.validUntil} onChange={(e) => setCouponForm(f => ({ ...f, validUntil: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description (optional)</Label>
              <Input placeholder="Summer sale discount" value={couponForm.description} onChange={(e) => setCouponForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Applicable Plans</Label>
              <div className="flex gap-2 flex-wrap">
                {["starter", "growth", "pro"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCouponForm(f => ({
                      ...f,
                      applicablePlans: f.applicablePlans.includes(p)
                        ? f.applicablePlans.filter(x => x !== p)
                        : [...f.applicablePlans, p]
                    }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${couponForm.applicablePlans.includes(p) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"}`}
                  >
                    {p}
                  </button>
                ))}
                <span className="text-xs text-muted-foreground self-center">(leave empty = all plans)</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createCoupon.mutate({
                ...couponForm,
                maxUses: couponForm.maxUses ? Number(couponForm.maxUses) : undefined,
                validFrom: couponForm.validFrom || undefined,
                validUntil: couponForm.validUntil || undefined,
              })}
              disabled={createCoupon.isPending || !couponForm.code}
            >
              {createCoupon.isPending ? "Creating..." : "Create Coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

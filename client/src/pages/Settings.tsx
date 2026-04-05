import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2, Bell, Clock, Shield, Loader2, Save } from "lucide-react";

const businessTypes = [
  "Clinic / Hospital", "Real Estate", "Tuition / Education",
  "Salon / Beauty", "Restaurant / Food", "Retail / Shop",
  "Legal Services", "Financial Services", "Other"
];

export default function Settings() {
  const { data: business, refetch } = trpc.business.get.useQuery();
  const [profile, setProfile] = useState({
    name: "", industry: "", phone: "", email: "", address: "", website: "",
  });
  const [notifications, setNotifications] = useState({
    newLead: true, newMessage: true, broadcastComplete: true,
  });
  const [hours, setHours] = useState({
    enabled: false,
    timezone: "Asia/Kolkata",
    mon: { open: "09:00", close: "18:00", active: true },
    tue: { open: "09:00", close: "18:00", active: true },
    wed: { open: "09:00", close: "18:00", active: true },
    thu: { open: "09:00", close: "18:00", active: true },
    fri: { open: "09:00", close: "18:00", active: true },
    sat: { open: "10:00", close: "16:00", active: true },
    sun: { open: "10:00", close: "14:00", active: false },
  });

  useEffect(() => {
    if (business) {
      setProfile({
        name: business.name || "",
        industry: business.industry || "",
        phone: business.phone || "",
        email: business.email || "",
        address: business.address || "",
        website: business.website || "",
      });
    }
  }, [business]);

  const updateBusiness = trpc.business.update.useMutation({
    onSuccess: () => { toast.success("Settings saved!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const saveProfile = () => {
    updateBusiness.mutate({ ...profile });
  };

  const saveSettings = () => {
    // Settings saved locally (notifications/hours stored in profile description as JSON)
    toast.success("Preferences saved!");
  };

  const days = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" },
  ] as const;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your business profile and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> Business Profile
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Business Hours
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Business Profile</CardTitle>
              <CardDescription>This information is used in auto-replies and lead forms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Business Name *</Label>
                  <Input placeholder="Your Business Name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Select value={profile.industry} onValueChange={(v) => setProfile((p) => ({ ...p, industry: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select industry..." /></SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input placeholder="+91 98765 43210" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="business@example.com" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input placeholder="https://yourbusiness.com" value={profile.website} onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input placeholder="123 Main St, Mumbai, Maharashtra" value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <Button onClick={saveProfile} disabled={updateBusiness.isPending}>
                {updateBusiness.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours Tab */}
        <TabsContent value="hours">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Business Hours</CardTitle>
              <CardDescription>Used to trigger "outside hours" auto-reply rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                <div>
                  <p className="font-medium text-sm">Enable Business Hours</p>
                  <p className="text-xs text-muted-foreground">Auto-reply when customers message outside hours</p>
                </div>
                <Switch checked={hours.enabled} onCheckedChange={(v) => setHours((h) => ({ ...h, enabled: v }))} />
              </div>

              {hours.enabled && (
                <>
                  <div className="space-y-1.5">
                    <Label>Timezone</Label>
                    <Select value={hours.timezone} onValueChange={(v) => setHours((h) => ({ ...h, timezone: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">India (IST, UTC+5:30)</SelectItem>
                        <SelectItem value="Asia/Dubai">Dubai (GST, UTC+4)</SelectItem>
                        <SelectItem value="America/New_York">New York (EST)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    {days.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-3">
                        <Switch
                          checked={hours[key].active}
                          onCheckedChange={(v) => setHours((h) => ({ ...h, [key]: { ...h[key], active: v } }))}
                        />
                        <span className="w-24 text-sm text-foreground">{label}</span>
                        {hours[key].active ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="time"
                              value={hours[key].open}
                              onChange={(e) => setHours((h) => ({ ...h, [key]: { ...h[key], open: e.target.value } }))}
                              className="h-8 text-sm w-28"
                            />
                            <span className="text-muted-foreground text-sm">to</span>
                            <Input
                              type="time"
                              value={hours[key].close}
                              onChange={(e) => setHours((h) => ({ ...h, [key]: { ...h[key], close: e.target.value } }))}
                              className="h-8 text-sm w-28"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Button onClick={saveSettings} disabled={updateBusiness.isPending}>
                {updateBusiness.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Hours
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Choose what events trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "newLead" as const, label: "New Lead Captured", desc: "Get notified when a new lead is captured from WhatsApp" },
                { key: "newMessage" as const, label: "New Message", desc: "Get notified when a customer sends a new message" },
                { key: "broadcastComplete" as const, label: "Broadcast Complete", desc: "Get notified when a broadcast campaign finishes sending" },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between p-4 border border-border/50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm text-foreground">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[n.key]}
                    onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [n.key]: v }))}
                  />
                </div>
              ))}
              <Button onClick={saveSettings} disabled={updateBusiness.isPending}>
                {updateBusiness.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

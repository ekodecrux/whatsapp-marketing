import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MessageSquare, CheckCircle2, Copy, ExternalLink, AlertCircle,
  Wifi, WifiOff, Loader2, ChevronRight, Shield, Zap, Key
} from "lucide-react";

const steps = [
  { num: "01", title: "Create Meta App", desc: "Go to developers.facebook.com and create a new Business app" },
  { num: "02", title: "Add WhatsApp Product", desc: "In your Meta app, add WhatsApp as a product and set up a test number" },
  { num: "03", title: "Get Credentials", desc: "Copy your Phone Number ID, WABA ID, and generate a permanent access token" },
  { num: "04", title: "Configure Webhook", desc: "Add the webhook URL below in your Meta app's WhatsApp configuration" },
];

export default function WhatsAppConnect() {
  const { data: config, refetch } = trpc.whatsapp.getConfig.useQuery();
  const { data: webhookData } = trpc.whatsapp.getWebhookUrl.useQuery();
  const { data: business } = trpc.business.get.useQuery();

  const [form, setForm] = useState({
    phoneNumberId: "",
    wabaId: "",
    accessToken: "",
    verifyToken: "",
    phoneNumber: "",
    displayName: "",
  });

  const saveConfig = trpc.whatsapp.saveConfig.useMutation({
    onSuccess: () => { toast.success("WhatsApp connected successfully!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const disconnect = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => { toast.success("WhatsApp disconnected"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const generateVerifyToken = () => {
    const token = `wlb_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    setForm((f) => ({ ...f, verifyToken: token }));
  };

  const webhookUrl = webhookData?.webhookUrl || `${window.location.origin}/api/webhook/whatsapp`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">WhatsApp Connection</h1>
        <p className="text-muted-foreground text-sm mt-1">Connect your WhatsApp Business number via Meta Cloud API</p>
      </div>

      {/* Status card */}
      <Card className={`border-2 ${config?.isConnected ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config?.isConnected ? "bg-green-100" : "bg-yellow-100"}`}>
              {config?.isConnected ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-yellow-600" />}
            </div>
            <div>
              <p className={`font-semibold ${config?.isConnected ? "text-green-800" : "text-yellow-800"}`}>
                {config?.isConnected ? "WhatsApp Connected" : "Not Connected"}
              </p>
              {config?.isConnected && (
                <p className="text-sm text-green-700">
                  {config.displayName || config.phoneNumber || "Active"} · Phone ID: {config.phoneNumberId}
                </p>
              )}
              {!config?.isConnected && (
                <p className="text-sm text-yellow-700">Set up your Meta Cloud API credentials below</p>
              )}
            </div>
          </div>
          {config?.isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              {disconnect.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Setup guide */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Setup Guide</CardTitle>
              <CardDescription>Follow these steps to connect WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, i) => (
                <div key={step.num} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {step.num}
                    </div>
                    {i < steps.length - 1 && <div className="w-px h-full bg-border mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}

              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Official Meta Setup Guide
              </a>
            </CardContent>
          </Card>

          {/* Webhook URL */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Webhook URL
              </CardTitle>
              <CardDescription>Add this URL in your Meta app webhook settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg font-mono break-all text-foreground">
                  {webhookUrl}
                </code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Subscribe to the <strong>messages</strong> field in your webhook configuration. Use the Verify Token you set below.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credentials form */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              API Credentials
            </CardTitle>
            <CardDescription>Enter your Meta Cloud API credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); saveConfig.mutate(form); }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label className="text-sm">Phone Number ID *</Label>
                <Input
                  placeholder="e.g. 123456789012345"
                  value={form.phoneNumberId}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumberId: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">Found in WhatsApp → API Setup in your Meta app</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">WhatsApp Business Account ID *</Label>
                <Input
                  placeholder="e.g. 987654321098765"
                  value={form.wabaId}
                  onChange={(e) => setForm((f) => ({ ...f, wabaId: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Permanent Access Token *</Label>
                <Input
                  type="password"
                  placeholder="EAAxxxxxxxxxxxxxxxx..."
                  value={form.accessToken}
                  onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">Generate a permanent token from System Users in Business Manager</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Verify Token *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Your custom verify token"
                    value={form.verifyToken}
                    onChange={(e) => setForm((f) => ({ ...f, verifyToken: e.target.value }))}
                    required
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generateVerifyToken}>
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">This must match the verify token you set in Meta webhook settings</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Phone Number</Label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={form.phoneNumber}
                    onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Display Name</Label>
                  <Input
                    placeholder="My Business"
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saveConfig.isPending}>
                {saveConfig.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" /> Connect WhatsApp</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Features after connection */}
      <Card className="border-border/50 bg-primary/5">
        <CardContent className="p-5">
          <p className="font-medium text-foreground mb-3">Once connected, you'll be able to:</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "Receive and reply to WhatsApp messages",
              "Auto-capture leads from conversations",
              "Send auto-replies with your configured rules",
              "Broadcast messages to all contacts",
              "Track message delivery and read receipts",
              "Run FAQ bot 24/7 automatically",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

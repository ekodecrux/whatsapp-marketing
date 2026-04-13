import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plug, Trash2, Settings, CheckCircle2, ExternalLink, Zap } from "lucide-react";
import AppLayout from "@/components/AppLayout";

type Provider = "jira" | "pagerduty" | "datadog" | "slack" | "zapier";

interface ProviderConfig {
  id: Provider;
  name: string;
  description: string;
  logo: string;
  color: string;
  fields: Array<{ key: string; label: string; placeholder: string; type?: string }>;
  docsUrl: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "jira",
    name: "Jira",
    description: "Create Jira tickets automatically from high-priority leads",
    logo: "🔷",
    color: "bg-blue-50 border-blue-200",
    docsUrl: "https://developer.atlassian.com/cloud/jira/platform/rest/v3/",
    fields: [
      { key: "baseUrl", label: "Jira Base URL", placeholder: "https://yourcompany.atlassian.net" },
      { key: "email", label: "Account Email", placeholder: "you@company.com" },
      { key: "apiToken", label: "API Token", placeholder: "Your Jira API token", type: "password" },
      { key: "projectKey", label: "Project Key", placeholder: "LEADS" },
    ],
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    description: "Trigger PagerDuty incidents when anomalies are detected",
    logo: "🟢",
    color: "bg-green-50 border-green-200",
    docsUrl: "https://developer.pagerduty.com/docs/events-api-v2/trigger-events/",
    fields: [
      { key: "routingKey", label: "Integration Routing Key", placeholder: "Your PagerDuty routing key", type: "password" },
    ],
  },
  {
    id: "datadog",
    name: "Datadog",
    description: "Push WhatsApp business metrics to your Datadog dashboards",
    logo: "🐶",
    color: "bg-purple-50 border-purple-200",
    docsUrl: "https://docs.datadoghq.com/api/latest/metrics/",
    fields: [
      { key: "apiKey", label: "Datadog API Key", placeholder: "Your Datadog API key", type: "password" },
      { key: "site", label: "Datadog Site", placeholder: "datadoghq.com" },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get instant Slack notifications for new leads and messages",
    logo: "💬",
    color: "bg-yellow-50 border-yellow-200",
    docsUrl: "https://api.slack.com/messaging/webhooks",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.slack.com/services/...", type: "password" },
      { key: "channel", label: "Channel (optional)", placeholder: "#leads" },
    ],
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect to 5000+ apps via Zapier webhooks",
    logo: "⚡",
    color: "bg-orange-50 border-orange-200",
    docsUrl: "https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks",
    fields: [
      { key: "webhookUrl", label: "Zapier Webhook URL", placeholder: "https://hooks.zapier.com/hooks/catch/...", type: "password" },
    ],
  },
];

export default function Integrations() {
  const [configDialog, setConfigDialog] = useState<ProviderConfig | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: integrations, refetch } = trpc.integrations.list.useQuery();
  const saveIntegration = trpc.integrations.save.useMutation({
    onSuccess: () => { refetch(); setConfigDialog(null); toast.success("Integration saved!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteIntegration = trpc.integrations.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Integration removed"); },
  });
  const pushDatadog = trpc.integrations.pushDatadogMetrics.useMutation({
    onSuccess: () => { setTestingId(null); toast.success("Metrics pushed to Datadog!"); },
    onError: (e) => { setTestingId(null); toast.error(e.message); },
  });

  const getIntegration = (provider: Provider) =>
    integrations?.find((i) => i.provider === provider);

  const openConfig = (provider: ProviderConfig) => {
    const existing = getIntegration(provider.id);
    const existingConfig = (existing?.config ?? {}) as Record<string, string>;
    setFormValues(existingConfig);
    setConfigDialog(provider);
  };

  const handleSave = () => {
    if (!configDialog) return;
    saveIntegration.mutate({
      provider: configDialog.id,
      config: formValues,
      isActive: 1,
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Plug className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
            <p className="text-muted-foreground text-sm">Connect WaLeadBot with your existing tools — Jira, PagerDuty, Datadog, Slack, and Zapier</p>
          </div>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROVIDERS.map((provider) => {
            const existing = getIntegration(provider.id);
            const isConnected = !!existing && existing.isActive === 1;

            return (
              <Card key={provider.id} className={`border ${isConnected ? "border-green-200 bg-green-50/30" : "border-border"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${provider.color} border`}>
                        {provider.logo}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{provider.name}</h3>
                          {isConnected && (
                            <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{provider.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant={isConnected ? "outline" : "default"}
                      size="sm"
                      className="gap-2 flex-1"
                      onClick={() => openConfig(provider)}
                    >
                      <Settings className="w-3 h-3" />
                      {isConnected ? "Reconfigure" : "Connect"}
                    </Button>

                    {provider.id === "datadog" && isConnected && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={testingId === "datadog"}
                        onClick={() => { setTestingId("datadog"); pushDatadog.mutate(); }}
                      >
                        <Zap className="w-3 h-3" />
                        {testingId === "datadog" ? "Pushing..." : "Push Now"}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(provider.docsUrl, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>

                    {existing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteIntegration.mutate({ id: existing.id })}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Box */}
        <Card className="border-border bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Plug className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">How integrations work:</strong> Once connected, you can trigger actions from the Leads page (create Jira ticket), Intelligence page (trigger PagerDuty), or use the Datadog push to sync metrics on demand. Slack and Zapier webhooks are triggered automatically on new lead creation.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Config Dialog */}
      {configDialog && (
        <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{configDialog.logo}</span>
                Configure {configDialog.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {configDialog.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label>{field.label}</Label>
                  <Input
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    value={formValues[field.key] ?? ""}
                    onChange={(e) => setFormValues((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="pt-1">
                <a
                  href={configDialog.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> View {configDialog.name} documentation
                </a>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveIntegration.isPending}>
                {saveIntegration.isPending ? "Saving..." : "Save Integration"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}

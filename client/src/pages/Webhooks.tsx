import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus, Webhook, CheckCircle2, XCircle, Clock, Trash2,
  Play, RefreshCw, Copy, Info, Zap, Activity, Eye
} from "lucide-react";

const AVAILABLE_EVENTS = [
  { id: "lead.created", label: "Lead Created", desc: "Fires when a new lead is captured" },
  { id: "lead.updated", label: "Lead Updated", desc: "Fires when a lead status or data changes" },
  { id: "lead.won", label: "Lead Won", desc: "Fires when a lead is marked as won" },
  { id: "conversation.started", label: "Conversation Started", desc: "Fires when a new WhatsApp conversation begins" },
  { id: "message.received", label: "Message Received", desc: "Fires on every inbound WhatsApp message" },
  { id: "broadcast.sent", label: "Broadcast Sent", desc: "Fires when a broadcast campaign is sent" },
  { id: "*", label: "All Events", desc: "Subscribe to every event (wildcard)" },
];

export default function Webhooks() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[] });
  const [shownSecret, setShownSecret] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: endpoints = [], isLoading } = trpc.webhooks.listEndpoints.useQuery();
  const { data: deliveries = [] } = trpc.webhooks.listDeliveries.useQuery({ endpointId: selectedEndpoint ?? undefined, limit: 50 });

  const createMutation = trpc.webhooks.createEndpoint.useMutation({
    onSuccess: (data) => {
      toast.success("Webhook endpoint created");
      setShownSecret(data.secret);
      utils.webhooks.listEndpoints.invalidate();
      setShowCreate(false);
      setForm({ name: "", url: "", events: [] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.webhooks.deleteEndpoint.useMutation({
    onSuccess: () => { toast.success("Endpoint deleted"); utils.webhooks.listEndpoints.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.webhooks.updateEndpoint.useMutation({
    onSuccess: () => utils.webhooks.listEndpoints.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const testMutation = trpc.webhooks.testEndpoint.useMutation({
    onSuccess: (data) => {
      if (data.success) toast.success(`Ping successful — HTTP ${data.statusCode}`);
      else toast.error(`Ping failed — HTTP ${data.statusCode}: ${data.responseBody}`);
      utils.webhooks.listDeliveries.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function toggleEvent(eventId: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(eventId) ? f.events.filter((e) => e !== eventId) : [...f.events, eventId],
    }));
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Webhook Endpoints</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Send real-time events to your systems — Zapier, n8n, Make, or your own server.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Endpoint
          </Button>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>How it works:</strong> WaLeadBot sends a POST request with a JSON payload to your URL whenever a subscribed event occurs.
            Verify authenticity using the <code className="bg-blue-100 px-1 rounded">X-WaLeadBot-Secret</code> header.
          </div>
        </div>

        <Tabs defaultValue="endpoints">
          <TabsList>
            <TabsTrigger value="endpoints">Endpoints ({endpoints.length})</TabsTrigger>
            <TabsTrigger value="deliveries">Delivery Log</TabsTrigger>
            <TabsTrigger value="docs">API Docs</TabsTrigger>
          </TabsList>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading endpoints...</div>
            ) : endpoints.length === 0 ? (
              <Card className="py-16 text-center">
                <Webhook className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No webhook endpoints yet</p>
                <p className="text-sm text-muted-foreground mt-1">Add an endpoint to start receiving real-time events</p>
                <Button className="mt-4 gap-2" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Add Endpoint</Button>
              </Card>
            ) : (
              endpoints.map((ep) => (
                <Card key={ep.id} className={`hover:shadow-md transition-shadow ${selectedEndpoint === ep.id ? "ring-2 ring-primary" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ep.isActive ? "bg-emerald-100" : "bg-muted"}`}>
                        <Webhook className={`w-5 h-5 ${ep.isActive ? "text-emerald-600" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{ep.name}</span>
                          <Badge variant={ep.isActive ? "default" : "secondary"} className="text-xs">
                            {ep.isActive ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{ep.url}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {((ep.events as string[]) ?? []).map((e) => (
                            <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> {ep.successCount} success</span>
                          <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3 h-3" /> {ep.failureCount} failed</span>
                          {ep.lastTriggeredAt && <span>Last: {new Date(ep.lastTriggeredAt).toLocaleString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch
                          checked={!!ep.isActive}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: ep.id, isActive: checked ? 1 : 0 })}
                        />
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setSelectedEndpoint(ep.id); testMutation.mutate({ id: ep.id }); }} disabled={testMutation.isPending}>
                          <Play className="w-3 h-3" /> Test
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedEndpoint(ep.id === selectedEndpoint ? null : ep.id)}>
                          <Activity className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteMutation.mutate({ id: ep.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Delivery Log Tab */}
          <TabsContent value="deliveries" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                {selectedEndpoint ? `Showing deliveries for selected endpoint` : "Showing all deliveries"}
              </p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => utils.webhooks.listDeliveries.invalidate()}>
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
            {deliveries.length === 0 ? (
              <Card className="py-12 text-center">
                <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No deliveries yet. Test an endpoint to see results here.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {deliveries.map((d) => (
                  <Card key={d.id} className="p-3">
                    <div className="flex items-center gap-3">
                      {d.status === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : d.status === "failed" ? (
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">{d.event}</Badge>
                          {d.statusCode ? <span className="text-xs text-muted-foreground">HTTP {d.statusCode}</span> : null}
                          <span className="text-xs text-muted-foreground ml-auto">{new Date(d.createdAt).toLocaleString()}</span>
                        </div>
                        {d.responseBody && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">{d.responseBody}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* API Docs Tab */}
          <TabsContent value="docs" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Public API Reference</CardTitle>
                <CardDescription>Use these endpoints to push leads from your website or integrate with external tools.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500 text-white text-xs">GET</Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/api/public/health</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Health check endpoint. Returns service status.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500 text-white text-xs">POST</Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/api/public/leads</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Create a lead from an external form. Fires <code className="bg-muted px-1 rounded text-xs">lead.created</code> webhook event.</p>
                  <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto">{`{
  "token": "YOUR_WIDGET_TOKEN",  // required
  "name": "Priya Sharma",        // optional
  "email": "priya@example.com",  // optional
  "phone": "+919876543210",      // optional (at least one required)
  "message": "Interested in...", // optional
  "source": "website-form",      // optional
  "customFields": {              // optional
    "city": "Mumbai",
    "service": "dental"
  }
}`}</pre>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500 text-white text-xs">GET</Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/api/public/widget/:token</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Get widget configuration for embedding the chat bubble.</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Webhook Payload Format</p>
                  <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto">{`{
  "event": "lead.created",
  "businessId": 123,
  "timestamp": "2026-04-13T10:00:00.000Z",
  "data": {
    "leadId": 456,
    "name": "Priya Sharma",
    "phone": "+919876543210",
    "source": "widget"
  }
}`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Endpoint Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) setForm({ name: "", url: "", events: [] }); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Endpoint Name</Label>
              <Input placeholder="e.g. Zapier Lead Capture" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input placeholder="https://hooks.zapier.com/..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Subscribe to Events</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {AVAILABLE_EVENTS.map((ev) => (
                  <label key={ev.id} className="flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={form.events.includes(ev.id)}
                      onChange={() => toggleEvent(ev.id)}
                    />
                    <div>
                      <div className="text-sm font-medium">{ev.label}</div>
                      <div className="text-xs text-muted-foreground">{ev.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.name || !form.url || form.events.length === 0}
            >
              {createMutation.isPending ? "Creating..." : "Create Endpoint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret reveal dialog */}
      <Dialog open={!!shownSecret} onOpenChange={(o) => { if (!o) setShownSecret(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" /> Endpoint Created!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>Save this secret now.</strong> It will not be shown again. Use it to verify webhook authenticity via the <code className="bg-amber-100 px-1 rounded">X-WaLeadBot-Secret</code> header.
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm font-mono break-all">{shownSecret}</code>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(shownSecret ?? ""); toast.success("Copied!"); }}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShownSecret(null)}>I've saved it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

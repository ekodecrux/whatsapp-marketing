import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, Zap, Target, BarChart3, RefreshCw, Plus, Trash2, Sparkles
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const severityColors: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-yellow-100 text-yellow-700",
  critical: "bg-red-100 text-red-700",
};

export default function Intelligence() {
  const [sloDialogOpen, setSloDialogOpen] = useState(false);
  const [sloForm, setSloForm] = useState({ metric: "new_leads", operator: "lt" as const, threshold: 5, windowHours: 24, severity: "warning" as const });
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ [key: string]: string }>({});

  const { data: sloList, refetch: refetchSlo } = trpc.slo.list.useQuery();
  const { data: breaches, refetch: refetchBreaches } = trpc.slo.checkBreaches.useQuery();
  const { data: anomalies, refetch: refetchAnomalies } = trpc.anomaly.list.useQuery({ resolved: false });
  const { data: baseline } = trpc.ai.baselineRegression.useQuery();

  const createSlo = trpc.slo.create.useMutation({ onSuccess: () => { refetchSlo(); setSloDialogOpen(false); toast.success("SLO threshold created"); } });
  const deleteSlo = trpc.slo.delete.useMutation({ onSuccess: () => { refetchSlo(); toast.success("Deleted"); } });
  const toggleSlo = trpc.slo.update.useMutation({ onSuccess: () => refetchSlo() });
  const detectAnomalies = trpc.anomaly.detect.useMutation({ onSuccess: (d) => { refetchAnomalies(); toast.success(`Detected ${d.detected} anomalies`); } });
  const resolveAnomaly = trpc.anomaly.resolve.useMutation({ onSuccess: () => refetchAnomalies() });
  const aiAnalyze = trpc.anomaly.aiAnalyze.useMutation({
    onSuccess: (d, vars) => {
      setAiAnalysis(prev => ({ ...prev, [vars.anomalyId]: d.analysis }));
      setAnalyzingId(null);
    },
    onError: () => setAnalyzingId(null),
  });
  const scoreLeads = trpc.ai.scoreLeads.useMutation({ onSuccess: () => toast.success("Lead scores calculated!") });

  const metricOptions = [
    { value: "new_leads", label: "New Leads / window" },
    { value: "messages_sent", label: "Messages Sent / window" },
    { value: "open_conversations", label: "Open Conversations" },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" /> AI & Intelligence
            </h1>
            <p className="text-muted-foreground mt-1">Anomaly detection, SLO monitoring, baseline regression, and AI-powered insights</p>
          </div>
          <Button onClick={() => detectAnomalies.mutate()} disabled={detectAnomalies.isPending} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${detectAnomalies.isPending ? "animate-spin" : ""}`} />
            Run Anomaly Scan
          </Button>
        </div>

        {/* Baseline Regression Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {baseline?.map((b) => (
            <Card key={b.metric} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize text-muted-foreground">{b.metric}</span>
                  {b.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : b.trend === "down" ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="text-2xl font-bold">{b.thisWeek}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  vs {b.lastWeek} last week
                  <span className={`ml-2 font-semibold ${b.change > 0 ? "text-green-600" : b.change < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                    {b.change > 0 ? "+" : ""}{b.change}%
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {!baseline && [1, 2, 3].map((i) => (
            <Card key={i} className="border-border animate-pulse">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>

        <Tabs defaultValue="slo">
          <TabsList className="bg-muted">
            <TabsTrigger value="slo">SLO Thresholds</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
          </TabsList>

          {/* SLO Tab */}
          <TabsContent value="slo" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Define SLO thresholds and get alerted when metrics breach them.</p>
              <Button onClick={() => setSloDialogOpen(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Add Threshold
              </Button>
            </div>

            {/* Breach Status */}
            {breaches && breaches.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Current Status</h3>
                {breaches.map((b) => (
                  <div key={b.id} className={`flex items-center justify-between p-3 rounded-lg border ${b.breached ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                    <div className="flex items-center gap-2">
                      {b.breached ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      <span className="text-sm font-medium">{b.metric}</span>
                      <span className="text-xs text-muted-foreground">({b.operator} {b.threshold} in {b.windowHours}h)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{b.currentValue}</span>
                      <Badge className={severityColors[b.severity]}>{b.severity}</Badge>
                      {b.breached && <Badge className="bg-red-100 text-red-700">BREACH</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SLO List */}
            <div className="space-y-2">
              {sloList?.map((slo) => (
                <Card key={slo.id} className="border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-medium text-sm">{slo.metric}</div>
                        <div className="text-xs text-muted-foreground">
                          Alert when {slo.operator} {slo.threshold} in {slo.windowHours}h window
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={severityColors[slo.severity]}>{slo.severity}</Badge>
                      <Switch
                        checked={slo.isActive === 1}
                        onCheckedChange={(v) => toggleSlo.mutate({ id: slo.id, isActive: v ? 1 : 0 })}
                      />
                      <Button variant="ghost" size="sm" onClick={() => deleteSlo.mutate({ id: slo.id })}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {sloList?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No SLO thresholds configured. Add one to start monitoring.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Anomalies are detected by comparing today's metrics against the 7-day rolling average. Deviations ≥50% are flagged.</p>
            {anomalies?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
                <p className="font-medium">No active anomalies</p>
                <p className="text-sm">Run an anomaly scan to check current metrics.</p>
              </div>
            )}
            {anomalies?.map((a) => (
              <Card key={a.id} className="border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${a.severity === "critical" ? "text-red-500" : a.severity === "warning" ? "text-yellow-500" : "text-blue-500"}`} />
                      <div>
                        <div className="font-semibold text-sm">{a.metric}</div>
                        <div className="text-xs text-muted-foreground">{a.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={severityColors[a.severity]}>{a.severity}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setAnalyzingId(a.id); aiAnalyze.mutate({ anomalyId: a.id }); }}
                        disabled={analyzingId === a.id}
                        className="gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        {analyzingId === a.id ? "Analyzing..." : "AI Analyze"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => resolveAnomaly.mutate({ id: a.id })}>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </Button>
                    </div>
                  </div>
                  {aiAnalysis[a.id] && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground border border-border">
                      <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-primary">
                        <Brain className="w-3 h-3" /> AI Analysis
                      </div>
                      {aiAnalysis[a.id]}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Lead Scoring Tab */}
          <TabsContent value="scoring" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">AI scores each lead based on engagement, recency, completeness, and pipeline stage.</p>
              <Button onClick={() => scoreLeads.mutate()} disabled={scoreLeads.isPending} className="gap-2">
                <Zap className="w-4 h-4" />
                {scoreLeads.isPending ? "Scoring..." : "Score All Leads"}
              </Button>
            </div>
            {scoreLeads.data && (
              <div className="space-y-2">
                {scoreLeads.data.slice(0, 20).map((lead) => (
                  <div key={lead.leadId} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${lead.score >= 70 ? "bg-green-100 text-green-700" : lead.score >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                        {lead.score}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{lead.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{lead.status}</div>
                      </div>
                    </div>
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${lead.score >= 70 ? "bg-green-500" : lead.score >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!scoreLeads.data && (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Click "Score All Leads" to run AI scoring</p>
                <p className="text-sm">Scores are based on engagement, recency, and pipeline stage</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* SLO Create Dialog */}
      <Dialog open={sloDialogOpen} onOpenChange={setSloDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add SLO Threshold</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Metric</Label>
              <Select value={sloForm.metric} onValueChange={(v) => setSloForm(f => ({ ...f, metric: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {metricOptions.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Operator</Label>
                <Select value={sloForm.operator} onValueChange={(v) => setSloForm(f => ({ ...f, operator: v as typeof sloForm.operator }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lt">Less than (&lt;)</SelectItem>
                    <SelectItem value="lte">Less than or equal (≤)</SelectItem>
                    <SelectItem value="gt">Greater than (&gt;)</SelectItem>
                    <SelectItem value="gte">Greater than or equal (≥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Threshold Value</Label>
                <Input type="number" value={sloForm.threshold} onChange={(e) => setSloForm(f => ({ ...f, threshold: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Window (hours)</Label>
                <Input type="number" value={sloForm.windowHours} onChange={(e) => setSloForm(f => ({ ...f, windowHours: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Severity</Label>
                <Select value={sloForm.severity} onValueChange={(v) => setSloForm(f => ({ ...f, severity: v as typeof sloForm.severity }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSloDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createSlo.mutate(sloForm)} disabled={createSlo.isPending}>
              {createSlo.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

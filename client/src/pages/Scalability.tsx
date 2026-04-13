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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Server, Globe, Activity, Plus, Trash2, RefreshCw,
  Cpu, HardDrive, Wifi, MapPin, CheckCircle2, AlertCircle, Clock
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const REGIONS = [
  { id: "ap-south-1", name: "Asia Pacific (Mumbai)", flag: "🇮🇳", latency: "~12ms", recommended: true },
  { id: "ap-southeast-1", name: "Asia Pacific (Singapore)", flag: "🇸🇬", latency: "~45ms", recommended: false },
  { id: "us-east-1", name: "US East (N. Virginia)", flag: "🇺🇸", latency: "~180ms", recommended: false },
  { id: "eu-west-1", name: "Europe (Ireland)", flag: "🇮🇪", latency: "~200ms", recommended: false },
];

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  idle: "bg-gray-100 text-gray-600",
  error: "bg-red-100 text-red-700",
  starting: "bg-yellow-100 text-yellow-700",
};

export default function Scalability() {
  const [agentDialog, setAgentDialog] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: "", region: "ap-south-1", maxConcurrency: 10 });

  const { data: agents, refetch: refetchAgents } = trpc.agents.list.useQuery();
  const createAgent = trpc.agents.create.useMutation({
    onSuccess: () => { refetchAgents(); setAgentDialog(false); toast.success("Agent created!"); },
    onError: (e) => toast.error(e.message),
  });
  const toggleAgent = trpc.agents.update.useMutation({ onSuccess: () => refetchAgents() });
  const deleteAgent = trpc.agents.delete.useMutation({ onSuccess: () => { refetchAgents(); toast.success("Agent removed"); } });

  const totalAgents = agents?.length ?? 0;
  const activeAgents = agents?.filter(a => a.isActive === 1).length ?? 0;
  const totalCapacity = totalAgents * 10; // 10 concurrent per agent (default)

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Scalability & Infrastructure</h1>
            <p className="text-muted-foreground text-sm">Manage distributed processing agents and geo-distributed deployment regions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Agents", value: totalAgents, icon: Server, color: "text-blue-500" },
            { label: "Active Agents", value: activeAgents, icon: Activity, color: "text-green-500" },
            { label: "Total Capacity", value: `${totalCapacity} concurrent`, icon: Cpu, color: "text-purple-500" },
            { label: "Regions", value: REGIONS.length, icon: Globe, color: "text-amber-500" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="agents">
          <TabsList className="bg-muted">
            <TabsTrigger value="agents">Distributed Agents</TabsTrigger>
            <TabsTrigger value="regions">Geo-Distribution</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
          </TabsList>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Processing agents handle WhatsApp message queues, auto-reply execution, and broadcast delivery in parallel.
              </p>
              <Button onClick={() => setAgentDialog(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Add Agent
              </Button>
            </div>

            <div className="space-y-2">
              {agents?.map((agent) => {
                const region = REGIONS.find(r => r.id === agent.region);
                const load = Math.round(Math.random() * 60); // Simulated load
                return (
                  <Card key={agent.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Server className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{agent.name}</span>
                              <Badge className={statusColor[agent.isActive === 1 ? "active" : "idle"]}>
                                {agent.isActive === 1 ? "active" : "idle"}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {region?.flag} {region?.name ?? agent.region ?? "Default"}
                              <span className="ml-2">· {agent.messagesSent} msgs sent</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={agent.isActive === 1}
                            onCheckedChange={(v) => toggleAgent.mutate({ id: agent.id, isActive: v ? 1 : 0 })}
                          />
                          <Button variant="ghost" size="sm" onClick={() => deleteAgent.mutate({ id: agent.id })}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Load</span>
                          <span>{load}%</span>
                        </div>
                        <Progress value={load} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {agents?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No agents configured. Add your first processing agent to enable distributed message handling.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Regions Tab */}
          <TabsContent value="regions" className="mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Deploy agents across multiple regions to reduce latency for your customers and ensure high availability.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REGIONS.map((region) => {
                  const agentsInRegion = agents?.filter(a => a.region === region.id).length ?? 0;
                  return (
                    <Card key={region.id} className={`border-border ${region.recommended ? "border-primary/30 bg-primary/5" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{region.flag}</span>
                            <div>
                              <div className="font-medium text-sm">{region.name}</div>
                              <div className="text-xs text-muted-foreground">{region.id}</div>
                            </div>
                          </div>
                          {region.recommended && (
                            <Badge className="bg-primary/10 text-primary text-xs">Recommended</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Wifi className="w-3 h-3" /> Latency: {region.latency}
                          </div>
                          <div className="flex items-center gap-1">
                            <Server className="w-3 h-3" /> {agentsInRegion} agent{agentsInRegion !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 text-xs"
                          onClick={() => { setAgentForm(f => ({ ...f, region: region.id })); setAgentDialog(true); }}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Agent in This Region
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="mt-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Distributed Architecture Overview</CardTitle>
                <CardDescription>How WaLeadBot scales to handle high message volumes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    icon: Globe,
                    title: "Meta Cloud API → Webhook",
                    desc: "All incoming WhatsApp messages arrive at /api/webhook/whatsapp. The webhook verifies the signature and enqueues messages for processing.",
                    status: "active",
                  },
                  {
                    icon: Server,
                    title: "Distributed Processing Agents",
                    desc: "Multiple agents consume the message queue in parallel. Each agent handles auto-reply matching, FAQ lookup, flow execution, and lead capture independently.",
                    status: "active",
                  },
                  {
                    icon: HardDrive,
                    title: "Shared MySQL/TiDB Database",
                    desc: "All agents write to the same TiDB-compatible MySQL database. TiDB's distributed SQL engine handles concurrent writes without conflicts.",
                    status: "active",
                  },
                  {
                    icon: Activity,
                    title: "Broadcast Queue",
                    desc: "Broadcast campaigns are split into batches and distributed across agents. Each agent sends its batch with rate limiting to comply with Meta's 1000 msg/day limit on free tier.",
                    status: "planned",
                  },
                  {
                    icon: Globe,
                    title: "Geo-Distributed Deployment",
                    desc: "Deploy agent instances in Mumbai (ap-south-1) for India-first latency. Add Singapore or US East for international businesses.",
                    status: "planned",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.status === "active" ? "bg-green-100" : "bg-amber-100"}`}>
                      <item.icon className={`w-4 h-4 ${item.status === "active" ? "text-green-600" : "text-amber-600"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.title}</span>
                        <Badge className={item.status === "active" ? "bg-green-100 text-green-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Agent Dialog */}
      <Dialog open={agentDialog} onOpenChange={setAgentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Processing Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Agent Name</Label>
              <Input
                placeholder="e.g., Mumbai Primary Agent"
                value={agentForm.name}
                onChange={(e) => setAgentForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Region</Label>
              <Select value={agentForm.region} onValueChange={(v) => setAgentForm(f => ({ ...f, region: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.flag} {r.name} ({r.latency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Max Concurrent Messages</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={agentForm.maxConcurrency}
                onChange={(e) => setAgentForm(f => ({ ...f, maxConcurrency: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">How many messages this agent processes simultaneously (1–100)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgentDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createAgent.mutate(agentForm)}
              disabled={createAgent.isPending || !agentForm.name}
            >
              {createAgent.isPending ? "Creating..." : "Create Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, GitBranch, Trash2, Edit2, Loader2, ArrowRight, MessageSquare, Users, Zap, ChevronRight } from "lucide-react";

interface FlowStep {
  id: string;
  type: "message" | "question" | "capture_lead" | "condition";
  content: string;
  options?: string[];
  field?: string;
}

const stepTypeLabels: Record<string, string> = {
  message: "Send Message",
  question: "Ask Question",
  capture_lead: "Capture Lead",
  condition: "Condition",
};

const stepTypeColors: Record<string, string> = {
  message: "bg-blue-50 text-blue-600 border-blue-200",
  question: "bg-purple-50 text-purple-600 border-purple-200",
  capture_lead: "bg-green-50 text-green-600 border-green-200",
  condition: "bg-orange-50 text-orange-600 border-orange-200",
};

export default function Flows() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    triggerKeyword: "",
    isActive: true,
    steps: [] as FlowStep[],
  });

  const { data: flows = [], refetch } = trpc.flows.list.useQuery();

  const create = trpc.flows.create.useMutation({
    onSuccess: () => { toast.success("Flow created!"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.flows.update.useMutation({
    onSuccess: () => { toast.success("Flow updated!"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.flows.delete.useMutation({
    onSuccess: () => { toast.success("Flow deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = trpc.flows.update.useMutation({ onSuccess: () => refetch() });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", triggerKeyword: "", isActive: true, steps: [] });
    setOpen(true);
  };

  const openEdit = (flow: any) => {
    setEditing(flow.id);
    setForm({
      name: flow.name,
      description: flow.description || "",
      triggerKeyword: flow.triggerKeyword || "",
      isActive: flow.isActive,
      steps: flow.steps || [],
    });
    setOpen(true);
  };

  const addStep = (type: FlowStep["type"]) => {
    const step: FlowStep = {
      id: `step_${Date.now()}`,
      type,
      content: "",
      options: type === "question" ? ["Option 1", "Option 2"] : undefined,
      field: type === "capture_lead" ? "name" : undefined,
    };
    setForm((f) => ({ ...f, steps: [...f.steps, step] }));
  };

  const updateStep = (id: string, updates: Partial<FlowStep>) => {
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const removeStep = (id: string) => {
    setForm((f) => ({ ...f, steps: f.steps.filter((s) => s.id !== id) }));
  };

  const handleSubmit = () => {
    if (!form.name) { toast.error("Flow name is required"); return; }
    if (editing) {
      update.mutate({ id: editing, ...form });
    } else {
      create.mutate(form);
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conversation Flows</h1>
          <p className="text-muted-foreground text-sm mt-1">Build multi-step automated conversation flows with branching logic</p>
        </div>
        <Button onClick={openCreate} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Create Flow
        </Button>
      </div>

      {flows.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No flows yet</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
              Create automated conversation flows to guide customers through a series of messages and capture their information.
            </p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Create First Flow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {flows.map((flow: any) => (
            <Card key={flow.id} className={`border-border/50 hover:shadow-md transition-all ${!flow.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                      <GitBranch className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{flow.name}</h3>
                      {flow.triggerKeyword && (
                        <Badge variant="outline" className="text-xs mt-0.5 font-mono">{flow.triggerKeyword}</Badge>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={flow.isActive}
                    onCheckedChange={(v) => toggleActive.mutate({ id: flow.id, isActive: v })}
                  />
                </div>

                {flow.description && (
                  <p className="text-xs text-muted-foreground mb-3">{flow.description}</p>
                )}

                {/* Steps preview */}
                <div className="flex items-center gap-1 flex-wrap mb-4">
                  {(flow.steps || []).slice(0, 4).map((step: FlowStep, i: number) => (
                    <div key={step.id} className="flex items-center gap-1">
                      <Badge variant="outline" className={`text-xs ${stepTypeColors[step.type]}`}>
                        {stepTypeLabels[step.type]}
                      </Badge>
                      {i < Math.min((flow.steps || []).length - 1, 3) && (
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                  {(flow.steps || []).length > 4 && (
                    <Badge variant="secondary" className="text-xs">+{(flow.steps || []).length - 4} more</Badge>
                  )}
                  {(flow.steps || []).length === 0 && (
                    <span className="text-xs text-muted-foreground">No steps yet</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(flow)} className="flex-1">
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Flow
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => del.mutate({ id: flow.id })}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Flow" : "Create Conversation Flow"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Flow Name *</Label>
                <Input
                  placeholder="e.g. Lead Qualification"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trigger Keyword</Label>
                <Input
                  placeholder="e.g. start, info, help"
                  value={form.triggerKeyword}
                  onChange={(e) => setForm((f) => ({ ...f, triggerKeyword: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="Brief description of this flow..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Flow Steps */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Flow Steps ({form.steps.length})</Label>
              </div>

              {form.steps.length === 0 && (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Add steps to build your conversation flow</p>
                </div>
              )}

              {form.steps.map((step, i) => (
                <div key={step.id} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <Badge variant="outline" className={`text-xs ${stepTypeColors[step.type]}`}>
                        {stepTypeLabels[step.type]}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeStep(step.id)} className="text-destructive hover:text-destructive h-7 w-7 p-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <Textarea
                    placeholder={
                      step.type === "message" ? "Message to send..." :
                      step.type === "question" ? "Question to ask..." :
                      step.type === "capture_lead" ? "Message before capturing..." :
                      "Condition logic..."
                    }
                    value={step.content}
                    onChange={(e) => updateStep(step.id, { content: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />

                  {step.type === "capture_lead" && (
                    <Select value={step.field} onValueChange={(v) => updateStep(step.id, { field: v })}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Field to capture" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="city">City</SelectItem>
                        <SelectItem value="budget">Budget</SelectItem>
                        <SelectItem value="requirement">Requirement</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}

              {/* Add step buttons */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => addStep("message")}>
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Message
                </Button>
                <Button variant="outline" size="sm" onClick={() => addStep("question")}>
                  <Zap className="w-3.5 h-3.5 mr-1.5" /> Question
                </Button>
                <Button variant="outline" size="sm" onClick={() => addStep("capture_lead")}>
                  <Users className="w-3.5 h-3.5 mr-1.5" /> Capture Lead
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label className="text-sm">{form.isActive ? "Active" : "Inactive"}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editing ? "Update Flow" : "Create Flow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

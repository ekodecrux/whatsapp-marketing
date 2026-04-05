import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Zap, Trash2, Edit2, Loader2, MessageSquare, Clock, Hash, Star } from "lucide-react";

const triggerLabels: Record<string, string> = {
  keyword: "Keyword Match",
  first_message: "First Message",
  outside_hours: "Outside Business Hours",
  any_message: "Any Message",
  contains: "Contains Text",
};

const matchLabels: Record<string, string> = {
  exact: "Exact Match",
  contains: "Contains",
  starts_with: "Starts With",
  regex: "Regex",
};

const triggerIcons: Record<string, React.ReactNode> = {
  keyword: <Hash className="w-4 h-4" />,
  first_message: <Star className="w-4 h-4" />,
  outside_hours: <Clock className="w-4 h-4" />,
  any_message: <MessageSquare className="w-4 h-4" />,
  contains: <Zap className="w-4 h-4" />,
};

const defaultForm = {
  name: "",
  triggerType: "keyword" as const,
  triggerValue: "",
  matchType: "contains" as const,
  responseType: "text" as const,
  responseText: "",
  isActive: true,
  priority: 0,
};

export default function AutoReply() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: rules = [], refetch } = trpc.autoReply.list.useQuery();
  const utils = trpc.useUtils();

  const create = trpc.autoReply.create.useMutation({
    onSuccess: () => { toast.success("Rule created!"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.autoReply.update.useMutation({
    onSuccess: () => { toast.success("Rule updated!"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.autoReply.delete.useMutation({
    onSuccess: () => { toast.success("Rule deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = trpc.autoReply.update.useMutation({
    onSuccess: () => refetch(),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (rule: any) => {
    setEditing(rule.id);
    setForm({
      name: rule.name,
      triggerType: rule.triggerType,
      triggerValue: rule.triggerValue || "",
      matchType: rule.matchType || "contains",
      responseType: rule.responseType || "text",
      responseText: rule.responseText || "",
      isActive: rule.isActive,
      priority: rule.priority || 0,
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.responseText) {
      toast.error("Name and response text are required");
      return;
    }
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
          <h1 className="text-2xl font-bold text-foreground">Auto-Reply Rules</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure automatic responses based on triggers and keywords</p>
        </div>
        <Button onClick={openCreate} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Rule
        </Button>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No auto-reply rules yet</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
              Create rules to automatically respond to customer messages based on keywords, first messages, or business hours.
            </p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Create First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule: any) => (
            <Card key={rule.id} className={`border-border/50 transition-all hover:shadow-sm ${!rule.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                  {triggerIcons[rule.triggerType] || <Zap className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{rule.name}</span>
                    <Badge variant="secondary" className="text-xs">{triggerLabels[rule.triggerType]}</Badge>
                    {rule.triggerValue && (
                      <Badge variant="outline" className="text-xs font-mono">{rule.triggerValue}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{rule.responseText}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Priority: {rule.priority}</span>
                    <span>·</span>
                    <span>Triggered: {rule.triggerCount || 0} times</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={(v) => toggleActive.mutate({ id: rule.id, isActive: v })}
                  />
                  <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => del.mutate({ id: rule.id })}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Rule" : "Create Auto-Reply Rule"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Rule Name *</Label>
              <Input
                placeholder="e.g. Welcome Message"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Trigger Type *</Label>
                <Select value={form.triggerType} onValueChange={(v: any) => setForm((f) => ({ ...f, triggerType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keyword Match</SelectItem>
                    <SelectItem value="first_message">First Message</SelectItem>
                    <SelectItem value="outside_hours">Outside Hours</SelectItem>
                    <SelectItem value="any_message">Any Message</SelectItem>
                    <SelectItem value="contains">Contains Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Match Type</Label>
                <Select value={form.matchType} onValueChange={(v: any) => setForm((f) => ({ ...f, matchType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Exact Match</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="starts_with">Starts With</SelectItem>
                    <SelectItem value="regex">Regex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(form.triggerType === "keyword" || form.triggerType === "contains") && (
              <div className="space-y-1.5">
                <Label>Trigger Keyword/Text</Label>
                <Input
                  placeholder="e.g. price, appointment, hello"
                  value={form.triggerValue}
                  onChange={(e) => setForm((f) => ({ ...f, triggerValue: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Response Message *</Label>
              <Textarea
                placeholder="Hi! Thanks for reaching out. We'll get back to you shortly..."
                value={form.responseText}
                onChange={(e) => setForm((f) => ({ ...f, responseText: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority (higher = first)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                  />
                  <span className="text-sm text-muted-foreground">{form.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editing ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

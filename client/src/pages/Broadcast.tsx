import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Megaphone, Send, Loader2, Users, CheckCircle2, XCircle, Clock, BarChart2 } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: <Clock className="w-3.5 h-3.5" /> },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-600", icon: <Clock className="w-3.5 h-3.5" /> },
  sending: { label: "Sending", color: "bg-yellow-100 text-yellow-600", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  sent: { label: "Sent", color: "bg-green-100 text-green-600", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  failed: { label: "Failed", color: "bg-red-100 text-red-600", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function Broadcast() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    message: "",
    targetType: "all" as "all" | "tag" | "custom",
    targetTags: [] as string[],
    tagInput: "",
  });

  const { data: campaigns = [], refetch } = trpc.broadcast.list.useQuery();
  const { data: contactCount = 0 } = trpc.contacts.count.useQuery();

  const create = trpc.broadcast.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Campaign created! ${data.totalRecipients} recipients`);
      setOpen(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const send = trpc.broadcast.send.useMutation({
    onSuccess: (data) => {
      toast.success(`Broadcast sent! ${data.sentCount} delivered, ${data.failedCount} failed`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const addTag = () => {
    const tag = form.tagInput.trim();
    if (tag && !form.targetTags.includes(tag)) {
      setForm((f) => ({ ...f, targetTags: [...f.targetTags, tag], tagInput: "" }));
    } else {
      setForm((f) => ({ ...f, tagInput: "" }));
    }
  };

  const handleCreate = () => {
    if (!form.name || !form.message) { toast.error("Name and message are required"); return; }
    create.mutate({
      name: form.name,
      message: form.message,
      targetType: form.targetType,
      targetTags: form.targetTags,
    });
  };

  const charCount = form.message.length;
  const msgCount = Math.ceil(charCount / 160) || 1;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Broadcast</h1>
          <p className="text-muted-foreground text-sm mt-1">Send bulk messages to your contacts</p>
        </div>
        <Button onClick={() => setOpen(true)} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Contacts", value: contactCount, icon: <Users className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
          { label: "Campaigns", value: campaigns.length, icon: <Megaphone className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50" },
          { label: "Total Sent", value: campaigns.reduce((a: number, c: any) => a + (c.sentCount || 0), 0), icon: <Send className="w-5 h-5 text-green-600" />, bg: "bg-green-50" },
          { label: "Success Rate", value: (() => {
            const total = campaigns.reduce((a: number, c: any) => a + (c.totalRecipients || 0), 0);
            const sent = campaigns.reduce((a: number, c: any) => a + (c.sentCount || 0), 0);
            return total > 0 ? `${Math.round((sent / total) * 100)}%` : "—";
          })(), icon: <BarChart2 className="w-5 h-5 text-orange-600" />, bg: "bg-orange-50" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaigns list */}
      {campaigns.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
              Create a broadcast campaign to send bulk messages to all your contacts or specific segments.
            </p>
            <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create Campaign</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign: any) => {
            const cfg = statusConfig[campaign.status] || statusConfig.draft;
            const successRate = campaign.totalRecipients > 0
              ? Math.round(((campaign.sentCount || 0) / campaign.totalRecipients) * 100)
              : 0;

            return (
              <Card key={campaign.id} className="border-border/50 hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Megaphone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(campaign.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {(campaign.status === "draft" || campaign.status === "scheduled") && (
                      <Button
                        size="sm"
                        onClick={() => send.mutate({ id: campaign.id })}
                        disabled={send.isPending}
                        className="shadow-sm"
                      >
                        {send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                        Send Now
                      </Button>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{campaign.message}</p>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-foreground">{campaign.totalRecipients || 0}</div>
                      <div className="text-xs text-muted-foreground">Recipients</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{campaign.sentCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">{campaign.status === "sent" ? `${successRate}%` : "—"}</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                  </div>

                  {campaign.status === "sent" && campaign.totalRecipients > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${successRate}%` }} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Broadcast Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Campaign Name *</Label>
              <Input
                placeholder="e.g. Diwali Offer 2026"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Message *</Label>
              <Textarea
                placeholder="Hi {name}! We have an exciting offer for you..."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{charCount} characters</span>
                <span>{msgCount} SMS segment{msgCount > 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Target Audience</Label>
              <Select value={form.targetType} onValueChange={(v: any) => setForm((f) => ({ ...f, targetType: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts ({contactCount})</SelectItem>
                  <SelectItem value="tag">By Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.targetType === "tag" && (
              <div className="space-y-1.5">
                <Label>Target Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={form.tagInput}
                    onChange={(e) => setForm((f) => ({ ...f, tagInput: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
                {form.targetTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.targetTags.map((t) => (
                      <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => setForm((f) => ({ ...f, targetTags: f.targetTags.filter((x) => x !== t) }))}>
                        {t} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <strong>Important:</strong> WhatsApp only allows sending messages to contacts who have messaged you first (within 24 hours) or via approved message templates. Ensure compliance with Meta's policies.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={create.isPending}>
              {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

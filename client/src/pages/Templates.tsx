import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import {
  Plus, Search, FileText, Send, CheckCircle2, XCircle, Clock,
  AlertCircle, Pencil, Trash2, Eye, RefreshCw, MessageSquare,
  ChevronRight, Info, Zap, Copy
} from "lucide-react";

type Template = {
  id: number;
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  headerType: "none" | "text" | "image" | "video" | "document" | null;
  headerContent: string | null;
  body: string;
  footer: string | null;
  buttons: { type: string; text: string; url?: string; phone?: string }[] | null;
  variables: string[] | null;
  status: "draft" | "pending" | "approved" | "rejected" | "paused";
  metaTemplateId: string | null;
  rejectionReason: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
};

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: FileText },
  pending: { label: "Under Review", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  paused: { label: "Paused", color: "bg-gray-100 text-gray-600", icon: AlertCircle },
};

const CATEGORY_INFO = {
  MARKETING: { label: "Marketing", desc: "Promotions, offers, newsletters" },
  UTILITY: { label: "Utility", desc: "Order updates, account alerts, reminders" },
  AUTHENTICATION: { label: "Authentication", desc: "OTPs, verification codes" },
};

const VARIABLE_REGEX = /\{\{(\d+)\}\}/g;

function extractVariables(text: string): string[] {
  const results: string[] = [];
  let m: RegExpExecArray | null;
  const re = /\{\{(\d+)\}\}/g;
  while ((m = re.exec(text)) !== null) results.push(`{{${m[1]}}}`);
  return Array.from(new Set(results));
}

function TemplatePreview({ template }: { template: Partial<Template> }) {
  return (
    <div className="bg-[#e5ddd5] rounded-xl p-4 min-h-[180px]">
      <div className="max-w-[280px] mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {template.headerType && template.headerType !== "none" && template.headerContent && (
            <div className="bg-muted px-3 py-2 text-sm font-medium border-b">
              {template.headerType === "text" ? (
                <span>{template.headerContent}</span>
              ) : (
                <span className="text-muted-foreground italic">[{template.headerType} header]</span>
              )}
            </div>
          )}
          <div className="px-3 py-2.5">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {template.body || <span className="text-muted-foreground italic">Message body will appear here...</span>}
            </p>
          </div>
          {template.footer && (
            <div className="px-3 pb-2 text-xs text-muted-foreground">{template.footer}</div>
          )}
          {template.buttons && template.buttons.length > 0 && (
            <div className="border-t">
              {template.buttons.map((btn, i) => (
                <button key={i} className="w-full px-3 py-2 text-sm text-primary font-medium border-b last:border-0 hover:bg-muted/50 transition-colors text-center">
                  {btn.text}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-right mt-1">
          <span className="text-xs text-muted-foreground">12:00 PM ✓✓</span>
        </div>
      </div>
    </div>
  );
}

export default function Templates() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);


  // Form state
  const [form, setForm] = useState({
    name: "",
    category: "MARKETING" as "MARKETING" | "UTILITY" | "AUTHENTICATION",
    language: "en",
    headerType: "none" as "none" | "text" | "image" | "video" | "document",
    headerContent: "",
    body: "",
    footer: "",
    buttons: [] as { type: string; text: string; url?: string }[],
  });

  const utils = trpc.useUtils();
  const { data: templates = [], isLoading } = trpc.templates.list.useQuery();

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => { toast.success("Template created"); utils.templates.list.invalidate(); setShowCreate(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => { toast.success("Template updated"); utils.templates.list.invalidate(); setEditTemplate(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => { toast.success("Template deleted"); utils.templates.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const submitMutation = trpc.templates.submit.useMutation({
    onSuccess: (data) => { toast.success(data.message); utils.templates.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const simulateMutation = trpc.templates.simulateApproval.useMutation({
    onSuccess: () => { toast.success("Approval status updated"); utils.templates.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ name: "", category: "MARKETING", language: "en", headerType: "none", headerContent: "", body: "", footer: "", buttons: [] });
  }

  function openEdit(t: Template) {
    setForm({
      name: t.name,
      category: t.category,
      language: t.language,
      headerType: t.headerType ?? "none",
      headerContent: t.headerContent ?? "",
      body: t.body,
      footer: t.footer ?? "",
      buttons: (t.buttons ?? []).map((b) => ({ type: b.type, text: b.text, url: b.url })),
    });
    setEditTemplate(t);
  }

  const variables = extractVariables(form.body + " " + form.headerContent);

  const filtered = templates.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.body.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: templates.length,
    draft: templates.filter((t) => t.status === "draft").length,
    pending: templates.filter((t) => t.status === "pending").length,
    approved: templates.filter((t) => t.status === "approved").length,
    rejected: templates.filter((t) => t.status === "rejected").length,
  };

  const FormContent = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Template Name</Label>
          <Input placeholder="e.g. welcome_message" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, "_") })} />
          <p className="text-xs text-muted-foreground">Lowercase, underscores only</p>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_INFO).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label} — {v.desc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Language</Label>
          <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="mr">Marathi</SelectItem>
              <SelectItem value="ta">Tamil</SelectItem>
              <SelectItem value="te">Telugu</SelectItem>
              <SelectItem value="kn">Kannada</SelectItem>
              <SelectItem value="gu">Gujarati</SelectItem>
              <SelectItem value="bn">Bengali</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Header Type</Label>
          <Select value={form.headerType} onValueChange={(v) => setForm({ ...form, headerType: v as typeof form.headerType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="document">Document</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.headerType === "text" && (
        <div className="space-y-1.5">
          <Label>Header Text</Label>
          <Input placeholder="Header text (max 60 chars)" maxLength={60} value={form.headerContent} onChange={(e) => setForm({ ...form, headerContent: e.target.value })} />
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Message Body *</Label>
          <span className="text-xs text-muted-foreground">{form.body.length}/1024</span>
        </div>
        <Textarea
          placeholder="Enter your message. Use {{1}}, {{2}} for dynamic variables (e.g. Hello {{1}}, your appointment is on {{2}})"
          rows={5}
          maxLength={1024}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        {variables.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-xs text-muted-foreground">Variables detected:</span>
            {variables.map((v) => <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>)}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Footer <span className="text-muted-foreground text-xs">(optional, max 60 chars)</span></Label>
        <Input placeholder="e.g. Reply STOP to unsubscribe" maxLength={60} value={form.footer} onChange={(e) => setForm({ ...form, footer: e.target.value })} />
      </div>

      {/* Live Preview */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Live Preview</Label>
        <TemplatePreview template={{ ...form, buttons: form.buttons.map((b) => ({ ...b, type: b.type || "URL" })) }} />
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Message Templates</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and manage WhatsApp HSM templates for broadcasts and automated messages.
              Meta approval required before use.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Meta Approval Required:</strong> All templates must be approved by Meta before use in broadcasts or automated messages.
            Approval typically takes <strong>24–48 hours</strong>. Rejected templates can be edited and resubmitted.
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", count: counts.all, color: "text-foreground" },
            { label: "Approved", count: counts.approved, color: "text-emerald-600" },
            { label: "Pending", count: counts.pending, color: "text-amber-600" },
            { label: "Rejected", count: counts.rejected, color: "text-red-600" },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "draft", "pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {s === "all" ? "All" : STATUS_CONFIG[s]?.label} {s !== "all" && `(${counts[s] ?? 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* Template list */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
        ) : filtered.length === 0 ? (
          <Card className="py-16 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No templates found</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first template to get started with broadcasts</p>
            <Button className="mt-4 gap-2" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create Template</Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((t) => {
              const statusCfg = STATUS_CONFIG[t.status];
              const StatusIcon = statusCfg.icon;
              return (
                <Card key={t.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{t.name}</span>
                          <Badge variant="outline" className="text-xs">{t.category}</Badge>
                          <Badge variant="outline" className="text-xs">{t.language.toUpperCase()}</Badge>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.body}</p>
                        {t.rejectionReason && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{t.rejectionReason}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {t.submittedAt && <span>Submitted {new Date(t.submittedAt).toLocaleDateString()}</span>}
                          {t.approvedAt && <span>Approved {new Date(t.approvedAt).toLocaleDateString()}</span>}
                          <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setPreviewTemplate(t)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(t.status === "draft" || t.status === "rejected") && (
                          <>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(t)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => submitMutation.mutate({ id: t.id })} disabled={submitMutation.isPending}>
                              <Send className="w-3.5 h-3.5" /> Submit
                            </Button>
                          </>
                        )}
                        {t.status === "pending" && (
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => simulateMutation.mutate({ id: t.id, approved: true })}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve (Test)
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => simulateMutation.mutate({ id: t.id, approved: false })}>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject (Test)
                            </Button>
                          </div>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteMutation.mutate({ id: t.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Message Template</DialogTitle>
          </DialogHeader>
          <FormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...form, headerContent: form.headerContent || undefined, footer: form.footer || undefined })} disabled={createMutation.isPending || !form.name || !form.body}>
              {createMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTemplate} onOpenChange={(o) => { if (!o) setEditTemplate(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <FormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTemplate(null)}>Cancel</Button>
            <Button onClick={() => editTemplate && updateMutation.mutate({ id: editTemplate.id, ...form, headerContent: form.headerContent || undefined, footer: form.footer || undefined })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(o) => { if (!o) setPreviewTemplate(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {previewTemplate && <TemplatePreview template={previewTemplate} />}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{previewTemplate?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Category</span>
              <Badge variant="outline">{previewTemplate?.category}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Language</span>
              <span>{previewTemplate?.language?.toUpperCase()}</span>
            </div>
            {previewTemplate?.variables && previewTemplate.variables.length > 0 && (
              <div className="flex items-start justify-between text-sm">
                <span className="text-muted-foreground">Variables</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {previewTemplate.variables.map((v) => <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>)}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

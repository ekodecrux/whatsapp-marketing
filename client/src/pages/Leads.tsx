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
import {
  Plus, Search, Filter, TrendingUp, Trash2, Edit2, Loader2,
  Phone, Mail, Tag, DollarSign, Calendar, MoreVertical, Download
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-700" },
  contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-700" },
  qualified: { label: "Qualified", color: "bg-purple-100 text-purple-700" },
  proposal: { label: "Proposal", color: "bg-orange-100 text-orange-700" },
  won: { label: "Won", color: "bg-green-100 text-green-700" },
  lost: { label: "Lost", color: "bg-red-100 text-red-700" },
};

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  source: "",
  status: "new" as const,
  notes: "",
  estimatedValue: 0,
  tags: [] as string[],
};

export default function Leads() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [tagInput, setTagInput] = useState("");

  const { data: leads = [], refetch } = trpc.leads.list.useQuery({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 100,
    offset: 0,
  });

  const create = trpc.leads.create.useMutation({
    onSuccess: () => { toast.success("Lead created!"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.leads.update.useMutation({
    onSuccess: () => { toast.success("Lead updated!"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.leads.delete.useMutation({
    onSuccess: () => { toast.success("Lead deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setTagInput("");
    setOpen(true);
  };

  const openEdit = (lead: any) => {
    setEditing(lead.id);
    setForm({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source || "",
      status: lead.status || "new",
      notes: lead.notes || "",
      estimatedValue: lead.estimatedValue || 0,
      tags: lead.tags || [],
    });
    setTagInput("");
    setOpen(true);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  };

  const handleSubmit = () => {
    if (!form.phone) { toast.error("Phone number is required"); return; }
    if (editing) {
      update.mutate({ id: editing, ...form });
    } else {
      create.mutate(form);
    }
  };

  const exportCsv = () => {
    const headers = ["Name", "Phone", "Email", "Status", "Source", "Value", "Notes"];
    const rows = leads.map((l: any) => [
      l.name || "", l.phone || "", l.email || "", l.status || "",
      l.source || "", l.estimatedValue || 0, l.notes || ""
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v: any) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "leads.csv"; a.click();
    toast.success("Leads exported!");
  };

  const statusCounts = Object.keys(statusConfig).reduce((acc, s) => {
    acc[s] = leads.filter((l: any) => l.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const isPending = create.isPending || update.isPending;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">{leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button size="sm" onClick={openCreate} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Pipeline overview */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Object.entries(statusConfig).map(([status, cfg]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            className={`p-3 rounded-xl border-2 text-center transition-all hover:shadow-sm ${statusFilter === status ? "border-primary bg-primary/5" : "border-border/50 bg-white"}`}
          >
            <div className="text-xl font-bold text-foreground">{statusCounts[status] || 0}</div>
            <div className={`text-xs px-1.5 py-0.5 rounded-full inline-block mt-1 ${cfg.color}`}>{cfg.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([v, cfg]) => (
              <SelectItem key={v} value={v}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads table */}
      {leads.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No leads yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Leads will appear here automatically when customers message you on WhatsApp, or you can add them manually.</p>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add Lead</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Contact</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Source</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Value</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => (
                  <tr key={lead.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-foreground">{lead.name || "—"}</div>
                      {lead.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {lead.tags.slice(0, 2).map((t: string) => (
                            <Badge key={t} variant="secondary" className="text-xs py-0">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-foreground">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={lead.status}
                        onValueChange={(v: any) => update.mutate({ id: lead.id, status: v })}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs border-0 p-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[lead.status]?.color}`}>
                            {statusConfig[lead.status]?.label}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([v, cfg]) => (
                            <SelectItem key={v} value={v}>{cfg.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{lead.source || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.estimatedValue ? (
                        <span className="text-sm font-medium text-foreground">₹{lead.estimatedValue.toLocaleString()}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(lead)}>
                            <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => del.mutate({ id: lead.id })}
                            className="text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Lead" : "Add Lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Input placeholder="WhatsApp, Referral..." value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([v, cfg]) => (
                      <SelectItem key={v} value={v}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Est. Value (₹)</Label>
                <Input type="number" placeholder="0" value={form.estimatedValue} onChange={(e) => setForm((f) => ({ ...f, estimatedValue: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}>
                      {t} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Any notes about this lead..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

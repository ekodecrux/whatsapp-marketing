import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Search, Users, Phone, Mail, Tag, Trash2, Edit2, Loader2,
  Upload, FileText, CheckCircle2, AlertCircle, X, Download,
  ChevronRight, ArrowLeft,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const parse = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  };
  const headers = parse(lines[0]);
  const rows = lines.slice(1).map(parse).filter((r) => r.some((c) => c));
  return { headers, rows };
}

type ColumnMap = { waId: string; name: string; email: string; tags: string; notes: string };
const FIELD_LABELS: Record<keyof ColumnMap, string> = {
  waId: "WhatsApp Number *",
  name: "Name",
  email: "Email",
  tags: "Tags (comma-separated)",
  notes: "Notes",
};

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", notes: "", tags: [] as string[], isBlocked: false });
  const [tagInput, setTagInput] = useState("");

  // CSV import state
  const [importStep, setImportStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [columnMap, setColumnMap] = useState<ColumnMap>({ waId: "", name: "", email: "", tags: "", notes: "" });
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: contacts = [], refetch } = trpc.contacts.list.useQuery({ search: search || undefined, limit: 200, offset: 0 });
  const update = trpc.contacts.update.useMutation({
    onSuccess: () => { toast.success("Contact updated!"); setEditOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.contacts.delete.useMutation({
    onSuccess: () => { toast.success("Contact deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const bulkImport = trpc.contacts.bulkImport.useMutation();

  const openEdit = (contact: any) => {
    setEditing(contact);
    setForm({ name: contact.name || "", email: contact.email || "", notes: contact.notes || "", tags: contact.tags || [], isBlocked: contact.isBlocked || false });
    setTagInput("");
    setEditOpen(true);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput("");
  };

  const handleSubmit = () => {
    if (!editing) return;
    update.mutate({ id: editing.id, ...form });
  };

  // ─── CSV Import handlers ───────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCsv(text);
      if (!headers.length) { toast.error("Could not parse CSV — check the file format"); return; }
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-map columns by common names
      const autoMap: ColumnMap = { waId: "", name: "", email: "", tags: "", notes: "" };
      headers.forEach((h) => {
        const lower = h.toLowerCase().replace(/\s+/g, "");
        if (!autoMap.waId && (lower.includes("phone") || lower.includes("mobile") || lower.includes("whatsapp") || lower.includes("waid") || lower.includes("number"))) autoMap.waId = h;
        if (!autoMap.name && (lower.includes("name") || lower.includes("contact"))) autoMap.name = h;
        if (!autoMap.email && lower.includes("email")) autoMap.email = h;
        if (!autoMap.tags && (lower.includes("tag") || lower.includes("label") || lower.includes("category"))) autoMap.tags = h;
        if (!autoMap.notes && (lower.includes("note") || lower.includes("remark") || lower.includes("comment"))) autoMap.notes = h;
      });
      setColumnMap(autoMap);
      setImportStep("map");
    };
    reader.readAsText(file);
  }

  function getPreviewContacts() {
    return csvRows.slice(0, 5).map((row) => {
      const get = (col: string) => col ? row[csvHeaders.indexOf(col)] || "" : "";
      return {
        waId: get(columnMap.waId),
        name: get(columnMap.name),
        email: get(columnMap.email),
        tags: get(columnMap.tags) ? get(columnMap.tags).split(",").map((t) => t.trim()).filter(Boolean) : [],
        notes: get(columnMap.notes),
      };
    });
  }

  async function handleImport() {
    const mapped = csvRows.map((row) => {
      const get = (col: string) => col ? row[csvHeaders.indexOf(col)] || "" : "";
      return {
        waId: get(columnMap.waId),
        name: get(columnMap.name) || undefined,
        email: get(columnMap.email) || undefined,
        tags: get(columnMap.tags) ? get(columnMap.tags).split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        notes: get(columnMap.notes) || undefined,
      };
    }).filter((c) => c.waId);

    if (!mapped.length) { toast.error("No valid contacts found — check the WhatsApp Number column mapping"); return; }

    try {
      const result = await bulkImport.mutateAsync({ contacts: mapped });
      setImportResult(result);
      setImportStep("done");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Import failed");
    }
  }

  function resetImport() {
    setImportStep("upload");
    setCsvHeaders([]);
    setCsvRows([]);
    setCsvFileName("");
    setColumnMap({ waId: "", name: "", email: "", tags: "", notes: "" });
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadTemplate() {
    const csv = "Phone Number,Name,Email,Tags,Notes\n+919876543210,Rahul Sharma,rahul@example.com,\"clinic,patient\",Interested in consultation\n+918765432109,Priya Patel,,real-estate,Looking for 2BHK\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "contacts-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const previewContacts = importStep === "preview" ? getPreviewContacts() : [];

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
            <p className="text-muted-foreground text-sm mt-1">{contacts.length} contacts from WhatsApp conversations</p>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => { resetImport(); setImportOpen(true); }}
          >
            <Upload className="h-4 w-4 mr-2" /> Import CSV
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Contacts grid */}
        {contacts.length === 0 ? (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="py-16 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No contacts yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                Contacts are automatically created when customers message you on WhatsApp, or import your existing contacts via CSV.
              </p>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { resetImport(); setImportOpen(true); }}
              >
                <Upload className="h-4 w-4 mr-2" /> Import Contacts from CSV
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact: any) => (
              <Card key={contact.id} className={`border-border/50 hover:shadow-md transition-all ${contact.isBlocked ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {(contact.name || contact.waId || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{contact.name || "Unknown"}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {contact.waId}
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </div>
                      )}
                    </div>
                    {contact.isBlocked && <Badge variant="destructive" className="text-xs">Blocked</Badge>}
                  </div>

                  {contact.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {contact.tags.map((t: string) => (
                        <Badge key={t} variant="secondary" className="text-xs py-0">
                          <Tag className="w-2.5 h-2.5 mr-1" />{t}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>Added {new Date(contact.createdAt).toLocaleDateString("en-IN")}</span>
                    <span>{contact.messageCount || 0} messages</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEdit(contact)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => del.mutate({ id: contact.id })}
                      className="text-destructive hover:text-destructive"
                      disabled={del.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="Contact name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
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
                <Textarea placeholder="Notes about this contact..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isBlocked} onCheckedChange={(v) => setForm((f) => ({ ...f, isBlocked: v }))} />
                <Label className="text-sm text-destructive">Block this contact</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={update.isPending}>
                {update.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CSV Import Dialog */}
        <Dialog open={importOpen} onOpenChange={(v) => { if (!v) resetImport(); setImportOpen(v); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-emerald-600" /> Import Contacts from CSV
              </DialogTitle>
            </DialogHeader>

            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              {(["upload", "map", "preview", "done"] as const).map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${importStep === step ? "bg-emerald-600 text-white" : (["upload", "map", "preview", "done"].indexOf(importStep) > i ? "bg-emerald-200 text-emerald-800" : "bg-muted text-muted-foreground")}`}>
                    {["upload", "map", "preview", "done"].indexOf(importStep) > i ? "✓" : i + 1}
                  </div>
                  <span className={importStep === step ? "text-foreground font-medium" : ""}>{step.charAt(0).toUpperCase() + step.slice(1)}</span>
                  {i < 3 && <ChevronRight className="h-3 w-3" />}
                </div>
              ))}
            </div>

            {/* Step 1: Upload */}
            {importStep === "upload" && (
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="font-semibold text-foreground mb-1">Click to upload a CSV file</p>
                  <p className="text-sm text-muted-foreground">or drag and drop your contacts file here</p>
                  <p className="text-xs text-muted-foreground mt-2">Supports .csv files up to 10MB</p>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                  <FileText className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">Need a template?</p>
                    <p className="text-muted-foreground text-xs">Download our sample CSV with the correct format</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Template
                  </Button>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                  <strong>Required column:</strong> Phone/WhatsApp number (with country code, e.g. +919876543210). All other columns are optional.
                </div>
              </div>
            )}

            {/* Step 2: Column Mapping */}
            {importStep === "map" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-sm">
                  <FileText className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-emerald-800 dark:text-emerald-200">
                    <strong>{csvFileName}</strong> — {csvRows.length} rows detected, {csvHeaders.length} columns
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Map your CSV columns to contact fields:</p>
                  <div className="space-y-3">
                    {(Object.keys(FIELD_LABELS) as (keyof ColumnMap)[]).map((field) => (
                      <div key={field} className="flex items-center gap-3">
                        <Label className={`w-44 text-xs flex-shrink-0 ${field === "waId" ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                          {FIELD_LABELS[field]}
                        </Label>
                        <select
                          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={columnMap[field]}
                          onChange={(e) => setColumnMap((m) => ({ ...m, [field]: e.target.value }))}
                        >
                          <option value="">— Skip —</option>
                          {csvHeaders.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        {columnMap[field] && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {csvRows[0]?.[csvHeaders.indexOf(columnMap[field])]?.slice(0, 15) || "—"}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setImportStep("upload")}>
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!columnMap.waId}
                    onClick={() => setImportStep("preview")}
                  >
                    Preview Import <ChevronRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {importStep === "preview" && (
              <div className="space-y-4">
                <div className="p-3 bg-muted/40 rounded-lg text-sm">
                  <p className="font-medium mb-1">Ready to import <strong>{csvRows.length} contacts</strong></p>
                  <p className="text-muted-foreground text-xs">Preview of first 5 contacts. Duplicate phone numbers will be updated, not duplicated.</p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewContacts.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-card border border-border rounded-lg text-xs">
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700">
                          {(c.name || c.waId || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{c.name || "No name"}</p>
                        <p className="text-muted-foreground">{c.waId || <span className="text-red-500">No phone number</span>}</p>
                      </div>
                      {c.email && <span className="text-muted-foreground truncate max-w-[100px]">{c.email}</span>}
                      {c.tags.length > 0 && (
                        <div className="flex gap-1">
                          {c.tags.slice(0, 2).map((t) => <Badge key={t} variant="secondary" className="text-[10px] py-0">{t}</Badge>)}
                        </div>
                      )}
                      {!c.waId && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                    </div>
                  ))}
                  {csvRows.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center py-2">... and {csvRows.length - 5} more contacts</p>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setImportStep("map")}>
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleImport}
                    disabled={bulkImport.isPending}
                  >
                    {bulkImport.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" /> Import {csvRows.length} Contacts</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Done */}
            {importStep === "done" && importResult && (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Import Complete!</h3>
                  <p className="text-muted-foreground text-sm mt-1">Your contacts have been added to the CRM.</p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <p className="text-2xl font-bold text-emerald-600">{importResult.total}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total Rows</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <p className="text-2xl font-bold text-emerald-600">{importResult.imported}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Imported</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <p className="text-2xl font-bold text-amber-600">{importResult.skipped}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Skipped</p>
                  </div>
                </div>

                <Progress value={(importResult.imported / importResult.total) * 100} className="h-2" />

                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => { resetImport(); setImportOpen(false); }}>
                    <X className="h-4 w-4 mr-1.5" /> Close
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { resetImport(); }}>
                    <Upload className="h-4 w-4 mr-1.5" /> Import Another File
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

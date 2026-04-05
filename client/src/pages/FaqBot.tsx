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
import { toast } from "sonner";
import { Plus, Bot, Trash2, Edit2, Loader2, Tag, Search, ChevronDown, ChevronUp } from "lucide-react";

export default function FaqBot() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    question: "",
    answer: "",
    keywords: [] as string[],
    category: "",
    isActive: true,
  });
  const [keywordInput, setKeywordInput] = useState("");

  const { data: faqs = [], refetch } = trpc.faq.list.useQuery();

  const create = trpc.faq.create.useMutation({
    onSuccess: () => { toast.success("FAQ created!"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.faq.update.useMutation({
    onSuccess: () => { toast.success("FAQ updated!"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.faq.delete.useMutation({
    onSuccess: () => { toast.success("FAQ deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = trpc.faq.update.useMutation({ onSuccess: () => refetch() });

  const openCreate = () => {
    setEditing(null);
    setForm({ question: "", answer: "", keywords: [], category: "", isActive: true });
    setKeywordInput("");
    setOpen(true);
  };

  const openEdit = (faq: any) => {
    setEditing(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords || [],
      category: faq.category || "",
      isActive: faq.isActive,
    });
    setKeywordInput("");
    setOpen(true);
  };

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !form.keywords.includes(kw)) {
      setForm((f) => ({ ...f, keywords: [...f.keywords, kw] }));
    }
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    setForm((f) => ({ ...f, keywords: f.keywords.filter((k) => k !== kw) }));
  };

  const handleSubmit = () => {
    if (!form.question || !form.answer) {
      toast.error("Question and answer are required");
      return;
    }
    if (editing) {
      update.mutate({ id: editing, ...form });
    } else {
      create.mutate(form);
    }
  };

  const filtered = faqs.filter((f: any) =>
    !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc: Record<string, any[]>, faq: any) => {
    const cat = faq.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  const isPending = create.isPending || update.isPending;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FAQ Bot</h1>
          <p className="text-muted-foreground text-sm mt-1">Build your knowledge base — the bot answers these automatically</p>
        </div>
        <Button onClick={openCreate} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add FAQ
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total FAQs", value: faqs.length },
          { label: "Active", value: faqs.filter((f: any) => f.isActive).length },
          { label: "Categories", value: new Set(faqs.map((f: any) => f.category || "General")).size },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ list */}
      {Object.keys(grouped).length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No FAQs yet</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
              Add frequently asked questions and the bot will automatically answer them when customers ask.
            </p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Add First FAQ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{category}</h3>
              <div className="space-y-2">
                {(items as any[]).map((faq: any) => (
                  <Card key={faq.id} className={`border-border/50 transition-all hover:shadow-sm ${!faq.isActive ? "opacity-60" : ""}`}>
                    <CardContent className="p-0">
                      <button
                        className="w-full flex items-center gap-3 p-4 text-left"
                        onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{faq.question}</p>
                          {faq.keywords?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {faq.keywords.slice(0, 3).map((kw: string) => (
                                <Badge key={kw} variant="secondary" className="text-xs py-0">{kw}</Badge>
                              ))}
                              {faq.keywords.length > 3 && (
                                <Badge variant="secondary" className="text-xs py-0">+{faq.keywords.length - 3}</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch
                            checked={faq.isActive}
                            onCheckedChange={(v) => toggleActive.mutate({ id: faq.id, isActive: v })}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openEdit(faq); }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); del.mutate({ id: faq.id }); }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          {expanded === faq.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>
                      {expanded === faq.id && (
                        <div className="px-4 pb-4 pt-0 border-t border-border/50">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Question *</Label>
              <Input
                placeholder="e.g. What are your business hours?"
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Answer *</Label>
              <Textarea
                placeholder="e.g. We are open Monday to Saturday, 9 AM to 7 PM."
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Keywords (for matching)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add keyword..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" variant="outline" onClick={addKeyword}>Add</Button>
              </div>
              {form.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeKeyword(kw)}
                    >
                      {kw} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  placeholder="e.g. Pricing, Hours..."
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
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
              {editing ? "Update FAQ" : "Add FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

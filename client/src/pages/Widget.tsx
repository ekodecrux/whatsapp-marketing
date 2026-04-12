import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Code2, Copy, Plus, Trash2, Eye, Settings2, MessageCircle,
  ExternalLink, CheckCircle2, Smartphone, Globe, Zap,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface WidgetConfig {
  waNumber: string;
  welcomeMessage: string;
  buttonText: string;
  buttonColor: string;
  position: "bottom-right" | "bottom-left";
  showAfterSeconds: number;
}

const DEFAULT_CONFIG: WidgetConfig = {
  waNumber: "",
  welcomeMessage: "Hi! I'm interested in your services.",
  buttonText: "Chat with us",
  buttonColor: "#25D366",
  position: "bottom-right",
  showAfterSeconds: 3,
};

export default function Widget() {
  const [createOpen, setCreateOpen] = useState(false);
  const [snippetOpen, setSnippetOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);

  const { data: widgets = [], refetch } = trpc.widget.list.useQuery();
  const createWidget = trpc.widget.create.useMutation();
  const deleteWidget = trpc.widget.delete.useMutation();
  const { data: snippetData } = trpc.widget.getSnippet.useQuery(
    { token: selectedToken! },
    { enabled: !!selectedToken }
  );

  async function handleCreate() {
    if (!newName.trim()) { toast.error("Widget name is required"); return; }
    if (!config.waNumber.trim()) { toast.error("WhatsApp number is required"); return; }
    try {
      await createWidget.mutateAsync({ name: newName, config });
      toast.success("Widget created!");
      setCreateOpen(false);
      setNewName("");
      setConfig(DEFAULT_CONFIG);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create widget");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this widget? The embed code will stop working.")) return;
    try {
      await deleteWidget.mutateAsync({ id });
      toast.success("Widget deleted");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete");
    }
  }

  function openSnippet(token: string) {
    setSelectedToken(token);
    setSnippetOpen(true);
  }

  function copySnippet() {
    if (snippetData?.snippet) {
      navigator.clipboard.writeText(snippetData.snippet);
      toast.success("Snippet copied to clipboard!");
    }
  }

  // Live preview bubble
  const previewBubble = (
    <div className={`relative flex flex-col items-${config.position === "bottom-right" ? "end" : "start"} gap-3`}>
      <div className="bg-white rounded-2xl shadow-xl p-4 max-w-[240px] border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: config.buttonColor }}>
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800">WhatsApp</p>
            <p className="text-[10px] text-green-500">● Online</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mb-3">{config.welcomeMessage}</p>
        <button
          className="w-full text-xs text-white font-semibold py-2 px-3 rounded-xl"
          style={{ backgroundColor: config.buttonColor }}
        >
          {config.buttonText}
        </button>
      </div>
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
        style={{ backgroundColor: config.buttonColor }}
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lead Capture Widget</h1>
            <p className="text-muted-foreground mt-1">Embed a WhatsApp chat bubble on your website to capture leads automatically.</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Widget
          </Button>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Settings2, title: "1. Configure", desc: "Set your WhatsApp number, welcome message, and button style." },
            { icon: Code2, title: "2. Copy Snippet", desc: "Paste the generated HTML snippet into your website's <body> tag." },
            { icon: Zap, title: "3. Capture Leads", desc: "Visitors click the bubble, chat starts, and leads appear in your CRM." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-border bg-card">
                <CardContent className="pt-5 pb-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Widgets list */}
        {widgets.length === 0 ? (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="py-16 text-center">
              <Globe className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No widgets yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Create your first embeddable WhatsApp chat bubble.</p>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Your First Widget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgets.map((w: any) => (
              <Card key={w.id} className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{w.name}</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono">{w.token}</p>
                      </div>
                    </div>
                    <Badge variant={w.isActive ? "default" : "secondary"} className={w.isActive ? "bg-emerald-600 text-white text-xs" : "text-xs"}>
                      {w.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Smartphone className="h-3 w-3" />
                    <span>{(w.config as any)?.waNumber || "No number set"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      onClick={() => openSnippet(w.token)}
                    >
                      <Code2 className="h-3 w-3 mr-1" /> Get Snippet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => {
                        const waNum = (w.config as any)?.waNumber?.replace(/\D/g, "");
                        const msg = encodeURIComponent((w.config as any)?.welcomeMessage || "Hi!");
                        window.open(`https://wa.me/${waNum}?text=${msg}`, "_blank");
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" /> Test
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(w.id)}
                      disabled={deleteWidget.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Widget Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Lead Capture Widget</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="configure">
              <TabsList className="w-full">
                <TabsTrigger value="configure" className="flex-1">Configure</TabsTrigger>
                <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="configure" className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label>Widget Name</Label>
                  <Input placeholder="e.g. Homepage Widget" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp Number <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="+91 98765 43210 (with country code)"
                    value={config.waNumber}
                    onChange={(e) => setConfig({ ...config, waNumber: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Include country code, e.g. +919876543210</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Pre-filled Message</Label>
                  <Input
                    placeholder="Hi! I'm interested in your services."
                    value={config.welcomeMessage}
                    onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Button Text</Label>
                  <Input
                    placeholder="Chat with us"
                    value={config.buttonText}
                    onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Button Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={config.buttonColor}
                        onChange={(e) => setConfig({ ...config, buttonColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border border-border"
                      />
                      <Input
                        value={config.buttonColor}
                        onChange={(e) => setConfig({ ...config, buttonColor: e.target.value })}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Position</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={config.position}
                      onChange={(e) => setConfig({ ...config, position: e.target.value as any })}
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Show popup after (seconds)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={config.showAfterSeconds}
                    onChange={(e) => setConfig({ ...config, showAfterSeconds: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="pt-4">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl p-8 min-h-[300px] flex items-end justify-end relative overflow-hidden">
                  {/* Fake website background */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="h-12 bg-gray-400 mx-4 mt-4 rounded" />
                    <div className="h-4 bg-gray-300 mx-4 mt-3 rounded w-3/4" />
                    <div className="h-4 bg-gray-300 mx-4 mt-2 rounded w-1/2" />
                    <div className="grid grid-cols-3 gap-2 mx-4 mt-4">
                      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-300 rounded" />)}
                    </div>
                  </div>
                  <div className="relative z-10 p-4">
                    {previewBubble}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  This is how the widget will appear on your website.
                </p>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate} disabled={createWidget.isPending}>
                {createWidget.isPending ? "Creating..." : "Create Widget"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Snippet Dialog */}
        <Dialog open={snippetOpen} onOpenChange={setSnippetOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-emerald-600" /> Embed Code
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200">How to install</p>
                  <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Copy the snippet below and paste it just before the <code className="bg-emerald-100 dark:bg-emerald-900 px-1 rounded">&lt;/body&gt;</code> closing tag of your website.
                  </p>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {snippetData?.snippet || "Loading..."}
                </pre>
                <Button
                  size="sm"
                  className="absolute top-3 right-3 bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                  onClick={copySnippet}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/40 rounded-lg text-sm">
                  <p className="font-semibold mb-1">Works with:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>✓ WordPress / Wix / Squarespace</li>
                    <li>✓ React / Next.js / Vue</li>
                    <li>✓ Any HTML website</li>
                    <li>✓ Shopify / WooCommerce</li>
                  </ul>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg text-sm">
                  <p className="font-semibold mb-1">What it does:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>✓ Shows WhatsApp chat bubble</li>
                    <li>✓ Opens WhatsApp with pre-filled message</li>
                    <li>✓ Works on mobile & desktop</li>
                    <li>✓ Zero performance impact</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={copySnippet}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy Snippet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const waNum = snippetData?.widget && (snippetData.widget.config as any)?.waNumber?.replace(/\D/g, "");
                    if (waNum) window.open(`https://wa.me/${waNum}`, "_blank");
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" /> Test on WhatsApp
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

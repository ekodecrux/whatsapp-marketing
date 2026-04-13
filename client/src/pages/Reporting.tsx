import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText, Share2, Copy, Trash2, Plus, Clock, Mail,
  Download, Eye, Calendar, RefreshCw, Link2
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const reportTypeLabels: Record<string, string> = {
  analytics: "Analytics Overview",
  leads: "Leads Report",
  conversations: "Conversations Report",
  broadcast: "Broadcast Report",
};

export default function Reporting() {
  const [shareDialog, setShareDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [shareForm, setShareForm] = useState({ reportType: "analytics" as const, title: "", expiresInDays: "30" });
  const [scheduleForm, setScheduleForm] = useState({ reportType: "analytics" as const, frequency: "weekly" as const, recipientEmails: "" });
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);

  const { data: sharedReports, refetch: refetchShared } = trpc.sharedReports.list.useQuery();
  const { data: scheduledReports, refetch: refetchScheduled } = trpc.scheduledReports.list.useQuery();

  const createShare = trpc.sharedReports.create.useMutation({
    onSuccess: (d) => {
      refetchShared();
      setCreatedShareUrl(`${window.location.origin}/shared/${d.token}`);
      toast.success("Shareable link created!");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteShare = trpc.sharedReports.delete.useMutation({ onSuccess: () => refetchShared() });

  const createSchedule = trpc.scheduledReports.create.useMutation({
    onSuccess: () => { refetchScheduled(); setScheduleDialog(false); toast.success("Scheduled report created!"); },
    onError: (e) => toast.error(e.message),
  });
  const toggleSchedule = trpc.scheduledReports.toggle.useMutation({ onSuccess: () => refetchScheduled() });
  const deleteSchedule = trpc.scheduledReports.delete.useMutation({ onSuccess: () => refetchScheduled() });

  const handleExportPdf = async (reportType: string) => {
    toast.info("Generating PDF report...");
    // Build a simple print-friendly page
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Popup blocked — please allow popups"); return; }
    printWindow.document.write(`
      <html>
        <head>
          <title>WaLeadBot — ${reportTypeLabels[reportType] ?? reportType}</title>
          <style>
            body { font-family: -apple-system, sans-serif; padding: 32px; color: #111; }
            h1 { color: #15803d; }
            .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
            .note { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <h1>WaLeadBot — ${reportTypeLabels[reportType] ?? reportType}</h1>
          <div class="meta">Generated on ${new Date().toLocaleString("en-IN")} · Export from WaLeadBot Dashboard</div>
          <div class="note">
            <strong>Note:</strong> For full data export, use the CSV export on the Leads page or the Analytics dashboard. 
            This PDF confirms the report was generated at the above timestamp.
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reporting & Collaboration</h1>
            <p className="text-muted-foreground text-sm">Share reports, schedule email digests, export PDFs, and collaborate with team comments</p>
          </div>
        </div>

        {/* Quick Export Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(reportTypeLabels).map(([type, label]) => (
            <Card key={type} className="border-border hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <Badge variant="outline" className="text-xs">PDF</Badge>
                </div>
                <div className="font-medium text-sm mb-3">{label}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1 text-xs"
                  onClick={() => handleExportPdf(type)}
                >
                  <Download className="w-3 h-3" /> Export PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="shared">
          <TabsList className="bg-muted">
            <TabsTrigger value="shared">Shared Links</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          </TabsList>

          {/* Shared Links Tab */}
          <TabsContent value="shared" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Create public shareable links for any report — share with clients or stakeholders without requiring login.</p>
              <Button onClick={() => { setShareDialog(true); setCreatedShareUrl(null); }} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Create Share Link
              </Button>
            </div>

            <div className="space-y-2">
              {sharedReports?.map((r) => {
                const shareUrl = `${window.location.origin}/shared/${r.token}`;
                const isExpired = r.expiresAt && new Date() > new Date(r.expiresAt);
                return (
                  <Card key={r.id} className={`border-border ${isExpired ? "opacity-60" : ""}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Link2 className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{r.title ?? reportTypeLabels[r.reportType]}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Eye className="w-3 h-3" /> {r.viewCount} views
                            {r.expiresAt && (
                              <span className={isExpired ? "text-red-500" : ""}>
                                · {isExpired ? "Expired" : `Expires ${new Date(r.expiresAt).toLocaleDateString("en-IN")}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isExpired ? (
                          <Badge className="bg-red-100 text-red-700">Expired</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); }}
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteShare.mutate({ id: r.id })}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {sharedReports?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No shared links yet. Create one to share reports with clients.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Scheduled Reports Tab */}
          <TabsContent value="scheduled" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Automatically email reports to your team on a daily, weekly, or monthly schedule.</p>
              <Button onClick={() => setScheduleDialog(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Schedule Report
              </Button>
            </div>

            <div className="space-y-2">
              {scheduledReports?.map((r) => (
                <Card key={r.id} className="border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-medium text-sm capitalize">{reportTypeLabels[r.reportType]} — {r.frequency}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {(r.recipientEmails as string[])?.join(", ")}
                        </div>
                        {r.nextSendAt && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Next: {new Date(r.nextSendAt).toLocaleDateString("en-IN")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={r.isActive === 1}
                        onCheckedChange={(v) => toggleSchedule.mutate({ id: r.id, isActive: v ? 1 : 0 })}
                      />
                      <Button variant="ghost" size="sm" onClick={() => deleteSchedule.mutate({ id: r.id })}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {scheduledReports?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No scheduled reports. Set one up to get automatic email digests.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Share Link Dialog */}
      <Dialog open={shareDialog} onOpenChange={setShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shareable Report Link</DialogTitle>
          </DialogHeader>
          {createdShareUrl ? (
            <div className="space-y-4 py-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">Share link created!</p>
              </div>
              <div className="flex items-center gap-2">
                <Input value={createdShareUrl} readOnly className="text-xs" />
                <Button size="sm" onClick={() => { navigator.clipboard.writeText(createdShareUrl); toast.success("Copied!"); }}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">Anyone with this link can view the report without logging in.</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Report Type</Label>
                <Select value={shareForm.reportType} onValueChange={(v) => setShareForm(f => ({ ...f, reportType: v as typeof shareForm.reportType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(reportTypeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Title (optional)</Label>
                <Input placeholder="Q1 2026 Leads Report" value={shareForm.title} onChange={(e) => setShareForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Expires In (days)</Label>
                <Select value={shareForm.expiresInDays} onValueChange={(v) => setShareForm(f => ({ ...f, expiresInDays: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="0">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialog(false)}>Close</Button>
            {!createdShareUrl && (
              <Button
                onClick={() => createShare.mutate({
                  reportType: shareForm.reportType,
                  title: shareForm.title || undefined,
                  expiresInDays: shareForm.expiresInDays !== "0" ? Number(shareForm.expiresInDays) : undefined,
                })}
                disabled={createShare.isPending}
              >
                {createShare.isPending ? "Creating..." : "Create Link"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Report Dialog */}
      <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Automated Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Report Type</Label>
              <Select value={scheduleForm.reportType} onValueChange={(v) => setScheduleForm(f => ({ ...f, reportType: v as typeof scheduleForm.reportType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(reportTypeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Frequency</Label>
              <Select value={scheduleForm.frequency} onValueChange={(v) => setScheduleForm(f => ({ ...f, frequency: v as typeof scheduleForm.frequency }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Recipient Emails</Label>
              <Input
                placeholder="email1@company.com, email2@company.com"
                value={scheduleForm.recipientEmails}
                onChange={(e) => setScheduleForm(f => ({ ...f, recipientEmails: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const emails = scheduleForm.recipientEmails.split(",").map(e => e.trim()).filter(Boolean);
                if (emails.length === 0) { toast.error("Add at least one email"); return; }
                createSchedule.mutate({ reportType: scheduleForm.reportType, frequency: scheduleForm.frequency, recipientEmails: emails });
              }}
              disabled={createSchedule.isPending}
            >
              {createSchedule.isPending ? "Scheduling..." : "Schedule Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Fix missing import
function CheckCircle({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

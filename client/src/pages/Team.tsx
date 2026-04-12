import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Users, UserPlus, Trash2, Shield, Eye, Crown, Mail, Building2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const ROLE_CONFIG = {
  admin: { label: "Admin", icon: Crown, color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
  member: { label: "Member", icon: Shield, color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  viewer: { label: "Viewer", icon: Eye, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

export default function Team() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");

  const { data: members = [], refetch } = trpc.members.list.useQuery();
  const { data: myBusinesses = [] } = trpc.members.myBusinesses.useQuery();
  const inviteMember = trpc.members.invite.useMutation();
  const removeMember = trpc.members.remove.useMutation();
  const updateRole = trpc.members.updateRole.useMutation();

  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) { toast.error("Valid email required"); return; }
    try {
      await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail("");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to invite");
    }
  }

  async function handleRemove(id: number, name: string) {
    if (!confirm(`Remove ${name || "this member"} from your team?`)) return;
    try {
      await removeMember.mutateAsync({ memberId: id });
      toast.success("Member removed");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove");
    }
  }

  async function handleRoleChange(id: number, role: "admin" | "member" | "viewer") {
    try {
      await updateRole.mutateAsync({ memberId: id, role });
      toast.success("Role updated");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update role");
    }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
            <p className="text-muted-foreground mt-1">Manage who has access to your WaLeadBot workspace.</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Invite Member
          </Button>
        </div>

        {/* Role legend */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <Card key={key} className="border-border bg-card">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{cfg.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {key === "admin" ? "Full access — can manage settings, members, and all data" :
                     key === "member" ? "Can view and manage leads, conversations, and contacts" :
                     "Read-only access to dashboard and analytics"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Members list */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Team ({members.length} {members.length === 1 ? "member" : "members"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-10">
                <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No team members yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Invite colleagues to collaborate on leads and conversations.</p>
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" /> Invite First Member
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {members.map((m: any) => {
                  const roleCfg = ROLE_CONFIG[m.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.member;
                  const RoleIcon = roleCfg.icon;
                  const initials = (m.userName || m.inviteEmail || "?").slice(0, 2).toUpperCase();
                  return (
                    <div key={m.id} className="flex items-center gap-4 py-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.userName || m.inviteEmail}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {m.inviteEmail}
                          {!m.inviteAccepted && <Badge variant="outline" className="text-[10px] h-4 ml-1">Pending</Badge>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value as any)}
                          className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer ${roleCfg.color}`}
                          disabled={updateRole.isPending}
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleRemove(m.id, m.userName || m.inviteEmail)}
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Businesses */}
        {myBusinesses.length > 1 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Your Workspaces ({myBusinesses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {myBusinesses.map((biz: any) => (
                  <div key={biz.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{biz.name}</p>
                      <p className="text-xs text-muted-foreground">{biz.industry || "Business"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{biz.plan || "free"}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invite Dialog */}
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(ROLE_CONFIG) as [typeof inviteRole, typeof ROLE_CONFIG[typeof inviteRole]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setInviteRole(key)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          inviteRole === key ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20" : "border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1 text-muted-foreground" />
                        <p className="text-xs font-semibold">{cfg.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg">
                {inviteRole === "admin" ? "⚠️ Admins have full access including settings and billing." :
                 inviteRole === "member" ? "Members can manage leads, conversations, and contacts." :
                 "Viewers can only see data — they cannot make changes."}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleInvite} disabled={inviteMember.isPending}>
                {inviteMember.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

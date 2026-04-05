import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Users, MessageCircle, TrendingUp, Bot, Zap, ArrowRight,
  MessageSquare, BarChart3, CheckCircle2, Clock, Loader2,
  Megaphone, GitBranch
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subDays } from "date-fns";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.analytics.stats.useQuery();
  const { data: business } = trpc.business.get.useQuery();
  const { data: waConfig } = trpc.whatsapp.getConfig.useQuery();
  const { data: recentActivity } = trpc.analytics.recentActivity.useQuery();

  // Generate chart data from recentLeads
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const found = (stats?.recentLeads || []).find((r: any) => r.date === dateStr);
    return { date: format(date, "MMM d"), leads: found ? Number(found.count) : 0 };
  });

  const kpis = [
    { title: "Total Leads", value: stats?.totalLeads ?? 0, icon: <TrendingUp className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50", change: "+12%" },
    { title: "Contacts", value: stats?.totalContacts ?? 0, icon: <Users className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-50", change: "+8%" },
    { title: "Conversations", value: stats?.totalConversations ?? 0, icon: <MessageCircle className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-50", change: "+24%" },
    { title: "Auto-Replies", value: stats?.autoReplies ?? 0, icon: <Bot className="w-5 h-5" />, color: "text-orange-600", bg: "bg-orange-50", change: "+18%" },
  ];

  const quickActions = [
    { label: "Set up Auto-Reply", icon: <Zap className="w-4 h-4" />, path: "/dashboard/auto-reply", color: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" },
    { label: "Add FAQ", icon: <Bot className="w-4 h-4" />, path: "/dashboard/faq-bot", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
    { label: "Create Broadcast", icon: <Megaphone className="w-4 h-4" />, path: "/dashboard/broadcast", color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
    { label: "Build Flow", icon: <GitBranch className="w-4 h-4" />, path: "/dashboard/flows", color: "bg-teal-50 text-teal-700 hover:bg-teal-100" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good morning{business ? `, ${business.name}` : ""}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's what's happening with your WhatsApp business today.</p>
        </div>
        <div className="flex items-center gap-3">
          {!waConfig?.isConnected && (
            <Button size="sm" onClick={() => navigate("/dashboard/whatsapp")} className="shadow-sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Connect WhatsApp
            </Button>
          )}
        </div>
      </div>

      {/* WhatsApp not connected banner */}
      {!waConfig?.isConnected && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-800 text-sm">WhatsApp not connected</p>
                <p className="text-yellow-700 text-xs">Connect your WhatsApp Business number to start receiving messages and leads.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/whatsapp")} className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
              Connect Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center ${kpi.color}`}>
                  {kpi.icon}
                </div>
                <Badge variant="secondary" className="text-xs text-green-600 bg-green-50">
                  {kpi.change}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-foreground">{kpi.value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{kpi.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leads chart */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Leads This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.42 0.17 150)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="oklch(0.42 0.17 150)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.02 150)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.88 0.02 150)", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="oklch(0.42 0.17 150)"
                  strokeWidth={2}
                  fill="url(#leadsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead status breakdown */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "New", value: stats?.newLeads ?? 0, color: "bg-blue-500", pct: stats?.totalLeads ? Math.round(((stats?.newLeads ?? 0) / stats.totalLeads) * 100) : 0 },
                { label: "Open Conversations", value: stats?.openConversations ?? 0, color: "bg-green-500", pct: stats?.totalConversations ? Math.round(((stats?.openConversations ?? 0) / stats.totalConversations) * 100) : 0 },
                { label: "Won", value: stats?.wonLeads ?? 0, color: "bg-emerald-500", pct: stats?.totalLeads ? Math.round(((stats?.wonLeads ?? 0) / stats.totalLeads) * 100) : 0 },
                { label: "Messages Sent", value: stats?.totalMessages ?? 0, color: "bg-purple-500", pct: 100 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-foreground">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.max(item.pct, 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions + Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl text-sm font-medium transition-colors ${action.color}`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-3 gap-3 text-center">
                <button onClick={() => navigate("/dashboard/leads")} className="p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="text-xl font-bold text-foreground">{stats?.newLeads ?? 0}</div>
                  <div className="text-xs text-muted-foreground">New Leads</div>
                </button>
                <button onClick={() => navigate("/dashboard/conversations")} className="p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="text-xl font-bold text-foreground">{stats?.openConversations ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Open Chats</div>
                </button>
                <button onClick={() => navigate("/dashboard/analytics")} className="p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="text-xl font-bold text-foreground">{stats?.autoReplies ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Auto-Replies</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 6).map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Activity will appear here once you connect WhatsApp</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

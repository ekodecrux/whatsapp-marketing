import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, MessageCircle, Users, Bot, Zap, BarChart3 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { subDays, format } from "date-fns";

const COLORS = ["oklch(0.42 0.17 150)", "oklch(0.60 0.15 200)", "oklch(0.70 0.12 80)", "oklch(0.55 0.20 30)", "oklch(0.65 0.18 280)", "oklch(0.55 0.22 25)"];

export default function Analytics() {
  const { data: stats, isLoading } = trpc.analytics.stats.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Build 7-day leads chart
  const leadsChart = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const found = (stats?.recentLeads || []).find((r: any) => r.date === dateStr);
    return { date: format(date, "EEE"), leads: found ? Number(found.count) : 0 };
  });

  // Lead status pie
  const leadStatusData = [
    { name: "New", value: stats?.newLeads || 0 },
    { name: "Contacted", value: Math.max(0, (stats?.totalLeads || 0) - (stats?.newLeads || 0) - (stats?.wonLeads || 0)) },
    { name: "Won", value: stats?.wonLeads || 0 },
  ].filter((d) => d.value > 0);

  // Conversation status
  const convoData = [
    { name: "Open", value: stats?.openConversations || 0 },
    { name: "Resolved", value: Math.max(0, (stats?.totalConversations || 0) - (stats?.openConversations || 0)) },
  ].filter((d) => d.value > 0);

  const kpis = [
    { title: "Total Leads", value: stats?.totalLeads ?? 0, sub: `${stats?.newLeads ?? 0} new`, icon: <TrendingUp className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Conversations", value: stats?.totalConversations ?? 0, sub: `${stats?.openConversations ?? 0} open`, icon: <MessageCircle className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-50" },
    { title: "Contacts", value: stats?.totalContacts ?? 0, sub: "from WhatsApp", icon: <Users className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Messages", value: stats?.totalMessages ?? 0, sub: `${stats?.autoReplies ?? 0} auto-replies`, icon: <Bot className="w-5 h-5" />, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your WhatsApp business performance</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-border/50">
            <CardContent className="p-5">
              <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center ${kpi.color} mb-3`}>
                {kpi.icon}
              </div>
              <div className="text-2xl font-bold text-foreground">{kpi.value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{kpi.title}</div>
              <div className="text-xs text-muted-foreground/70 mt-0.5">{kpi.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Leads — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={leadsChart}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.42 0.17 150)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="oklch(0.42 0.17 150)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 150)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="leads" stroke="oklch(0.42 0.17 150)" strokeWidth={2.5} fill="url(#grad1)" name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Status</CardTitle>
          </CardHeader>
          <CardContent>
            {leadStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={leadStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {leadStatusData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {leadStatusData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Conversation Status</CardTitle>
          </CardHeader>
          <CardContent>
            {convoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={convoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 150)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="value" fill="oklch(0.42 0.17 150)" radius={[6, 6, 0, 0]} name="Conversations" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No conversations yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Automation Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {[
                { label: "Auto-Reply Rate", value: stats?.totalMessages ? Math.round(((stats?.autoReplies || 0) / stats.totalMessages) * 100) : 0, color: "bg-green-500", suffix: "%" },
                { label: "Lead Conversion", value: stats?.totalContacts ? Math.round(((stats?.totalLeads || 0) / stats.totalContacts) * 100) : 0, color: "bg-blue-500", suffix: "%" },
                { label: "Resolution Rate", value: stats?.totalConversations ? Math.round((((stats?.totalConversations || 0) - (stats?.openConversations || 0)) / Math.max(stats.totalConversations, 1)) * 100) : 0, color: "bg-purple-500", suffix: "%" },
                { label: "Won Leads", value: stats?.totalLeads ? Math.round(((stats?.wonLeads || 0) / Math.max(stats.totalLeads, 1)) * 100) : 0, color: "bg-orange-500", suffix: "%" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-bold text-foreground">{m.value}{m.suffix}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${Math.max(m.value, 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

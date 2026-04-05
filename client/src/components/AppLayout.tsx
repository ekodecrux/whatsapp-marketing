import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  MessageSquare, LayoutDashboard, Users, MessageCircle, Bot,
  Zap, Megaphone, BarChart3, Settings, LogOut, ChevronLeft,
  ChevronRight, HelpCircle, Wifi, WifiOff, Menu, X, GitBranch
} from "lucide-react";

const navItems = [
  { path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
  { path: "/dashboard/conversations", icon: <MessageCircle className="w-5 h-5" />, label: "Conversations" },
  { path: "/dashboard/leads", icon: <Users className="w-5 h-5" />, label: "Leads" },
  { path: "/dashboard/contacts", icon: <Users className="w-5 h-5" />, label: "Contacts" },
  { path: "/dashboard/auto-reply", icon: <Zap className="w-5 h-5" />, label: "Auto-Reply" },
  { path: "/dashboard/faq-bot", icon: <Bot className="w-5 h-5" />, label: "FAQ Bot" },
  { path: "/dashboard/flows", icon: <GitBranch className="w-5 h-5" />, label: "Flows" },
  { path: "/dashboard/broadcast", icon: <Megaphone className="w-5 h-5" />, label: "Broadcast" },
  { path: "/dashboard/analytics", icon: <BarChart3 className="w-5 h-5" />, label: "Analytics" },
  { path: "/dashboard/whatsapp", icon: <MessageSquare className="w-5 h-5" />, label: "WhatsApp" },
  { path: "/dashboard/settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: business } = trpc.business.get.useQuery();
  const { data: waConfig } = trpc.whatsapp.getConfig.useQuery();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { navigate("/login"); toast.success("Signed out"); },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (user === null) navigate("/login");
  }, [user]);

  if (!user) return null;

  const initials = (user.name || user.email || "U").slice(0, 2).toUpperCase();
  const isConnected = waConfig?.isConnected;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-sidebar-foreground text-sm leading-tight">WaLeadBot</div>
            {business && <div className="text-xs text-sidebar-foreground/50 truncate max-w-[120px]">{business.name}</div>}
          </div>
        )}
      </div>

      {/* WhatsApp status */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${isConnected ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? "WhatsApp Connected" : "WhatsApp Not Connected"}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
          return collapsed ? (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
                >
                  {item.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className={`border-t border-sidebar-border p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => logout.mutate()}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign Out</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-medium text-sidebar-foreground truncate">{user.name || user.email}</div>
              <div className="text-xs text-sidebar-foreground/50 truncate">{user.email}</div>
            </div>
            <button
              onClick={() => logout.mutate()}
              className="flex-shrink-0 p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-sidebar transition-all duration-300 flex-shrink-0 ${collapsed ? "w-16" : "w-60"}`}>
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-full w-5 h-10 bg-sidebar border border-sidebar-border rounded-r-lg flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors z-10"
          style={{ left: collapsed ? "4rem" : "15rem" }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 bg-sidebar flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">WaLeadBot</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

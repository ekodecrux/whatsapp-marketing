import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversations";
import Leads from "./pages/Leads";
import Contacts from "./pages/Contacts";
import AutoReply from "./pages/AutoReply";
import FaqBot from "./pages/FaqBot";
import Flows from "./pages/Flows";
import Broadcast from "./pages/Broadcast";
import Analytics from "./pages/Analytics";
import WhatsAppConnect from "./pages/WhatsAppConnect";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";

function DashboardRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/conversations" component={Conversations} />
        <Route path="/dashboard/leads" component={Leads} />
        <Route path="/dashboard/contacts" component={Contacts} />
        <Route path="/dashboard/auto-reply" component={AutoReply} />
        <Route path="/dashboard/faq-bot" component={FaqBot} />
        <Route path="/dashboard/flows" component={Flows} />
        <Route path="/dashboard/broadcast" component={Broadcast} />
        <Route path="/dashboard/analytics" component={Analytics} />
        <Route path="/dashboard/whatsapp" component={WhatsAppConnect} />
        <Route path="/dashboard/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard/:rest*" component={DashboardRouter} />
      <Route path="/dashboard" component={DashboardRouter} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

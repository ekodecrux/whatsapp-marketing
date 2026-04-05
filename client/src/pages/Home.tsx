import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare, Zap, Users, Bot, Megaphone, BarChart3,
  CheckCircle2, ArrowRight, Star, Building2, GraduationCap,
  Scissors, Home as HomeIcon, ChevronRight, Shield, Clock, Sparkles
} from "lucide-react";

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Smart Auto-Replies",
    desc: "Respond instantly to customer queries 24/7 with keyword-triggered rules and intelligent matching.",
    color: "bg-yellow-50 text-yellow-600",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Lead Capture CRM",
    desc: "Automatically capture leads from WhatsApp conversations and manage them in a built-in CRM.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "FAQ Bot",
    desc: "Build a knowledge base of Q&As. The bot answers common questions automatically, around the clock.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: <Megaphone className="w-6 h-6" />,
    title: "Broadcast Campaigns",
    desc: "Send bulk promotional messages to all contacts or targeted segments with one click.",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Conversation Flows",
    desc: "Build multi-step automated flows that guide customers through qualifying questions and capture data.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Analytics Dashboard",
    desc: "Track leads, message volumes, auto-reply rates, and conversion metrics in real-time.",
    color: "bg-orange-50 text-orange-600",
  },
];

const industries = [
  { icon: <Building2 className="w-5 h-5" />, name: "Clinics & Hospitals" },
  { icon: <HomeIcon className="w-5 h-5" />, name: "Real Estate" },
  { icon: <GraduationCap className="w-5 h-5" />, name: "Tuition Centers" },
  { icon: <Scissors className="w-5 h-5" />, name: "Salons & Spas" },
  { icon: <Building2 className="w-5 h-5" />, name: "Local Services" },
  { icon: <Star className="w-5 h-5" />, name: "Retail Shops" },
];

const plans = [
  {
    name: "Starter",
    price: "₹299",
    period: "/month",
    desc: "Perfect for small businesses just getting started",
    features: ["500 messages/month", "Auto-reply rules (5)", "FAQ Bot (10 Q&As)", "Basic CRM", "Email support"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Growth",
    price: "₹599",
    period: "/month",
    desc: "For growing businesses with more volume",
    features: ["5,000 messages/month", "Auto-reply rules (unlimited)", "FAQ Bot (unlimited)", "Full CRM + Analytics", "Broadcast campaigns", "Conversation flows", "Priority support"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/month",
    desc: "For high-volume businesses and agencies",
    features: ["Unlimited messages", "Everything in Growth", "Multiple WhatsApp numbers", "Team members (5)", "API access", "Dedicated support"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg">WaLeadBot</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#industries" className="hover:text-foreground transition-colors">Industries</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign In</Button>
            <Button size="sm" onClick={() => navigate("/login")} className="shadow-sm">
              Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[oklch(0.97_0.03_150)] to-white pt-20 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.90_0.08_150)_0%,transparent_60%)] opacity-40" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            WhatsApp Business Automation for India
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
            Turn WhatsApp into your
            <span className="text-primary block mt-1">best salesperson</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Auto-reply to customers, capture leads, answer FAQs, and broadcast offers — all from one elegant dashboard. Built for Indian SMBs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/login")} className="px-8 shadow-lg shadow-primary/25 text-base">
              Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="px-8 text-base">
              See Features
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
            {["No credit card required", "14-day free trial", "Cancel anytime"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="py-16 bg-[oklch(0.98_0.01_150)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wide">
            Trusted by businesses across India
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {industries.map((ind) => (
              <div key={ind.name} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-border/50 hover:shadow-sm transition-shadow text-center">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  {ind.icon}
                </div>
                <span className="text-xs font-medium text-foreground">{ind.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Everything you need to grow</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              A complete WhatsApp automation toolkit built specifically for small and medium businesses.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-border/50 hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center mb-4`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why WhatsApp */}
      <section className="py-20 bg-gradient-to-br from-primary to-[oklch(0.35_0.18_150)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Why WhatsApp for your business?</h2>
              <div className="space-y-4">
                {[
                  { icon: <Users className="w-5 h-5" />, text: "500M+ WhatsApp users in India — your customers are already there" },
                  { icon: <MessageSquare className="w-5 h-5" />, text: "98% open rate vs. 20% for email — messages actually get read" },
                  { icon: <Clock className="w-5 h-5" />, text: "Customers expect instant replies — automation delivers 24/7" },
                  { icon: <Shield className="w-5 h-5" />, text: "Meta-verified business profile builds trust and credibility" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "500M+", label: "Indian WhatsApp Users" },
                { value: "98%", label: "Message Open Rate" },
                { value: "3×", label: "More Leads vs. Email" },
                { value: "24/7", label: "Automated Responses" },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur rounded-2xl p-5 text-white text-center border border-white/20">
                  <div className="text-3xl font-extrabold mb-1">{s.value}</div>
                  <div className="text-sm text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you're ready. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`border-2 relative ${plan.highlight ? "border-primary shadow-xl shadow-primary/10" : "border-border/50"}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-sm">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground text-lg mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm mb-1">{plan.period}</span>
                  </div>
                  <Button
                    className={`w-full mb-6 ${plan.highlight ? "" : "variant-outline"}`}
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => navigate("/login")}
                  >
                    {plan.cta}
                  </Button>
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[oklch(0.97_0.03_150)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to automate your WhatsApp?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of Indian businesses using WaLeadBot to capture more leads and save hours every day.
          </p>
          <Button size="lg" onClick={() => navigate("/login")} className="px-10 shadow-lg shadow-primary/25 text-base">
            Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">WaLeadBot</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 WaLeadBot. Built for Indian SMBs.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Building2, MessageSquare, Bot, Zap, CheckCircle2,
  ArrowRight, ArrowLeft, Loader2, Sparkles, ExternalLink
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Business Profile", desc: "Tell us about your business", icon: <Building2 className="w-5 h-5" /> },
  { id: 2, title: "Connect WhatsApp", desc: "Link your WhatsApp Business number", icon: <MessageSquare className="w-5 h-5" /> },
  { id: 3, title: "Your First FAQ", desc: "Add a common question your customers ask", icon: <Bot className="w-5 h-5" /> },
  { id: 4, title: "Welcome Message", desc: "Set up an auto-reply for new contacts", icon: <Zap className="w-5 h-5" /> },
];

const INDUSTRIES = [
  "Clinic / Hospital", "Real Estate", "Tuition / Education",
  "Salon / Spa", "Restaurant / Food", "Retail Shop",
  "Gym / Fitness", "Travel Agency", "Legal Services", "Other",
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  // Step 1 — Business
  const [bizName, setBizName] = useState("");
  const [bizIndustry, setBizIndustry] = useState("");
  const [bizPhone, setBizPhone] = useState("");

  // Step 2 — WhatsApp
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("waleadbot_verify_" + Math.random().toString(36).slice(2, 10));

  // Step 3 — FAQ
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  // Step 4 — Auto-reply
  const [welcomeMsg, setWelcomeMsg] = useState("Hi! 👋 Thanks for reaching out to us. We'll get back to you shortly. How can we help you today?");

  const { data: waConfig } = trpc.whatsapp.getWebhookUrl.useQuery();
  const webhookUrl = waConfig?.webhookUrl ?? "";

  const createBusiness = trpc.business.create.useMutation();
  const saveWaConfig = trpc.whatsapp.saveConfig.useMutation();
  const createFaq = trpc.faq.create.useMutation();
  const createAutoReply = trpc.autoReply.create.useMutation();

  const isLoading =
    createBusiness.isPending || saveWaConfig.isPending ||
    createFaq.isPending || createAutoReply.isPending;

  const progress = ((step - 1) / STEPS.length) * 100;

  async function handleNext() {
    if (step === 1) {
      if (!bizName.trim()) { toast.error("Business name is required"); return; }
      try {
        await createBusiness.mutateAsync({ name: bizName, industry: bizIndustry, phone: bizPhone });
        setStep(2);
      } catch (e: any) {
        if (e?.message?.includes("already exists")) {
          // Business already created, just advance
          setStep(2);
        } else {
          toast.error(e?.message || "Failed to create business");
        }
      }
    } else if (step === 2) {
      if (phoneNumberId && wabaId && accessToken) {
        try {
          await saveWaConfig.mutateAsync({ phoneNumberId, wabaId, accessToken, verifyToken });
          toast.success("WhatsApp connected!");
        } catch (e: any) {
          toast.error(e?.message || "Failed to save WhatsApp config");
          return;
        }
      }
      setStep(3);
    } else if (step === 3) {
      if (faqQuestion.trim() && faqAnswer.trim()) {
        try {
          await createFaq.mutateAsync({ question: faqQuestion, answer: faqAnswer });
          toast.success("FAQ added!");
        } catch (e: any) {
          toast.error(e?.message || "Failed to add FAQ");
          return;
        }
      }
      setStep(4);
    } else if (step === 4) {
      if (welcomeMsg.trim()) {
        try {
          await createAutoReply.mutateAsync({
            name: "Welcome Message",
            triggerType: "first_message",
            responseType: "text",
            responseText: welcomeMsg,
            isActive: true,
            priority: 10,
          });
          toast.success("Welcome message configured!");
        } catch (e: any) {
          toast.error(e?.message || "Failed to create auto-reply");
          return;
        }
      }
      navigate("/dashboard");
    }
  }

  function handleSkip() {
    if (step < 4) setStep(step + 1);
    else navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.97_0.03_150)] to-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-white/80 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">WaLeadBot</span>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          Step {step} of {STEPS.length}
        </Badge>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress + (100 / STEPS.length)}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {STEPS.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s.id < step ? "bg-primary text-primary-foreground" :
                  s.id === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {s.id < step ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                {s.id < STEPS.length && (
                  <div className={`w-8 h-0.5 ${s.id < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step card */}
          <Card className="border-border/50 shadow-xl shadow-black/5">
            <CardContent className="p-8">
              {/* Step header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  {STEPS[step - 1].icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{STEPS[step - 1].title}</h2>
                  <p className="text-sm text-muted-foreground">{STEPS[step - 1].desc}</p>
                </div>
              </div>

              {/* ── Step 1: Business Profile ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Business Name <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="e.g. Sharma Dental Clinic"
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Industry</Label>
                    <Select value={bizIndustry} onValueChange={setBizIndustry}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select your industry..." />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Business Phone</Label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={bizPhone}
                      onChange={(e) => setBizPhone(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/10 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-primary inline mr-1.5" />
                    You can update all these details later in Settings.
                  </div>
                </div>
              )}

              {/* ── Step 2: WhatsApp Connect ── */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 space-y-2">
                    <p className="font-semibold">How to get your credentials:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Meta Developer Console <ExternalLink className="w-3 h-3 inline" /></a></li>
                      <li>Create a WhatsApp Business App</li>
                      <li>Copy Phone Number ID, WABA ID, and Access Token</li>
                      <li>Set your webhook URL to the one below</li>
                    </ol>
                  </div>

                  {webhookUrl && (
                    <div className="space-y-1.5">
                      <Label>Your Webhook URL</Label>
                      <div className="flex gap-2">
                        <Input value={webhookUrl} readOnly className="h-10 font-mono text-xs bg-muted" />
                        <Button
                          variant="outline" size="sm"
                          onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copied!"); }}
                        >Copy</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Verify token: <code className="bg-muted px-1 rounded">{verifyToken}</code></p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Phone Number ID</Label>
                    <Input placeholder="1234567890" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} className="h-11 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>WhatsApp Business Account ID (WABA)</Label>
                    <Input placeholder="9876543210" value={wabaId} onChange={(e) => setWabaId(e.target.value)} className="h-11 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Access Token</Label>
                    <Input placeholder="EAAxxxxxxxx..." value={accessToken} onChange={(e) => setAccessToken(e.target.value)} className="h-11 font-mono text-xs" type="password" />
                  </div>
                  <p className="text-xs text-muted-foreground">You can skip this step and connect WhatsApp later from the WhatsApp page.</p>
                </div>
              )}

              {/* ── Step 3: First FAQ ── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 text-sm text-muted-foreground">
                    <Bot className="w-4 h-4 text-primary inline mr-1.5" />
                    The FAQ bot automatically answers these questions when customers send matching messages.
                  </div>
                  <div className="space-y-1.5">
                    <Label>Common Question</Label>
                    <Input
                      placeholder="e.g. What are your working hours?"
                      value={faqQuestion}
                      onChange={(e) => setFaqQuestion(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Your Answer</Label>
                    <Textarea
                      placeholder="e.g. We are open Monday to Saturday, 9 AM to 7 PM. Sundays by appointment only."
                      value={faqAnswer}
                      onChange={(e) => setFaqAnswer(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* FAQ examples */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Popular FAQ examples</p>
                    {[
                      { q: "What are your working hours?", a: "We are open Mon–Sat, 9 AM to 7 PM." },
                      { q: "Where are you located?", a: "We are located at [your address]. Google Maps: [link]" },
                      { q: "How do I book an appointment?", a: "Reply with your name and preferred date/time and we'll confirm!" },
                    ].map((ex) => (
                      <button
                        key={ex.q}
                        onClick={() => { setFaqQuestion(ex.q); setFaqAnswer(ex.a); }}
                        className="w-full text-left p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm"
                      >
                        <div className="font-medium text-foreground">{ex.q}</div>
                        <div className="text-muted-foreground text-xs mt-0.5 truncate">{ex.a}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 4: Welcome Message ── */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4 text-primary inline mr-1.5" />
                    This message is sent automatically when someone messages you for the first time.
                  </div>
                  <div className="space-y-1.5">
                    <Label>Welcome Message</Label>
                    <Textarea
                      value={welcomeMsg}
                      onChange={(e) => setWelcomeMsg(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">{welcomeMsg.length} characters</p>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
                    <div className="bg-[#e5ddd5] rounded-xl p-4">
                      <div className="max-w-[80%] ml-auto">
                        <div className="msg-bubble-out px-4 py-2.5 text-sm text-white">
                          {welcomeMsg || "Your welcome message will appear here..."}
                        </div>
                        <div className="text-right text-xs text-[#667781] mt-1">Just now ✓✓</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-sm font-semibold text-green-800 mb-1">🎉 You're almost done!</p>
                    <p className="text-sm text-green-700">After this step, your WaLeadBot dashboard will be ready. You can add more FAQs, auto-reply rules, and start capturing leads.</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
                <div className="flex gap-2">
                  {step > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} disabled={isLoading}>
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                    </Button>
                  )}
                  {step > 1 && (
                    <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isLoading} className="text-muted-foreground">
                      Skip
                    </Button>
                  )}
                </div>
                <Button onClick={handleNext} disabled={isLoading} className="px-6">
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : step === 4 ? (
                    <><Sparkles className="w-4 h-4 mr-2" /> Go to Dashboard</>
                  ) : (
                    <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            All steps are optional except Step 1. You can configure everything later from the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  MessageSquare, Mail, Phone, ArrowRight, ArrowLeft,
  Loader2, Shield, Smartphone, MessageCircle,
} from "lucide-react";

type Channel = "email" | "sms" | "whatsapp";
type Step = "method" | "identifier" | "otp";

const CHANNEL_CONFIG = {
  email: {
    icon: Mail,
    label: "Email OTP",
    desc: "Get a code in your inbox",
    placeholder: "you@example.com",
    inputType: "email",
    color: "from-blue-500 to-indigo-600",
  },
  sms: {
    icon: Phone,
    label: "SMS OTP",
    desc: "Get a code via text message",
    placeholder: "+91 98765 43210",
    inputType: "tel",
    color: "from-emerald-500 to-green-600",
  },
  whatsapp: {
    icon: MessageCircle,
    label: "WhatsApp OTP",
    desc: "Get a code on WhatsApp",
    placeholder: "+91 98765 43210",
    inputType: "tel",
    color: "from-teal-500 to-emerald-600",
  },
};

export default function Login() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("method");
  const [channel, setChannel] = useState<Channel>("email");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendEmailOtp = trpc.otp.sendOtp.useMutation({
    onSuccess: (data) => {
      setStep("otp");
      toast.success("OTP sent to your email!");
      if (data.devOtp) toast.info(`Dev OTP: ${data.devOtp}`, { duration: 30000 });
    },
    onError: (err) => toast.error(err.message),
  });

  const sendSmsOtp = trpc.smsOtp.send.useMutation({
    onSuccess: (data) => {
      setStep("otp");
      toast.success(`OTP sent via ${channel === "whatsapp" ? "WhatsApp" : "SMS"}!`);
      if (data.devOtp) toast.info(`Dev OTP: ${data.devOtp}`, { duration: 30000 });
    },
    onError: (err) => toast.error(err.message),
  });

  const utils = trpc.useUtils();

  const verifyEmailOtp = trpc.otp.verifyOtp.useMutation({
    onSuccess: async () => {
      toast.success("Welcome to WaLeadBot!");
      try {
        const biz = await utils.business.get.fetch();
        navigate(biz ? "/dashboard" : "/onboarding");
      } catch {
        navigate("/onboarding");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const verifySmsOtp = trpc.smsOtp.verify.useMutation({
    onSuccess: async () => {
      toast.success("Welcome to WaLeadBot!");
      try {
        const biz = await utils.business.get.fetch();
        navigate(biz ? "/dashboard" : "/onboarding");
      } catch {
        navigate("/onboarding");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const isSending = sendEmailOtp.isPending || sendSmsOtp.isPending;
  const isVerifying = verifyEmailOtp.isPending || verifySmsOtp.isPending;

  function handleSend() {
    if (!identifier.trim()) { toast.error("Please enter your " + (channel === "email" ? "email" : "phone number")); return; }
    if (channel === "email") {
      if (!identifier.includes("@")) { toast.error("Please enter a valid email address"); return; }
      sendEmailOtp.mutate({ email: identifier });
    } else {
      sendSmsOtp.mutate({ phone: identifier, channel });
    }
  }

  function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Please enter the complete 6-digit OTP"); return; }
    if (channel === "email") {
      verifyEmailOtp.mutate({ email: identifier, otp: code });
    } else {
      verifySmsOtp.mutate({ phone: identifier, otp: code });
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < digits.length; i++) newOtp[i] = digits[i];
      setOtp(newOtp);
      otpRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "");
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }

  useEffect(() => {
    if (step === "otp") setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, [step]);

  const cfg = CHANNEL_CONFIG[channel];
  const ChannelIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-emerald-50/30 flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-200/20 rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl text-foreground">WaLeadBot</span>
          </a>
          <h1 className="text-2xl font-bold text-foreground">
            {step === "method" ? "Sign in to your account" : step === "identifier" ? "Enter your " + (channel === "email" ? "email" : "phone") : "Verify your identity"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {step === "method" ? "Choose how you'd like to receive your OTP" :
             step === "identifier" ? `We'll send a 6-digit code via ${cfg.label}` :
             `Code sent to ${identifier}`}
          </p>
        </div>

        <Card className="shadow-xl border-border/50 bg-white/90 dark:bg-card/90 backdrop-blur-sm">
          <CardContent className="p-8">

            {/* Step 1: Choose channel */}
            {step === "method" && (
              <div className="space-y-3">
                {(Object.entries(CHANNEL_CONFIG) as [Channel, typeof CHANNEL_CONFIG[Channel]][]).map(([key, c]) => {
                  const Icon = c.icon;
                  const isSelected = channel === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setChannel(key); setStep("identifier"); setIdentifier(""); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">{c.label}</p>
                        <p className="text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}

                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2">
                  <Shield className="w-3.5 h-3.5" />
                  No password needed. Secure OTP login.
                </div>
              </div>
            )}

            {/* Step 2: Enter identifier */}
            {step === "identifier" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
                    <ChannelIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground">{cfg.desc}</p>
                  </div>
                  <button
                    onClick={() => setStep("method")}
                    className="ml-auto text-xs text-primary hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {channel === "email" ? "Email address" : "Phone number"}
                  </Label>
                  <div className="relative">
                    <ChannelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={cfg.inputType}
                      placeholder={cfg.placeholder}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      className="pl-10 h-11"
                      autoFocus
                    />
                  </div>
                  {(channel === "sms" || channel === "whatsapp") && (
                    <p className="text-xs text-muted-foreground">
                      Include country code, e.g. <code className="bg-muted px-1 rounded">+919876543210</code>
                    </p>
                  )}
                </div>

                <Button className="w-full h-11 text-base" onClick={handleSend} disabled={isSending}>
                  {isSending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...</>
                  ) : (
                    <>Send OTP <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>

                <button
                  onClick={() => setStep("method")}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to login options
                </button>
              </div>
            )}

            {/* Step 3: Enter OTP */}
            {step === "otp" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
                    <ChannelIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">OTP sent via {cfg.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{identifier}</p>
                  </div>
                  <button
                    onClick={() => { setStep("identifier"); setOtp(["", "", "", "", "", ""]); }}
                    className="text-xs text-primary hover:underline flex-shrink-0"
                  >
                    Change
                  </button>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Enter 6-digit OTP</Label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-12 text-center text-xl font-bold border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-colors bg-background"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {channel === "email" ? "Check your inbox and spam folder" : "Code expires in 10 minutes"}
                  </p>
                </div>

                <Button className="w-full h-11 text-base" onClick={handleVerify} disabled={isVerifying}>
                  {isVerifying ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    <>Verify & Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => { setStep("identifier"); setOtp(["", "", "", "", "", ""]); }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={isSending}
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 mt-6">
          {[
            { icon: Shield, text: "Secure OTP" },
            { icon: Smartphone, text: "No password" },
            { icon: MessageSquare, text: "WhatsApp ready" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="w-3.5 h-3.5" />
                {item.text}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageSquare, Mail, ArrowRight, ArrowLeft, Loader2, Shield } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtp = trpc.otp.sendOtp.useMutation({
    onSuccess: (data) => {
      setStep("otp");
      toast.success("OTP sent to your email!");
      if (data.devOtp) {
        toast.info(`Dev mode OTP: ${data.devOtp}`, { duration: 30000 });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyOtp = trpc.otp.verifyOtp.useMutation({
    onSuccess: () => {
      toast.success("Welcome to WaLeadBot!");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSendOtp = () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    sendOtp.mutate({ email });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < digits.length; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      otpRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "");
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    verifyOtp.mutate({ email, otp: code });
  };

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-emerald-50/30 flex items-center justify-center p-4">
      {/* Background decoration */}
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
            {step === "email" ? "Welcome back" : "Verify your email"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {step === "email"
              ? "Sign in or create your account"
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        <Card className="shadow-xl border-border/50 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            {step === "email" ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      className="pl-10 h-11"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-11 text-base shadow-sm"
                  onClick={handleSendOtp}
                  disabled={sendOtp.isPending}
                >
                  {sendOtp.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...</>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Shield className="w-3.5 h-3.5" />
                  No password needed. Secure OTP login.
                </div>
              </div>
            ) : (
              <div className="space-y-6">
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
                    Check your inbox (and spam folder)
                  </p>
                </div>

                <Button
                  className="w-full h-11 text-base shadow-sm"
                  onClick={handleVerify}
                  disabled={verifyOtp.isPending}
                >
                  {verifyOtp.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    <>Verify & Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Change email
                  </button>
                  <button
                    onClick={handleSendOtp}
                    disabled={sendOtp.isPending}
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

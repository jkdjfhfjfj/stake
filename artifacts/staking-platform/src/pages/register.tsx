import { useState } from "react";
import { Link, useLocation } from "wouter";
import { TrendingUp, Mail, Lock, Eye, EyeOff, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRegister, setToken } from "@/lib/auth";
import { useAppAuth } from "@/lib/auth-context";
import { queryClient } from "@/lib/queryClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [referralCode, setReferralCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("ref") ?? "").toUpperCase();
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { refresh } = useAppAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { token } = await apiRegister(email, password, referralCode || undefined);
      setToken(token);
      await refresh();
      queryClient.clear();
      navigate("/onboarding");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d09] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-gray-400 text-sm mt-1">Start earning with StakeKE today</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111a14] border border-green-900/40 rounded-2xl p-6 space-y-4">
          <div>
            <Label htmlFor="email" className="text-gray-300 text-sm">Email address</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="pl-9 pr-10 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm" className="text-gray-300 text-sm">Confirm password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="confirm"
                type={showPw ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter password"
                className="pl-9 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="referral" className="text-gray-300 text-sm">
              Referral code <span className="text-gray-500">(optional)</span>
            </Label>
            <div className="relative mt-1.5">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="referral"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABCD1234"
                className="pl-9 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500 uppercase"
              />
            </div>
            {referralCode && (
              <div className="mt-2 bg-green-900/15 border border-green-800/30 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-green-400 text-xs shrink-0">🔗</span>
                <p className="text-xs text-green-400/80 break-all font-mono leading-relaxed">
                  {`${window.location.origin}/register?ref=${referralCode}`}
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white h-11 mt-2"
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-green-400 hover:text-green-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

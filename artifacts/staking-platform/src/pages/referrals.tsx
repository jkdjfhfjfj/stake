import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useGetReferrals, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Copy, CheckCircle, TrendingUp, DollarSign, Link2, Gift, Share2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

export default function ReferralsPage() {
  const { data: info, isLoading } = useGetReferrals();
  const { data: me } = useGetMe();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const fullLink = info?.referralLink
    ? (info.referralLink.startsWith("http") ? info.referralLink : `${window.location.origin}${info.referralLink}`)
    : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share it with friends to earn rewards." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(info?.referralCode ?? "");
      setCodeCopied(true);
      toast({ title: "Code copied!" });
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {}
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`💰 Join StakeKE and earn passive income!\n\nUse my referral code *${info?.referralCode}* when signing up:\n${fullLink}\n\nEarn up to 30% ROI on your savings! 🚀`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join StakeKE — Earn with M-Pesa",
          text: `Use my referral code ${info?.referralCode} and earn passive income!`,
          url: fullLink,
        });
      } catch {}
    } else {
      copyLink();
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const totalEarnings = (info?.tier1Earnings ?? 0) + (info?.tier2Earnings ?? 0);
  const totalReferrals = (info?.tier1Count ?? 0) + (info?.tier2Count ?? 0);
  const activeReferrals = info?.referredUsers?.filter((u: any) => u.hasActiveStake).length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Referral Program</h1>
          <p className="text-gray-400 text-sm mt-1">Earn rewards by inviting friends to stake</p>
        </div>

        {/* Earnings Hero */}
        <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/20 border-purple-800/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Referral Earnings</p>
                <p className="text-3xl font-black text-white">{formatKES(totalEarnings)}</p>
                <p className="text-xs text-gray-400 mt-1">{totalReferrals} referrals • {activeReferrals} actively staking</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Tier 1 Referrals", value: info?.tier1Count ?? 0, suffix: "users", icon: Users, color: "text-green-400", iconBg: "bg-green-900/30" },
            { label: "Tier 2 Referrals", value: info?.tier2Count ?? 0, suffix: "users", icon: Users, color: "text-blue-400", iconBg: "bg-blue-900/20" },
            { label: "Tier 1 Earnings", value: formatKES(info?.tier1Earnings ?? 0), icon: DollarSign, color: "text-yellow-400", iconBg: "bg-yellow-900/20" },
            { label: "Tier 2 Earnings", value: formatKES(info?.tier2Earnings ?? 0), icon: TrendingUp, color: "text-purple-400", iconBg: "bg-purple-900/20" },
          ].map((s) => (
            <Card key={s.label} className="bg-[#0d1a10] border-green-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                    <s.icon className={`w-3 h-3 ${s.color}`} />
                  </div>
                  <span className="text-xs text-gray-400">{s.label}</span>
                </div>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Referral Code + Link */}
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-green-400" /> Your Referral Code & Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Code */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Referral Code — share this alone or as part of your link</p>
              <div className="flex gap-2 items-center">
                <div className="flex-1 bg-[#0a0f0d] border border-green-700/40 rounded-xl px-4 py-3 font-mono text-2xl font-black text-green-400 tracking-[0.3em] text-center">
                  {info?.referralCode ?? "——"}
                </div>
                <Button onClick={copyCode} variant="outline" className="border-green-700/50 text-green-300 hover:bg-green-900/30 gap-1.5 shrink-0 h-12">
                  {codeCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {codeCopied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Full link */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Full Referral Link</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#0a0f0d] border border-green-900/30 rounded-xl px-3 py-2.5 text-xs text-gray-300 truncate font-mono min-w-0">
                  {fullLink || `${window.location.origin}/sign-up?ref=${info?.referralCode ?? "..."}`}
                </div>
                <Button onClick={copyLink} variant="outline" className="border-green-700/50 text-green-300 hover:bg-green-900/30 gap-1.5 shrink-0">
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Share buttons */}
            <div className="flex gap-2">
              <Button onClick={shareWhatsApp} className="flex-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white gap-2 h-10 font-semibold">
                <MessageCircle className="w-4 h-4 fill-white" /> Share on WhatsApp
              </Button>
              <Button onClick={shareLink} variant="outline" className="border-green-700/50 text-green-300 hover:bg-green-900/30 gap-2 shrink-0 h-10">
                <Share2 className="w-4 h-4" /> Share
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              When friends sign up with your code and make their first stake, you earn instantly.
            </p>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { step: "1", title: "Share your link", desc: "Copy your unique referral link and share it with friends, family, or on social media." },
                { step: "2", title: "Friend signs up", desc: "Your friend creates an account using your link and completes their first stake." },
                { step: "3", title: "You earn rewards", desc: "Earn 5% (Tier 1) or 2% (Tier 2) of their staked amount, automatically credited to your balance." },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start p-3 bg-[#0a1410] rounded-xl border border-green-900/20">
                  <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{s.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { tier: "Tier 1", pct: "5%", desc: "Direct referrals", color: "text-green-400 bg-green-900/20 border-green-800/30" },
                  { tier: "Tier 2", pct: "2%", desc: "Friends of friends", color: "text-blue-400 bg-blue-900/10 border-blue-800/20" },
                ].map((t) => (
                  <div key={t.tier} className={`border rounded-xl p-3 ${t.color}`}>
                    <p className="text-xs opacity-70">{t.tier}</p>
                    <p className="text-2xl font-black">{t.pct}</p>
                    <p className="text-xs opacity-70">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referred Users */}
        {(info?.referredUsers?.length ?? 0) > 0 && (
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                Referred Users ({info?.referredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {info?.referredUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-[#0a1410] border border-green-900/20">
                    <div className="w-8 h-8 rounded-full bg-green-900/40 flex items-center justify-center text-green-400 font-bold text-sm">
                      {(u.fullName ?? u.email)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{u.fullName ?? "Anonymous"}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.hasActiveStake && (
                        <Badge className="bg-green-900/30 text-green-400 border-0 text-[10px]">Active</Badge>
                      )}
                      <Badge className={u.tier === 1 ? "bg-green-900/30 text-green-400 border-0 text-[10px]" : "bg-blue-900/30 text-blue-400 border-0 text-[10px]"}>
                        T{u.tier}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

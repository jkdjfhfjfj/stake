import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useGetReferrals } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, CheckCircle, TrendingUp, DollarSign, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

export default function ReferralsPage() {
  const { data: info, isLoading } = useGetReferrals();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(info?.referralLink ?? "");
      setCopied(true);
      toast({ title: "Copied!", description: "Referral link copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Referral Program</h1>
          <p className="text-gray-400 text-sm mt-1">Earn 5% from your direct referrals, 2% from their referrals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Tier 1 Referrals", value: info?.tier1Count ?? 0, icon: Users, color: "text-green-400", suffix: "users" },
            { label: "Tier 2 Referrals", value: info?.tier2Count ?? 0, icon: Users, color: "text-blue-400", suffix: "users" },
            { label: "Tier 1 Earnings", value: formatKES(info?.tier1Earnings ?? 0), icon: DollarSign, color: "text-yellow-400" },
            { label: "Tier 2 Earnings", value: formatKES(info?.tier2Earnings ?? 0), icon: TrendingUp, color: "text-purple-400" },
          ].map((s) => (
            <Card key={s.label} className="bg-[#0d1a10] border-green-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-gray-400">{s.label}</span>
                </div>
                <p className="text-lg font-bold text-white">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Referral Link */}
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-green-400" /> Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 bg-[#0a0f0d] border border-green-900/30 rounded-xl px-4 py-2.5 text-sm text-gray-300 truncate font-mono">
                {info?.referralLink ?? `.../${info?.referralCode}`}
              </div>
              <Button onClick={copyLink} className="shrink-0 bg-green-600 hover:bg-green-500 gap-2">
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Share this link with friends. When they sign up and make their first stake, you'll earn referral rewards automatically.
            </p>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardHeader>
            <CardTitle className="text-base text-white">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { tier: "Tier 1", pct: "5%", desc: "Friends you directly refer. Earn 5% of their first stake amount.", color: "bg-green-900/30 text-green-400" },
                { tier: "Tier 2", pct: "2%", desc: "Friends referred by your direct referrals. Earn 2% of their first stake.", color: "bg-blue-900/30 text-blue-400" },
              ].map((t) => (
                <div key={t.tier} className="flex gap-4 items-start">
                  <Badge className={`${t.color} border-0 shrink-0`}>{t.tier} — {t.pct}</Badge>
                  <p className="text-sm text-gray-400">{t.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referred Users */}
        {(info?.referredUsers?.length ?? 0) > 0 && (
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardHeader>
              <CardTitle className="text-base text-white">Referred Users ({info?.referredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {info?.referredUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-green-900/10 last:border-0">
                    <div>
                      <p className="text-sm text-white">{u.fullName ?? "Anonymous"}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.hasActiveStake && <Badge className="bg-green-900/30 text-green-400 border-0 text-xs">Active Staker</Badge>}
                      <Badge className={u.tier === 1 ? "bg-green-900/30 text-green-400" : "bg-blue-900/30 text-blue-400"} >
                        Tier {u.tier}
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

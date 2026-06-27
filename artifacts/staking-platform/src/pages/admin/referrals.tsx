import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, TrendingUp, Gift, CheckCircle } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function authedFetch(url: string, opts: RequestInit = {}) {
  const token = getToken();
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
}

type ReferralRow = {
  id: number;
  tier: number;
  rewardAmount: number;
  paidAt: string | null;
  createdAt: string;
  referrer: { id: number; email: string; fullName: string | null };
  referee: { id: number; email: string; fullName: string | null };
};

export default function AdminReferrals() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: referrals = [], isLoading } = useQuery<ReferralRow[]>({
    queryKey: ["/api/admin/referrals"],
    queryFn: async () => {
      const res = await authedFetch("/api/admin/referrals");
      if (!res.ok) throw new Error("Failed to load referrals");
      return res.json();
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: number) => {
      const res = await authedFetch(`/api/admin/referrals/${id}/mark-paid`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Referral marked as paid", variant: "success" });
      qc.invalidateQueries({ queryKey: ["/api/admin/referrals"] });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const totalRewards = referrals.reduce((s, r) => s + r.rewardAmount, 0);
  const tier1Count = referrals.filter((r) => r.tier === 1).length;
  const tier2Count = referrals.filter((r) => r.tier === 2).length;
  const paidCount = referrals.filter((r) => r.paidAt !== null).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Total Referrals</span>
            </div>
            <p className="text-xl font-bold text-white">{referrals.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Tier 1 / Tier 2</span>
            </div>
            <p className="text-xl font-bold text-white">{tier1Count} / {tier2Count}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Total Rewards</span>
            </div>
            <p className="text-xl font-bold text-white">{formatKES(totalRewards)}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Paid / Pending</span>
            </div>
            <p className="text-xl font-bold text-white">{paidCount} / {referrals.length - paidCount}</p>
          </CardContent>
        </Card>
      </div>

      {referrals.length === 0 ? (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-8 text-center">
            <Users className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No referrals yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-900/20">
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Referrer</th>
                    <th className="px-1 py-3"></th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Referee</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Tier</th>
                    <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">Reward</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Date</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id} className="border-b border-green-900/10 hover:bg-green-900/10 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium truncate max-w-[130px]">
                          {r.referrer.fullName ?? r.referrer.email.split("@")[0]}
                        </p>
                        <p className="text-gray-500 text-xs truncate max-w-[130px]">{r.referrer.email}</p>
                      </td>
                      <td className="px-1 py-3">
                        <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium truncate max-w-[130px]">
                          {r.referee.fullName ?? r.referee.email.split("@")[0]}
                        </p>
                        <p className="text-gray-500 text-xs truncate max-w-[130px]">{r.referee.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={r.tier === 1 ? "bg-blue-900/30 text-blue-400 border-0" : "bg-purple-900/30 text-purple-400 border-0"}>
                          Tier {r.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-green-400 font-medium">{formatKES(r.rewardAmount)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={r.paidAt ? "bg-green-900/30 text-green-400 border-0" : "bg-yellow-900/30 text-yellow-400 border-0"}>
                          {r.paidAt ? "Paid" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString("en-KE")}
                      </td>
                      <td className="px-4 py-3">
                        {!r.paidAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-green-900/40 text-green-400 hover:bg-green-900/20"
                            disabled={markPaid.isPending}
                            onClick={() => markPaid.mutate(r.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

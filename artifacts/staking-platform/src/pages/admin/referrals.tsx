import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ArrowRight, TrendingUp, Gift, CheckCircle, Search, DollarSign } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const [search, setSearch] = useState("");
  const [paidFilter, setPaidFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");

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

  const filtered = referrals.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.referrer.email.toLowerCase().includes(q) || r.referee.email.toLowerCase().includes(q)
      || (r.referrer.fullName ?? "").toLowerCase().includes(q) || (r.referee.fullName ?? "").toLowerCase().includes(q);
    const matchPaid = paidFilter === "ALL" || (paidFilter === "PAID" ? r.paidAt !== null : r.paidAt === null);
    return matchSearch && matchPaid;
  });

  const totalRewards = referrals.reduce((s, r) => s + r.rewardAmount, 0);
  const paidRewards = referrals.filter((r) => r.paidAt).reduce((s, r) => s + r.rewardAmount, 0);
  const unpaidRewards = totalRewards - paidRewards;
  const tier1Count = referrals.filter((r) => r.tier === 1).length;
  const tier2Count = referrals.filter((r) => r.tier === 2).length;
  const paidCount = referrals.filter((r) => r.paidAt !== null).length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-[#0d1a10] rounded-xl border border-green-900/20" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Referrals", value: referrals.length, icon: Users, color: "text-green-400", iconBg: "bg-green-900/30" },
          { label: "Tier 1 / Tier 2", value: `${tier1Count} / ${tier2Count}`, icon: TrendingUp, color: "text-blue-400", iconBg: "bg-blue-900/20" },
          { label: "Total Rewards", value: formatKES(totalRewards), icon: Gift, color: "text-yellow-400", iconBg: "bg-yellow-900/20" },
          { label: "Unpaid Rewards", value: formatKES(unpaidRewards), icon: DollarSign, color: "text-orange-400", iconBg: "bg-orange-900/20" },
        ].map((s) => (
          <Card key={s.label} className="bg-[#0d1a10] border-green-900/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by referrer or referee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#0d1a10] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
          />
        </div>
        <div className="flex gap-1.5">
          {(["ALL", "PENDING", "PAID"] as const).map((f) => (
            <button key={f} onClick={() => setPaidFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                paidFilter === f ? "bg-green-600 text-white" : "bg-[#0d1a10] text-gray-400 hover:text-white border border-green-900/30"
              }`}>
              {f}
              {f === "PENDING" && (referrals.length - paidCount) > 0 && ` (${referrals.length - paidCount})`}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500">{filtered.length} of {referrals.length} referrals</p>

      {referrals.length === 0 ? (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-10 text-center">
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
                    <th className="px-1 py-3 w-6"></th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Referee</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-3 py-3">Tier</th>
                    <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">Reward</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-3 py-3">Status</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Date</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-green-900/10 hover:bg-green-900/5 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium truncate max-w-[120px]">
                          {r.referrer.fullName ?? r.referrer.email.split("@")[0]}
                        </p>
                        <p className="text-gray-500 text-[10px] truncate max-w-[120px]">{r.referrer.email}</p>
                      </td>
                      <td className="px-1 py-3">
                        <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium truncate max-w-[120px]">
                          {r.referee.fullName ?? r.referee.email.split("@")[0]}
                        </p>
                        <p className="text-gray-500 text-[10px] truncate max-w-[120px]">{r.referee.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={r.tier === 1 ? "bg-blue-900/30 text-blue-400 border-0 text-[10px]" : "bg-purple-900/30 text-purple-400 border-0 text-[10px]"}>
                          T{r.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-green-400 font-medium text-xs">{formatKES(r.rewardAmount)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={r.paidAt ? "bg-green-900/30 text-green-400 border-0 text-[10px]" : "bg-yellow-900/30 text-yellow-400 border-0 text-[10px]"}>
                          {r.paidAt ? "Paid" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString("en-KE")}
                      </td>
                      <td className="px-4 py-3">
                        {!r.paidAt && (
                          <Button size="sm" variant="outline"
                            className="h-7 px-2 text-[10px] border-green-900/40 text-green-400 hover:bg-green-900/20 gap-1"
                            disabled={markPaid.isPending}
                            onClick={() => markPaid.mutate(r.id)}>
                            <CheckCircle className="w-3 h-3" /> Mark Paid
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

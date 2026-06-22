import { useGetAdminAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Users, Wallet, BarChart3, DollarSign } from "lucide-react";

function formatKES(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(1)}K`;
  return `KES ${n.toFixed(2)}`;
}

export default function AdminAnalytics() {
  const { data, isLoading } = useGetAdminAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Total Value Locked", value: formatKES(data?.tvl ?? 0), icon: Wallet, color: "text-green-400" },
    { label: "Total Deposits", value: formatKES(data?.totalDeposits ?? 0), icon: TrendingUp, color: "text-blue-400" },
    { label: "Total Withdrawals", value: formatKES(data?.totalWithdrawals ?? 0), icon: BarChart3, color: "text-red-400" },
    { label: "Active Stakes", value: data?.activeStakesCount ?? 0, icon: DollarSign, color: "text-yellow-400" },
    { label: "Total Users", value: data?.totalUsers ?? 0, icon: Users, color: "text-purple-400" },
    { label: "Platform Revenue", value: formatKES(data?.platformRevenue ?? 0), icon: DollarSign, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-[#0d1a10] border-green-900/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(data?.dailyStats?.length ?? 0) > 0 && (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardHeader>
            <CardTitle className="text-base text-white">14-Day Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data?.dailyStats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="deposits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="withdrawals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2e1d" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: "#0d1a10", border: "1px solid #1a4a23", borderRadius: 8 }}
                  labelStyle={{ color: "#9ca3af" }}
                  formatter={(v: number) => formatKES(v)}
                />
                <Area type="monotone" dataKey="deposits" stroke="#16a34a" fill="url(#deposits)" name="Deposits" />
                <Area type="monotone" dataKey="withdrawals" stroke="#ef4444" fill="url(#withdrawals)" name="Withdrawals" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

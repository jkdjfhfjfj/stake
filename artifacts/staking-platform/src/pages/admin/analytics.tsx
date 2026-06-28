import { useGetAdminAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Legend
} from "recharts";
import { TrendingUp, Users, Wallet, BarChart3, DollarSign, Activity, ArrowUpRight, ArrowDownLeft, Percent } from "lucide-react";

function formatKES(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(1)}K`;
  return `KES ${n.toFixed(2)}`;
}

function StatCard({ label, value, icon: Icon, color, iconBg, trend }: any) {
  return (
    <Card className="bg-[#0d1a10] border-green-900/30 hover:border-green-800/40 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          {trend !== undefined && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
              {trend >= 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0d1a10] border border-green-900/30 rounded-xl p-3 shadow-xl text-xs">
        <p className="text-gray-400 mb-2 font-medium">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="text-white font-medium">{formatKES(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminAnalytics() {
  const { data, isLoading } = useGetAdminAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-[#0d1a10] border-green-900/30 h-24" />
        ))}
      </div>
    );
  }

  const stats = [
    { label: "Total Value Locked", value: formatKES(data?.tvl ?? 0), icon: Wallet, color: "text-green-400", iconBg: "bg-green-900/30" },
    { label: "Total Deposits", value: formatKES(data?.totalDeposits ?? 0), icon: ArrowDownLeft, color: "text-blue-400", iconBg: "bg-blue-900/20" },
    { label: "Total Withdrawals", value: formatKES(data?.totalWithdrawals ?? 0), icon: ArrowUpRight, color: "text-red-400", iconBg: "bg-red-900/20" },
    { label: "Active Stakes", value: (data?.activeStakesCount ?? 0).toLocaleString(), icon: TrendingUp, color: "text-yellow-400", iconBg: "bg-yellow-900/20" },
    { label: "Total Users", value: (data?.totalUsers ?? 0).toLocaleString(), icon: Users, color: "text-purple-400", iconBg: "bg-purple-900/20" },
    { label: "Platform Revenue", value: formatKES(data?.platformRevenue ?? 0), icon: DollarSign, color: "text-emerald-400", iconBg: "bg-emerald-900/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Net flow card */}
      {(data?.totalDeposits || data?.totalWithdrawals) ? (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Net Cash Flow</p>
                <p className="text-2xl font-bold text-white">
                  {formatKES((data?.totalDeposits ?? 0) - (data?.totalWithdrawals ?? 0))}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-gray-500">In</p>
                  <p className="text-lg font-bold text-green-400">{formatKES(data?.totalDeposits ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Out</p>
                  <p className="text-lg font-bold text-red-400">{formatKES(data?.totalWithdrawals ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Locked</p>
                  <p className="text-lg font-bold text-blue-400">{formatKES(data?.tvl ?? 0)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Charts */}
      {(data?.dailyStats?.length ?? 0) > 0 && (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Daily Deposits vs Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.dailyStats} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="grad-dep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-wd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2e1d" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="deposits" stroke="#16a34a" strokeWidth={2} fill="url(#grad-dep)" name="Deposits" />
                  <Area type="monotone" dataKey="withdrawals" stroke="#ef4444" strokeWidth={2} fill="url(#grad-wd)" name="Withdrawals" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-yellow-400" />
                Stakes Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.dailyStats} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2e1d" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="newStakes" fill="#2563eb" opacity={0.8} radius={[3, 3, 0, 0]} name="New Stakes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {(data?.dailyStats?.length ?? 0) === 0 && (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-10 text-center">
            <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No daily activity data yet.</p>
            <p className="text-xs text-gray-500 mt-1">Charts will appear once users start transacting.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

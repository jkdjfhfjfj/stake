import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useGetMe, useGetAdminAnalytics } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";
import {
  Shield, Users, BarChart3, ArrowUpRight, Settings, FileText,
  GitBranch, ArrowLeftRight, ChevronRight,
  Layers, RefreshCw, TrendingUp, Wallet, Activity,
} from "lucide-react";
import AdminAnalytics from "./analytics";
import AdminUsers from "./users";
import AdminWithdrawals from "./withdrawals";
import AdminSettings from "./settings";
import AdminAuditLogs from "./audit-logs";
import AdminReferrals from "./referrals";
import AdminTransactions from "./transactions";
import AdminPlans from "./plans";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type Tab = "analytics" | "users" | "transactions" | "withdrawals" | "referrals" | "plans" | "settings" | "audit";

const tabs: { id: Tab; icon: any; label: string; color: string }[] = [
  { id: "analytics",    icon: BarChart3,      label: "Analytics",      color: "text-blue-400"   },
  { id: "users",        icon: Users,          label: "Users",          color: "text-green-400"  },
  { id: "transactions", icon: ArrowLeftRight, label: "Transactions",   color: "text-yellow-400" },
  { id: "withdrawals",  icon: ArrowUpRight,   label: "Withdrawals",    color: "text-orange-400" },
  { id: "referrals",    icon: GitBranch,      label: "Referrals",      color: "text-purple-400" },
  { id: "plans",        icon: Layers,         label: "Plans",          color: "text-cyan-400"   },
  { id: "settings",     icon: Settings,       label: "Settings",       color: "text-gray-400"   },
  { id: "audit",        icon: FileText,       label: "Audit Logs",     color: "text-red-400"    },
];

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}
function fmtShort(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `KES ${(n / 1_000).toFixed(1)}K`;
  return formatKES(n);
}

export default function AdminPage() {
  const { data: me }                         = useGetMe();
  const { data: analytics }                  = useGetAdminAnalytics();
  const [activeTab, setActiveTab]            = useState<Tab>("analytics");
  const [processingStakes, setProcessingStakes] = useState(false);
  const { toast }                            = useToast();

  async function processStakes() {
    setProcessingStakes(true);
    try {
      const token = getToken();
      const res   = await fetch("/api/admin/cron/process-stakes", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed");
      toast({
        title: "Stakes processed",
        description: `${body.processed ?? 0} matured stakes paid out.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessingStakes(false);
    }
  }

  if (!me) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (me.role !== "ADMIN") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="w-16 h-16 rounded-full bg-red-900/20 border border-red-900/30 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-gray-400">You don't have permission to view this page.</p>
        </div>
      </AppLayout>
    );
  }

  const summaryStats = [
    { label: "Total AUM",      value: fmtShort(analytics?.tvl ?? 0),            icon: Wallet,    color: "text-green-400"  },
    { label: "Total Users",    value: String(analytics?.totalUsers ?? 0),        icon: Users,     color: "text-sky-400"    },
    { label: "Revenue",        value: fmtShort(analytics?.platformRevenue ?? 0), icon: TrendingUp, color: "text-yellow-400" },
    { label: "Active Stakes",  value: String(analytics?.activeStakesCount ?? 0), icon: Activity,  color: "text-orange-400" },
  ];

  return (
    <AppLayout>
      {/* ── Admin header bar ─────────────────────────────────── */}
      <div className="bg-[#1a0f00] border border-amber-800/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">Admin Control Panel</p>
          <p className="text-[10px] text-amber-400/70">Full platform access · {me.email}</p>
        </div>
        <button
          onClick={processStakes}
          disabled={processingStakes}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600/20 border border-amber-700/40 text-amber-300 text-xs font-semibold hover:bg-amber-600/30 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${processingStakes ? "animate-spin" : ""}`} />
          {processingStakes ? "Running…" : "Process Stakes"}
        </button>
      </div>

      {/* ── Quick summary stats ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {summaryStats.map((s) => (
          <div key={s.label} className="bg-[#0a1208] border border-green-900/20 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              <span className="text-[10px] text-gray-500">{s.label}</span>
            </div>
            <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* ── Desktop sidebar nav ───────────────────────────────── */}
        <aside className="hidden md:block shrink-0 w-48">
          <nav className="space-y-0.5">
            {tabs.map((tab) => {
              const Icon     = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left",
                    isActive
                      ? "bg-[#0d1a10] border border-green-800/40 text-white"
                      : "text-gray-400 hover:text-white hover:bg-green-900/20"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? tab.color : "")} />
                  <span className="flex-1 font-medium">{tab.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-gray-600" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main area ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Mobile tab chips — horizontal scroll */}
          <div className="md:hidden mb-4 overflow-x-auto pb-1">
            <div className="flex gap-1.5 min-w-max">
              {tabs.map((tab) => {
                const Icon     = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border",
                      isActive
                        ? "bg-[#0d1a10] border-green-700/50 text-white"
                        : "border-green-900/20 text-gray-500 bg-[#0a1208]"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", isActive ? tab.color : "")} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === "analytics"    && <AdminAnalytics />}
          {activeTab === "users"        && <AdminUsers />}
          {activeTab === "transactions" && <AdminTransactions />}
          {activeTab === "withdrawals"  && <AdminWithdrawals />}
          {activeTab === "referrals"    && <AdminReferrals />}
          {activeTab === "plans"        && <AdminPlans />}
          {activeTab === "settings"     && <AdminSettings />}
          {activeTab === "audit"        && <AdminAuditLogs />}
        </div>
      </div>
    </AppLayout>
  );
}

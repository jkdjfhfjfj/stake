import { useState } from "react";
import { Link, useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { useGetMe } from "@workspace/api-client-react";
import {
  Shield, Users, BarChart3, ArrowUpRight, Settings, FileText,
  GitBranch, ArrowLeftRight, Menu, X, ChevronRight, TrendingUp,
  Layers, Activity, Bell
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

type Tab = "analytics" | "users" | "transactions" | "withdrawals" | "referrals" | "plans" | "settings" | "audit";

const tabs: { id: Tab; icon: any; label: string; description: string; color: string }[] = [
  { id: "analytics", icon: BarChart3, label: "Analytics", description: "Platform metrics & charts", color: "text-blue-400" },
  { id: "users", icon: Users, label: "Users", description: "Manage user accounts", color: "text-green-400" },
  { id: "transactions", icon: ArrowLeftRight, label: "Transactions", description: "All platform transactions", color: "text-yellow-400" },
  { id: "withdrawals", icon: ArrowUpRight, label: "Withdrawals", description: "Approve & disburse", color: "text-orange-400" },
  { id: "referrals", icon: GitBranch, label: "Referrals", description: "Referral network & payouts", color: "text-purple-400" },
  { id: "plans", icon: Layers, label: "Staking Plans", description: "Create & manage plans", color: "text-cyan-400" },
  { id: "settings", icon: Settings, label: "Settings", description: "PayHero & platform config", color: "text-gray-400" },
  { id: "audit", icon: FileText, label: "Audit Logs", description: "Admin action history", color: "text-red-400" },
];

export default function AdminPage() {
  const { data: me } = useGetMe();
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const activeTabInfo = tabs.find((t) => t.id === activeTab)!;
  const ActiveIcon = activeTabInfo.icon;

  return (
    <AppLayout>
      <div className="flex gap-6 min-h-[calc(100vh-5rem)]">
        {/* Admin Sidebar */}
        <aside className={cn(
          "shrink-0 transition-all duration-200",
          "hidden md:block w-56"
        )}>
          {/* Admin header */}
          <div className="bg-amber-900/20 border border-amber-800/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600/30 border border-amber-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Admin Panel</p>
                <p className="text-[10px] text-amber-400/70">Full access</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left group",
                    isActive
                      ? "bg-[#0d1a10] border border-green-800/40 text-white shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-green-900/20"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? tab.color : "group-hover:text-gray-300")} />
                  <span className="flex-1 font-medium">{tab.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile tab selector */}
          <div className="md:hidden mb-4">
            <div className="bg-[#0d1a10] border border-green-900/30 rounded-xl p-1 overflow-x-auto flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all",
                      activeTab === tab.id
                        ? "bg-green-600 text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page header */}
          <div className="flex items-center gap-3 mb-5">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-[#0d1a10] border border-green-900/30")}>
              <ActiveIcon className={cn("w-5 h-5", activeTabInfo.color)} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{activeTabInfo.label}</h1>
              <p className="text-xs text-gray-400">{activeTabInfo.description}</p>
            </div>
          </div>

          {/* Content */}
          <div>
            {activeTab === "analytics" && <AdminAnalytics />}
            {activeTab === "users" && <AdminUsers />}
            {activeTab === "transactions" && <AdminTransactions />}
            {activeTab === "withdrawals" && <AdminWithdrawals />}
            {activeTab === "referrals" && <AdminReferrals />}
            {activeTab === "plans" && <AdminPlans />}
            {activeTab === "settings" && <AdminSettings />}
            {activeTab === "audit" && <AdminAuditLogs />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

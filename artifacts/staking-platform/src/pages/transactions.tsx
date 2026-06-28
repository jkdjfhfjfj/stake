import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, DollarSign,
  Users, Settings, Activity, Search, Filter
} from "lucide-react";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

const typeConfig: Record<string, { label: string; icon: any; color: string; prefix: string; iconBg: string }> = {
  DEPOSIT:         { label: "Deposit",        icon: ArrowDownLeft, color: "text-green-400",  prefix: "+", iconBg: "bg-green-900/30" },
  WITHDRAWAL:      { label: "Withdrawal",     icon: ArrowUpRight,  color: "text-red-400",    prefix: "-", iconBg: "bg-red-900/20" },
  STAKE:           { label: "Staked",         icon: TrendingUp,    color: "text-blue-400",   prefix: "-", iconBg: "bg-blue-900/20" },
  UNSTAKE:         { label: "Unstaked",       icon: TrendingDown,  color: "text-yellow-400", prefix: "+", iconBg: "bg-yellow-900/20" },
  INTEREST:        { label: "Interest",       icon: DollarSign,    color: "text-green-400",  prefix: "+", iconBg: "bg-green-900/30" },
  REFERRAL_REWARD: { label: "Referral",       icon: Users,         color: "text-purple-400", prefix: "+", iconBg: "bg-purple-900/20" },
  MANUAL_CREDIT:   { label: "Credit",         icon: Settings,      color: "text-green-400",  prefix: "+", iconBg: "bg-green-900/30" },
  MANUAL_DEBIT:    { label: "Debit",          icon: Settings,      color: "text-red-400",    prefix: "-", iconBg: "bg-red-900/20" },
};

const statusColors: Record<string, string> = {
  COMPLETED: "bg-green-900/30 text-green-400",
  PENDING:   "bg-yellow-900/30 text-yellow-400",
  FAILED:    "bg-red-900/30 text-red-400",
  REJECTED:  "bg-red-900/30 text-red-400",
};

export default function TransactionsPage() {
  const { data: txs = [], isLoading } = useListTransactions();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filtered = txs.filter((tx: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (tx.description ?? "").toLowerCase().includes(q) || tx.type.toLowerCase().includes(q);
    const matchType = typeFilter === "ALL" || tx.type === typeFilter;
    return matchSearch && matchType;
  });

  // Summary
  const totalIn = txs
    .filter((t: any) => ["DEPOSIT", "INTEREST", "REFERRAL_REWARD", "MANUAL_CREDIT", "UNSTAKE"].includes(t.type) && t.status === "COMPLETED")
    .reduce((s: number, t: any) => s + t.amount, 0);
  const totalOut = txs
    .filter((t: any) => ["WITHDRAWAL", "STAKE", "MANUAL_DEBIT"].includes(t.type) && t.status === "COMPLETED")
    .reduce((s: number, t: any) => s + t.amount, 0);

  const types = ["ALL", "DEPOSIT", "WITHDRAWAL", "STAKE", "INTEREST", "REFERRAL_REWARD", "MANUAL_CREDIT"];

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 text-sm mt-1">Your full transaction history</p>
        </div>

        {/* Summary */}
        {txs.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-900/10 border border-green-800/20 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Total In</p>
              <p className="text-base font-bold text-green-400">{formatKES(totalIn)}</p>
            </div>
            <div className="bg-red-900/10 border border-red-800/20 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Total Out</p>
              <p className="text-base font-bold text-red-400">{formatKES(totalOut)}</p>
            </div>
            <div className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Transactions</p>
              <p className="text-base font-bold text-white">{txs.length}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#0d1a10] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {types.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  typeFilter === t ? "bg-green-600 text-white" : "bg-[#0d1a10] text-gray-400 hover:text-white border border-green-900/30"
                }`}>
                {t === "ALL" ? "All" : typeConfig[t]?.label ?? t}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[#0d1a10] rounded-xl border border-green-900/20" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardContent className="p-12 text-center">
              <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">{txs.length === 0 ? "No transactions yet" : "No matching transactions"}</p>
              {txs.length === 0 && <p className="text-gray-500 text-sm mt-1">Make a deposit to get started</p>}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardContent className="p-0">
              <div className="divide-y divide-green-900/10">
                {filtered.map((tx: any) => {
                  const cfg = typeConfig[tx.type] ?? { label: tx.type, icon: Activity, color: "text-gray-400", prefix: "", iconBg: "bg-gray-900/20" };
                  const Icon = cfg.icon;
                  const isCredit = cfg.prefix === "+";
                  return (
                    <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-green-900/5 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString("en-KE")}</p>
                          <Badge className={`text-[10px] px-1.5 py-0 border-0 ${statusColors[tx.status] ?? "text-gray-400 bg-gray-900/30"}`}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${isCredit ? "text-green-400" : "text-red-400"}`}>
                          {cfg.prefix}{formatKES(tx.amount)}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{cfg.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-gray-600 text-center">{filtered.length} of {txs.length} transactions</p>
        )}
      </div>
    </AppLayout>
  );
}

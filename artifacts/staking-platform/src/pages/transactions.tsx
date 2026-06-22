import AppLayout from "@/components/layout/AppLayout";
import { useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, DollarSign, Users, Settings, Activity } from "lucide-react";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

const typeConfig: Record<string, { label: string; icon: any; color: string; prefix: string }> = {
  DEPOSIT:         { label: "Deposit",         icon: ArrowDownLeft, color: "text-green-400", prefix: "+" },
  WITHDRAWAL:      { label: "Withdrawal",      icon: ArrowUpRight,  color: "text-red-400",   prefix: "-" },
  STAKE:           { label: "Staked",          icon: TrendingUp,    color: "text-blue-400",  prefix: "-" },
  UNSTAKE:         { label: "Unstaked",        icon: TrendingDown,  color: "text-yellow-400",prefix: "+" },
  INTEREST:        { label: "Interest",        icon: DollarSign,    color: "text-green-400", prefix: "+" },
  REFERRAL_REWARD: { label: "Referral Reward", icon: Users,         color: "text-purple-400",prefix: "+" },
  MANUAL_CREDIT:   { label: "Credit",          icon: Settings,      color: "text-green-400", prefix: "+" },
  MANUAL_DEBIT:    { label: "Debit",           icon: Settings,      color: "text-red-400",   prefix: "-" },
};

const statusColors: Record<string, string> = {
  COMPLETED: "bg-green-900/30 text-green-400",
  PENDING:   "bg-yellow-900/30 text-yellow-400",
  FAILED:    "bg-red-900/30 text-red-400",
  REJECTED:  "bg-red-900/30 text-red-400",
};

export default function TransactionsPage() {
  const { data: txs = [], isLoading } = useListTransactions();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 text-sm mt-1">Your full transaction history</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : txs.length === 0 ? (
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardContent className="p-12 text-center">
              <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No transactions yet</p>
              <p className="text-gray-500 text-sm mt-1">Make a deposit to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {txs.map((tx) => {
              const cfg = typeConfig[tx.type] ?? { label: tx.type, icon: Activity, color: "text-gray-400", prefix: "" };
              const Icon = cfg.icon;
              return (
                <div key={tx.id} className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl bg-green-900/30 flex items-center justify-center ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString("en-KE")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${cfg.color}`}>
                      {cfg.prefix}{formatKES(tx.amount)}
                    </p>
                    <Badge className={`text-xs mt-0.5 ${statusColors[tx.status] ?? "text-gray-400 bg-gray-900/30"}`}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

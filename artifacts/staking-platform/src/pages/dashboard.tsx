import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  useGetDashboard, useGetMe, useInitiateDeposit,
  useRequestWithdrawal, useListStakes,
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet, TrendingUp, DollarSign, Gift,
  ArrowDownLeft, ArrowUpRight, Clock, Users,
  Activity, Zap, Target, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

/* ── helpers ─────────────────────────────────────────────────── */
function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TX_CREDIT = new Set(["DEPOSIT","INTEREST","REFERRAL_REWARD","MANUAL_CREDIT","UNSTAKE"]);
const TX_ICON: Record<string, string> = {
  DEPOSIT: "↓", WITHDRAWAL: "↑", STAKE: "⬡", INTEREST: "✦",
  REFERRAL_REWARD: "❖", MANUAL_CREDIT: "+", MANUAL_DEBIT: "−", UNSTAKE: "↩",
};

/* ── Deposit Dialog ──────────────────────────────────────────── */
function DepositDialog({ phone }: { phone?: string | null }) {
  const [amount, setAmount]  = useState("");
  const [phoneN, setPhoneN]  = useState(phone ?? "");
  const [open, setOpen]      = useState(false);
  const { toast }            = useToast();
  const presets              = [500, 1000, 5000, 10000];

  const deposit = useInitiateDeposit({
    mutation: {
      onSuccess: () => {
        toast({ title: "STK Push sent!", description: "Enter your M-Pesa PIN to complete." });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me/dashboard"] });
        setOpen(false); setAmount("");
      },
      onError: (e: any) => {
        toast({ title: "Deposit failed", description: e?.data?.error ?? e?.message, variant: "destructive" });
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-500 gap-2 shadow-lg shadow-green-900/30 font-semibold">
          <ArrowDownLeft className="w-4 h-4" /> Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-900/50 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5 text-green-400" />
            </div>
            Deposit via M-Pesa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div>
            <Label className="text-gray-400 text-xs">Amount (KES)</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" type="number"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white text-xl h-12 focus:border-green-500" />
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {presets.map((p) => (
                <button key={p} onClick={() => setAmount(String(p))}
                  className={`py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    amount === String(p)
                      ? "border-green-500 bg-green-900/50 text-green-300"
                      : "border-green-900/30 text-gray-500 hover:border-green-700/50 hover:text-gray-300"
                  }`}>
                  {p >= 1000 ? `${p / 1000}K` : p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs">M-Pesa Number</Label>
            <Input value={phoneN} onChange={(e) => setPhoneN(e.target.value)}
              placeholder="07XXXXXXXX"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
          </div>
          {Number(amount) > 0 && (
            <div className="bg-green-950/40 rounded-xl p-3 border border-green-900/30 text-sm">
              <div className="flex justify-between text-gray-400 mb-1">
                <span>You send</span>
                <span className="text-white font-semibold">{fmt(Number(amount))}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Credited instantly</span>
                <span className="text-green-400 font-semibold">{fmt(Number(amount))}</span>
              </div>
            </div>
          )}
          <Button className="w-full bg-green-600 hover:bg-green-500 h-11 font-semibold"
            disabled={!amount || !phoneN || deposit.isPending}
            onClick={() => deposit.mutate({ data: { amount: Number(amount), phoneNumber: phoneN } })}>
            {deposit.isPending ? "Sending…" : "Send STK Push"}
          </Button>
          <p className="text-[11px] text-center text-gray-600">You'll receive a prompt on your Safaricom line</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Withdraw Dialog ─────────────────────────────────────────── */
function WithdrawDialog({ phone, max }: { phone?: string | null; max: number }) {
  const [amount, setAmount] = useState("");
  const [phoneN, setPhoneN] = useState(phone ?? "");
  const [open, setOpen]     = useState(false);
  const { toast }           = useToast();
  const amtNum              = Number(amount);
  const valid               = amtNum >= 100 && amtNum <= max && phoneN.length >= 10;

  const withdraw = useRequestWithdrawal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Withdrawal requested", description: "Admin will process within 24 hours." });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me/dashboard"] });
        setOpen(false); setAmount("");
      },
      onError: (e: any) => {
        toast({ title: "Withdrawal failed", description: e?.data?.error ?? e?.message, variant: "destructive" });
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-green-700/40 text-green-300 hover:bg-green-900/25 gap-2 font-semibold">
          <ArrowUpRight className="w-4 h-4" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-900/40 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
            </div>
            Request Withdrawal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="flex justify-between items-center bg-green-950/40 border border-green-900/30 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-400">Available</span>
            <span className="text-green-400 font-bold">{fmt(max)}</span>
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <Label className="text-gray-400 text-xs">Amount (KES)</Label>
              <button onClick={() => setAmount(String(max))} className="text-xs text-green-400 hover:text-green-300">Use max</button>
            </div>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="Min. 100" type="number"
              className="bg-[#0a0f0d] border-green-900/40 text-white text-xl h-12 focus:border-green-500" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">M-Pesa Number</Label>
            <Input value={phoneN} onChange={(e) => setPhoneN(e.target.value)}
              placeholder="07XXXXXXXX"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
          </div>
          <p className="text-[11px] text-yellow-500/70 bg-yellow-950/30 rounded-xl p-3 border border-yellow-900/20">
            ⚡ Processed within 24 hours via M-Pesa B2C
          </p>
          <Button className="w-full bg-green-600 hover:bg-green-500 h-11 font-semibold"
            disabled={!valid || withdraw.isPending}
            onClick={() => withdraw.mutate({ data: { amount: amtNum, phoneNumber: phoneN } })}>
            {withdraw.isPending ? "Submitting…" : "Request Withdrawal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Dashboard ───────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: me }              = useGetMe();
  const { data: dash, isLoading } = useGetDashboard();
  const { data: stakes = [] }     = useListStakes();

  const activeStakes   = (stakes as any[]).filter((s) => s.status === "ACTIVE");
  const totalPortfolio = (dash?.availableBalance ?? 0) + (dash?.totalStaked ?? 0);
  const roi            = dash?.totalStaked ? ((dash.totalEarnings ?? 0) / dash.totalStaked) * 100 : 0;
  const firstName      = me?.fullName?.split(" ")[0] ?? "there";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4 animate-pulse">
          <div className="h-40 rounded-3xl bg-green-900/20" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-green-900/15" />)}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="h-72 rounded-2xl bg-green-900/15" />
            <div className="h-72 rounded-2xl bg-green-900/15" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-5">

        {/* ── Hero card ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d2010] via-[#0a1a0d] to-[#071208] border border-green-800/30 p-6 md:p-8">
          {/* Decorative glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {firstName} 👋
              </p>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-3">Total Portfolio Value</p>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-none mb-2">
                {fmt(totalPortfolio)}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {roi > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-900/40 border border-green-700/30 text-green-400 text-xs font-bold">
                    ↑ {roi.toFixed(1)}% ROI
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {activeStakes.length} active stake{activeStakes.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <DepositDialog phone={me?.mpesaNumber} />
              <WithdrawDialog phone={me?.mpesaNumber} max={dash?.availableBalance ?? 0} />
            </div>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Available",
              value: fmt(dash?.availableBalance ?? 0),
              raw: dash?.availableBalance ?? 0,
              icon: Wallet,
              color: "text-green-400",
              ring: "border-green-800/30",
              dot: "bg-green-500",
            },
            {
              label: "Staked",
              value: fmt(dash?.totalStaked ?? 0),
              raw: dash?.totalStaked ?? 0,
              icon: TrendingUp,
              color: "text-sky-400",
              ring: "border-sky-900/30",
              dot: "bg-sky-500",
            },
            {
              label: "Earnings",
              value: fmt(dash?.totalEarnings ?? 0),
              raw: dash?.totalEarnings ?? 0,
              icon: DollarSign,
              color: "text-yellow-400",
              ring: "border-yellow-900/30",
              dot: "bg-yellow-500",
            },
            {
              label: "Referrals",
              value: fmt(dash?.referralRewards ?? 0),
              raw: dash?.referralRewards ?? 0,
              icon: Gift,
              color: "text-purple-400",
              ring: "border-purple-900/30",
              dot: "bg-purple-500",
            },
          ].map((s) => (
            <div key={s.label} className={`relative bg-[#0a1208] border ${s.ring} rounded-2xl p-4 overflow-hidden`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium">{s.label}</span>
                <div className={`w-6 h-6 rounded-lg bg-[#060d08] flex items-center justify-center`}>
                  <s.icon className={`w-3 h-3 ${s.color}`} />
                </div>
              </div>
              <p className={`text-sm font-black ${s.color} leading-tight`}>{s.value}</p>
              {/* accent line */}
              <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${s.dot} opacity-30`} />
            </div>
          ))}
        </div>

        {/* ── Main content grid ──────────────────────────────── */}
        <div className="grid lg:grid-cols-5 gap-5">

          {/* Left column: stakes + quick actions (3/5) */}
          <div className="lg:col-span-3 space-y-4">

            {/* Active Stakes */}
            <div className="bg-[#0a1208] border border-green-900/25 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-green-900/20">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-bold text-white">Active Stakes</span>
                  {activeStakes.length > 0 && (
                    <span className="bg-green-900/50 text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-green-800/30">
                      {activeStakes.length}
                    </span>
                  )}
                </div>
                <Link href="/staking">
                  <button className="text-xs text-green-400 hover:text-green-300 font-medium flex items-center gap-1">
                    + New <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>

              <div className="p-4">
                {activeStakes.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-2xl bg-green-900/20 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No active stakes yet</p>
                    <p className="text-gray-600 text-xs mt-1 mb-4">Start earning with your first stake</p>
                    <Link href="/staking">
                      <Button size="sm" className="bg-green-600 hover:bg-green-500 gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Start Staking
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeStakes.slice(0, 4).map((stake: any) => {
                      const end       = new Date(stake.endDate);
                      const daysLeft  = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
                      const total     = stake.plan?.durationDays ?? 30;
                      const elapsed   = total - daysLeft;
                      const progress  = Math.min(100, Math.round((elapsed / total) * 100));
                      const projected = stake.principalAmount * (1 + (stake.plan?.roiPercent ?? 0) / 100);

                      return (
                        <div key={stake.id} className="group bg-[#060d08] border border-green-900/20 hover:border-green-800/40 rounded-xl p-4 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-bold text-white">{stake.plan?.name ?? "Stake"}</p>
                                <span className="text-[10px] bg-green-900/40 text-green-400 border border-green-800/30 rounded-full px-1.5 py-0.5 font-semibold">
                                  {stake.plan?.roiPercent ?? 0}% ROI
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {fmt(stake.principalAmount)} → <span className="text-green-400">{fmt(projected)}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-white">{daysLeft}d</p>
                              <p className="text-[10px] text-gray-600">remaining</p>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] text-gray-600">
                              <span>{elapsed}d elapsed</span>
                              <span className="text-green-400 font-semibold">{progress}% done</span>
                            </div>
                            <div className="h-1.5 bg-green-900/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-600 to-emerald-500 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {activeStakes.length > 4 && (
                      <Link href="/staking">
                        <p className="text-center text-xs text-green-400 hover:text-green-300 cursor-pointer py-1">
                          +{activeStakes.length - 4} more stakes — View all
                        </p>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: "Stake",         sub: "Earn returns",    href: "/staking",       icon: TrendingUp, color: "text-green-400",  bg: "bg-green-900/20 hover:bg-green-900/30 border-green-900/30" },
                { label: "Transactions",  sub: "History",         href: "/transactions",  icon: Activity,   color: "text-sky-400",    bg: "bg-sky-900/10 hover:bg-sky-900/20 border-sky-900/20" },
                { label: "Refer",         sub: "Earn 5%",         href: "/referrals",     icon: Users,      color: "text-purple-400", bg: "bg-purple-900/10 hover:bg-purple-900/20 border-purple-900/20" },
                { label: "Notifications", sub: "Alerts",          href: "/notifications", icon: Activity,   color: "text-yellow-400", bg: "bg-yellow-900/10 hover:bg-yellow-900/20 border-yellow-900/20" },
              ].map((a) => (
                <Link key={a.href} href={a.href}>
                  <div className={`flex flex-col items-center text-center gap-1.5 p-4 rounded-xl border ${a.bg} transition-colors cursor-pointer`}>
                    <a.icon className={`w-5 h-5 ${a.color}`} />
                    <p className="text-xs font-semibold text-white">{a.label}</p>
                    <p className="text-[10px] text-gray-600">{a.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right column: recent activity (2/5) */}
          <div className="lg:col-span-2">
            <div className="bg-[#0a1208] border border-green-900/25 rounded-2xl overflow-hidden h-full">
              <div className="flex items-center justify-between px-5 py-4 border-b border-green-900/20">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-bold text-white">Recent Activity</span>
                </div>
                <Link href="/transactions">
                  <button className="text-xs text-green-400 hover:text-green-300 font-medium flex items-center gap-1">
                    All <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>

              <div className="p-3">
                {(dash?.recentTransactions?.length ?? 0) === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-2xl bg-green-900/20 flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-5 h-5 text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No transactions yet</p>
                    <p className="text-gray-600 text-xs mt-1">Make a deposit to begin</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {dash?.recentTransactions?.slice(0, 8).map((tx: any) => {
                      const credit = TX_CREDIT.has(tx.type);
                      const icon   = TX_ICON[tx.type] ?? "·";
                      return (
                        <div key={tx.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-green-900/10 transition-colors group cursor-default">
                          {/* icon bubble */}
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                            credit
                              ? "bg-green-900/30 text-green-400"
                              : "bg-red-900/20 text-red-400"
                          }`}>
                            {icon}
                          </div>
                          {/* description */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-200 truncate leading-tight">
                              {tx.description}
                            </p>
                            <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(tx.createdAt)}</p>
                          </div>
                          {/* amount + status */}
                          <div className="text-right shrink-0">
                            <p className={`text-xs font-bold leading-tight ${credit ? "text-green-400" : "text-red-400"}`}>
                              {credit ? "+" : "−"}{fmt(tx.amount)}
                            </p>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                              tx.status === "COMPLETED" ? "bg-green-900/30 text-green-500" :
                              tx.status === "PENDING"   ? "bg-yellow-900/30 text-yellow-500" :
                              "bg-red-900/20 text-red-500"
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Earnings banner (only if they have earnings) ───── */}
        {(dash?.totalEarnings ?? 0) > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-900/30 via-emerald-900/20 to-teal-900/10 border border-green-700/25 p-5">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[80px] font-black text-green-900/20 select-none pointer-events-none leading-none">
              ✦
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Staking Earnings</p>
                <p className="text-2xl font-black text-green-400">{fmt(dash?.totalEarnings ?? 0)}</p>
              </div>
              {roi > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xl font-black text-yellow-400">+{roi.toFixed(2)}%</p>
                    <p className="text-[10px] text-gray-600">Return on investment</p>
                  </div>
                  <Link href="/staking">
                    <Button size="sm" className="bg-green-600 hover:bg-green-500 gap-1.5 font-semibold shrink-0">
                      <Zap className="w-3.5 h-3.5" /> Stake More
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useGetDashboard, useGetMe, useInitiateDeposit, useRequestWithdrawal, useListStakes } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet, TrendingUp, DollarSign, Users, ArrowDownLeft, ArrowUpRight,
  Clock, Star, Zap, Target, Gift, ChevronRight, Activity, Percent
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

function formatKES(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function DepositDialog({ mpesaNumber }: { mpesaNumber?: string | null }) {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(mpesaNumber ?? "");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const deposit = useInitiateDeposit({
    mutation: {
      onSuccess: () => {
        toast({ title: "STK Push Sent!", description: "Check your phone and enter your M-Pesa PIN." });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me/dashboard"] });
        setOpen(false);
        setAmount("");
      },
      onError: (e: any) => {
        toast({ title: "Deposit failed", description: e?.data?.error ?? e?.message ?? "Try again", variant: "destructive" });
      },
    },
  });

  const presets = [500, 1000, 5000, 10000];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-500 gap-2 shadow-md shadow-green-900/30">
          <ArrowDownLeft className="w-4 h-4" /> Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-900/40 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-green-400" />
            </div>
            Deposit via M-Pesa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-gray-300">Amount (KES)</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 text-lg" type="number" />
            <div className="flex gap-2 mt-2">
              {presets.map((p) => (
                <button key={p} onClick={() => setAmount(String(p))}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                    amount === String(p) ? "border-green-500 bg-green-900/40 text-green-300" : "border-green-900/30 text-gray-500 hover:border-green-700 hover:text-gray-300"
                  }`}>
                  {p >= 1000 ? `${p/1000}K` : p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-gray-300">M-Pesa Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712345678"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
          </div>
          {amount && Number(amount) > 0 && (
            <div className="bg-green-900/20 rounded-xl p-3 border border-green-900/30 text-sm space-y-1">
              <div className="flex justify-between text-gray-400">
                <span>You send</span><span className="text-white font-medium">{formatKES(Number(amount))}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Credited to account</span><span className="text-green-400 font-medium">{formatKES(Number(amount))}</span>
              </div>
            </div>
          )}
          <Button className="w-full bg-green-600 hover:bg-green-500 h-11 text-base"
            disabled={!amount || !phone || deposit.isPending}
            onClick={() => deposit.mutate({ data: { amount: Number(amount), phoneNumber: phone } })}>
            {deposit.isPending ? "Sending STK Push..." : "Send STK Push"}
          </Button>
          <p className="text-xs text-center text-gray-500">You'll receive a prompt on your phone to authorize payment</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WithdrawDialog({ mpesaNumber, maxAmount }: { mpesaNumber?: string | null; maxAmount: number }) {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(mpesaNumber ?? "");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const withdraw = useRequestWithdrawal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Withdrawal Requested", description: "Admin will process your withdrawal shortly." });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me/dashboard"] });
        setOpen(false);
        setAmount("");
      },
      onError: (e: any) => {
        toast({ title: "Withdrawal failed", description: e?.data?.error ?? e?.message ?? "Try again", variant: "destructive" });
      },
    },
  });

  const amountNum = Number(amount);
  const isValid = amountNum >= 100 && amountNum <= maxAmount && phone.length >= 10;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-green-700/50 text-green-300 hover:bg-green-900/30 gap-2">
          <ArrowUpRight className="w-4 h-4" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-900/40 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-blue-400" />
            </div>
            Request Withdrawal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-green-900/20 rounded-xl p-3 border border-green-900/30 flex justify-between items-center">
            <span className="text-sm text-gray-400">Available to withdraw</span>
            <span className="text-green-400 font-bold">{formatKES(maxAmount)}</span>
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <Label className="text-gray-300">Amount (KES)</Label>
              <button onClick={() => setAmount(String(maxAmount))} className="text-xs text-green-400 hover:text-green-300">
                Max: {formatKES(maxAmount)}
              </button>
            </div>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Min. 100"
              className="bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 text-lg" type="number" />
          </div>
          <div>
            <Label className="text-gray-300">M-Pesa Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712345678"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
          </div>
          <div className="bg-yellow-900/10 border border-yellow-900/20 rounded-xl p-3 text-xs text-yellow-400/80">
            ⚡ Withdrawals are processed by admin and sent to your M-Pesa within 24 hours.
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-500 h-11 text-base"
            disabled={!isValid || withdraw.isPending}
            onClick={() => withdraw.mutate({ data: { amount: amountNum, phoneNumber: phone } })}>
            {withdraw.isPending ? "Submitting..." : "Request Withdrawal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const statusColors: Record<string, string> = {
  COMPLETED: "text-green-400 bg-green-900/30",
  PENDING: "text-yellow-400 bg-yellow-900/30",
  FAILED: "text-red-400 bg-red-900/30",
  REJECTED: "text-red-400 bg-red-900/30",
};

const txTypePrefix: Record<string, string> = {
  DEPOSIT: "+", INTEREST: "+", REFERRAL_REWARD: "+", MANUAL_CREDIT: "+", UNSTAKE: "+",
  WITHDRAWAL: "-", STAKE: "-", MANUAL_DEBIT: "-",
};

export default function DashboardPage() {
  const { data: me } = useGetMe();
  const { data: dash, isLoading } = useGetDashboard();
  const { data: stakes = [] } = useListStakes();

  const activeStakes = stakes.filter((s: any) => s.status === "ACTIVE");

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const totalPortfolio = (dash?.availableBalance ?? 0) + (dash?.totalStaked ?? 0);
  const roiPercent = dash?.totalStaked ? ((dash?.totalEarnings ?? 0) / dash.totalStaked) * 100 : 0;

  const stats = [
    {
      label: "Available Balance",
      value: formatKES(dash?.availableBalance ?? 0),
      icon: Wallet,
      color: "text-green-400",
      bg: "bg-green-900/20 border-green-800/30",
      iconBg: "bg-green-900/40",
    },
    {
      label: "Total Staked",
      value: formatKES(dash?.totalStaked ?? 0),
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-900/10 border-blue-800/20",
      iconBg: "bg-blue-900/30",
    },
    {
      label: "Total Earnings",
      value: formatKES(dash?.totalEarnings ?? 0),
      icon: DollarSign,
      color: "text-yellow-400",
      bg: "bg-yellow-900/10 border-yellow-800/20",
      iconBg: "bg-yellow-900/30",
    },
    {
      label: "Referral Rewards",
      value: formatKES(dash?.referralRewards ?? 0),
      icon: Gift,
      color: "text-purple-400",
      bg: "bg-purple-900/10 border-purple-800/20",
      iconBg: "bg-purple-900/30",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back{me?.fullName ? `, ${me.fullName.split(" ")[0]}` : ""}! 👋
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Portfolio value: <span className="text-green-400 font-semibold">{formatKES(totalPortfolio)}</span>
              {roiPercent > 0 && <span className="text-yellow-400 ml-2">+{roiPercent.toFixed(1)}% ROI</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <DepositDialog mpesaNumber={me?.mpesaNumber} />
            <WithdrawDialog mpesaNumber={me?.mpesaNumber} maxAmount={dash?.availableBalance ?? 0} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <Card key={s.label} className={`border ${s.bg} bg-transparent`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={`w-7 h-7 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                    <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                  </div>
                  <span className="text-xs text-gray-400">{s.label}</span>
                </div>
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Start Staking", href: "/staking", icon: TrendingUp, color: "text-green-400", bg: "hover:bg-green-900/20 border-green-900/30" },
            { label: "My Transactions", href: "/transactions", icon: Activity, color: "text-blue-400", bg: "hover:bg-blue-900/20 border-blue-900/30" },
            { label: "Refer Friends", href: "/referrals", icon: Users, color: "text-purple-400", bg: "hover:bg-purple-900/20 border-purple-900/30" },
            { label: "Notifications", href: "/notifications", icon: Star, color: "text-yellow-400", bg: "hover:bg-yellow-900/20 border-yellow-900/30" },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <div className={`flex items-center gap-3 p-3 rounded-xl border bg-[#0d1a10] ${a.bg} cursor-pointer transition-colors group`}>
                <a.icon className={`w-5 h-5 ${a.color}`} />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{a.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 ml-auto group-hover:text-gray-400" />
              </div>
            </Link>
          ))}
        </div>

        {/* Stakes + Transactions */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Active Stakes */}
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  Active Stakes
                  {activeStakes.length > 0 && (
                    <Badge className="bg-green-900/40 text-green-400 border-green-700/40 text-xs">
                      {activeStakes.length}
                    </Badge>
                  )}
                </div>
                <Link href="/staking">
                  <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 text-xs h-7">
                    + New Stake
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeStakes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-green-900/20 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm">No active stakes yet</p>
                  <Link href="/staking">
                    <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-500">Start Staking</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeStakes.slice(0, 4).map((stake: any) => {
                    const endDate = new Date(stake.endDate);
                    const now = new Date();
                    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));
                    const progress = Math.min(100, Math.max(0, 100 - (daysLeft / stake.plan.durationDays) * 100));
                    return (
                      <div key={stake.id} className="bg-[#0a1410] rounded-xl p-3 border border-green-900/20">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="text-sm font-medium text-white">{stake.plan.name}</p>
                            <p className="text-xs text-gray-500">{formatKES(stake.principalAmount)}</p>
                          </div>
                          <Badge className="bg-green-900/30 text-green-400 border-green-700/30 text-xs">
                            {stake.plan.roiPercent}% ROI
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>{daysLeft}d left</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5 bg-green-900/30" />
                        </div>
                      </div>
                    );
                  })}
                  {activeStakes.length > 4 && (
                    <Link href="/staking">
                      <p className="text-xs text-green-400 text-center hover:text-green-300 cursor-pointer">
                        +{activeStakes.length - 4} more stakes
                      </p>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Recent Activity
                </div>
                <Link href="/transactions">
                  <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 text-xs h-7">
                    View all
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(dash?.recentTransactions?.length ?? 0) === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-green-900/20 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm">No transactions yet</p>
                  <p className="text-gray-600 text-xs mt-1">Make a deposit to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dash?.recentTransactions?.slice(0, 6).map((tx: any) => {
                    const prefix = txTypePrefix[tx.type] ?? "";
                    const isCredit = prefix === "+";
                    return (
                      <div key={tx.id} className="flex items-center gap-3 py-1.5 border-b border-green-900/10 last:border-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isCredit ? "bg-green-900/30 text-green-400" : "bg-red-900/20 text-red-400"
                        }`}>
                          {isCredit ? "+" : "-"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{tx.description}</p>
                          <p className="text-[10px] text-gray-500">{new Date(tx.createdAt).toLocaleDateString("en-KE")}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-semibold ${isCredit ? "text-green-400" : "text-red-400"}`}>
                            {prefix}{formatKES(tx.amount)}
                          </p>
                          <Badge className={`text-[10px] px-1 py-0 ${statusColors[tx.status] ?? "text-gray-400"}`}>{tx.status}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Earnings Summary */}
        {(dash?.totalEarnings ?? 0) > 0 && (
          <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/20 border-green-700/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                  <Percent className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Total earnings from staking</p>
                  <p className="text-2xl font-bold text-green-400">{formatKES(dash?.totalEarnings ?? 0)}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500">Return on investment</p>
                  <p className="text-xl font-bold text-yellow-400">+{roiPercent.toFixed(2)}%</p>
                </div>
                <Link href="/staking">
                  <Button size="sm" className="bg-green-600 hover:bg-green-500 gap-1.5 shrink-0">
                    <Zap className="w-3.5 h-3.5" /> Stake More
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

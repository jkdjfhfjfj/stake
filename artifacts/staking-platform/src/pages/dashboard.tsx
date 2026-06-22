import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useGetDashboard, useGetMe, useInitiateDeposit, useRequestWithdrawal } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, DollarSign, Users, ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
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
        toast({ title: "Deposit failed", description: e?.response?.data?.error ?? "Try again", variant: "destructive" });
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-500 gap-2">
          <ArrowDownLeft className="w-4 h-4" /> Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit via M-Pesa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Amount (KES)</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" type="number" />
          </div>
          <div>
            <Label>M-Pesa Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712345678"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-500"
            disabled={!amount || !phone || deposit.isPending}
            onClick={() => deposit.mutate({ data: { amount: Number(amount), phoneNumber: phone } })}>
            {deposit.isPending ? "Sending STK Push..." : "Send STK Push"}
          </Button>
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
        toast({ title: "Withdrawal failed", description: e?.response?.data?.error ?? "Try again", variant: "destructive" });
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-green-700 text-green-300 hover:bg-green-900/30 gap-2">
          <ArrowUpRight className="w-4 h-4" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-400">Available: <span className="text-green-400 font-medium">{formatKES(maxAmount)}</span></p>
          <div>
            <Label>Amount (KES)</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Min. 100"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" type="number" />
          </div>
          <div>
            <Label>M-Pesa Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712345678"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-500"
            disabled={!amount || !phone || withdraw.isPending}
            onClick={() => withdraw.mutate({ data: { amount: Number(amount), phoneNumber: phone } })}>
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

export default function DashboardPage() {
  const { data: me } = useGetMe();
  const { data: dash, isLoading } = useGetDashboard();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const stats = [
    { label: "Available Balance", value: formatKES(dash?.availableBalance ?? 0), icon: Wallet, color: "text-green-400" },
    { label: "Total Staked", value: formatKES(dash?.totalStaked ?? 0), icon: TrendingUp, color: "text-blue-400" },
    { label: "Total Earnings", value: formatKES(dash?.totalEarnings ?? 0), icon: DollarSign, color: "text-yellow-400" },
    { label: "Referral Rewards", value: formatKES(dash?.referralRewards ?? 0), icon: Users, color: "text-purple-400" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back{me?.fullName ? `, ${me.fullName.split(" ")[0]}` : ""}! 👋
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">Here's your portfolio overview</p>
          </div>
          <div className="flex gap-2">
            <DepositDialog mpesaNumber={me?.mpesaNumber} />
            <WithdrawDialog mpesaNumber={me?.mpesaNumber} maxAmount={dash?.availableBalance ?? 0} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="bg-[#0d1a10] border-green-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-gray-400">{s.label}</span>
                </div>
                <div className="text-lg font-bold text-white">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Stakes & Recent Txs */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center justify-between">
                Active Stakes
                <Link href="/staking">
                  <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 text-xs">
                    + New Stake
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(dash?.activeStakesCount ?? 0) === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No active stakes</p>
                  <Link href="/staking">
                    <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-500">Start Staking</Button>
                  </Link>
                </div>
              ) : (
                <p className="text-green-400 text-2xl font-bold">{dash?.activeStakesCount} active</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0d1a10] border-green-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center justify-between">
                Recent Transactions
                <Link href="/transactions">
                  <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 text-xs">View all</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(dash?.recentTransactions?.length ?? 0) === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dash?.recentTransactions?.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-sm text-white">{tx.description}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString("en-KE")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{formatKES(tx.amount)}</p>
                        <Badge className={`text-xs px-1.5 py-0 ${statusColors[tx.status] ?? "text-gray-400"}`}>{tx.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useListStakingPlans, useListStakes, useCreateStake, useBreakStake, useGetMe } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { TrendingUp, Clock, Shield, Zap, Repeat2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function StakePlanCard({ plan, availableBalance }: { plan: any; availableBalance: number }) {
  const [amount, setAmount] = useState("");
  const [autoInvest, setAutoInvest] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const createStake = useCreateStake({
    mutation: {
      onSuccess: () => {
        toast({ title: "Stake Created!", description: `You've staked ${formatKES(Number(amount))} in ${plan.name}.` });
        queryClient.invalidateQueries({ queryKey: ["/api/stakes"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me/dashboard"] });
        setOpen(false);
        setAmount("");
      },
      onError: (e: any) => {
        toast({ title: "Stake failed", description: e?.data?.error ?? e?.message ?? "Try again", variant: "destructive" });
      },
    },
  });

  const roi = Number(plan.roiPercent);
  const projectedReturn = Number(amount) * (1 + roi / 100);

  return (
    <Card className="bg-[#0d1a10] border-green-900/30 hover:border-green-700/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
          <Badge className="bg-green-900/40 text-green-400 border-green-700/50">{plan.roiPercent}% ROI</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{plan.durationDays} days</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>{plan.earlyWithdrawalPenalty}% penalty</span>
          </div>
          <div className="text-gray-400">Min: <span className="text-white">{formatKES(plan.minAmount)}</span></div>
          <div className="text-gray-400">Max: <span className="text-white">{formatKES(plan.maxAmount)}</span></div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-green-600 hover:bg-green-500 text-white">Stake Now</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Stake in {plan.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <div className="bg-green-900/20 rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Duration</span><span className="text-white">{plan.durationDays} days</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>ROI</span><span className="text-green-400">{plan.roiPercent}%</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Available Balance</span><span className="text-white">{formatKES(availableBalance)}</span>
                </div>
              </div>

              <div>
                <Label>Amount to Stake (KES)</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number"
                  placeholder={`Min ${formatKES(plan.minAmount)}`}
                  className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
              </div>

              {amount && Number(amount) > 0 && (
                <div className="bg-green-900/20 rounded-xl p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Projected Return</span>
                    <span className="text-green-400 font-semibold">{formatKES(projectedReturn)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-400">Interest</span>
                    <span className="text-green-400">+{formatKES(projectedReturn - Number(amount))}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Repeat2 className="w-4 h-4 text-green-400" /> Auto-Invest on Maturity
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">Automatically re-stake when plan matures</p>
                </div>
                <Switch checked={autoInvest} onCheckedChange={setAutoInvest} />
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-500"
                disabled={!amount || createStake.isPending}
                onClick={() => createStake.mutate({ data: { planId: plan.id, amount: Number(amount), autoInvest } })}>
                {createStake.isPending ? "Staking..." : "Confirm Stake"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ActiveStakeCard({ stake }: { stake: any }) {
  const { toast } = useToast();
  const breakStake = useBreakStake({
    mutation: {
      onSuccess: () => {
        toast({ title: "Stake broken", description: "Funds returned (minus penalty)." });
        queryClient.invalidateQueries({ queryKey: ["/api/stakes"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me/dashboard"] });
      },
      onError: (e: any) => {
        toast({ title: "Error", description: e?.data?.error ?? e?.message ?? "Try again", variant: "destructive" });
      },
    },
  });

  const endDate = new Date(stake.endDate);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));
  const progress = Math.min(100, Math.max(0, 100 - (daysLeft / stake.plan.durationDays) * 100));

  return (
    <Card className="bg-[#0d1a10] border-green-900/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-white">{stake.plan.name}</p>
            <p className="text-xs text-gray-400">{formatKES(stake.principalAmount)} staked</p>
          </div>
          <Badge className="bg-green-900/30 text-green-400 border-green-700/30">
            {stake.plan.roiPercent}% ROI
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{daysLeft} days left</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full h-1.5 bg-green-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Matures</span>
          <span className="text-white">{endDate.toLocaleDateString("en-KE")}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Auto-Invest</span>
          <span className={stake.autoInvest ? "text-green-400" : "text-gray-500"}>{stake.autoInvest ? "On" : "Off"}</span>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full border-red-900/40 text-red-400 hover:bg-red-900/20 gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Break Early ({stake.plan.earlyWithdrawalPenalty}% penalty)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#0d1a10] border-red-900/40 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Break Stake Early?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                You'll lose {stake.plan.earlyWithdrawalPenalty}% of your principal as a penalty.
                You'll receive {formatKES(stake.principalAmount * (1 - stake.plan.earlyWithdrawalPenalty / 100))}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-green-900/40 text-gray-300">Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-500"
                onClick={() => breakStake.mutate({ id: stake.id })}>
                Break Stake
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default function StakingPlansPage() {
  const { data: plans = [], isLoading: plansLoading } = useListStakingPlans();
  const { data: stakes = [], isLoading: stakesLoading } = useListStakes();
  const { data: me } = useGetMe();

  const activeStakes = stakes.filter((s) => s.status === "ACTIVE");
  const completedStakes = stakes.filter((s) => s.status !== "ACTIVE");

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Staking Plans</h1>
          <p className="text-gray-400 text-sm mt-1">Choose a plan and start earning today</p>
        </div>

        {/* Plans */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Available Plans</h2>
          {plansLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <Card className="bg-[#0d1a10] border-green-900/30">
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">No staking plans available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <StakePlanCard key={plan.id} plan={plan} availableBalance={me?.availableBalance ?? 0} />
              ))}
            </div>
          )}
        </div>

        {/* Active Stakes */}
        {activeStakes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">My Active Stakes ({activeStakes.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStakes.map((stake) => <ActiveStakeCard key={stake.id} stake={stake} />)}
            </div>
          </div>
        )}

        {/* History */}
        {completedStakes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Stake History</h2>
            <div className="space-y-2">
              {completedStakes.map((stake) => (
                <div key={stake.id} className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{stake.plan.name}</p>
                    <p className="text-xs text-gray-400">{new Date(stake.createdAt).toLocaleDateString("en-KE")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{formatKES(stake.principalAmount)}</p>
                    <Badge className={stake.status === "COMPLETED" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}>
                      {stake.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

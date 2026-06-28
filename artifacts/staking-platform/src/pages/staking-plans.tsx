import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useListStakingPlans, useListStakes, useCreateStake, useBreakStake, useGetMe } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  TrendingUp, Clock, Shield, Zap, Repeat2, AlertTriangle, Wallet,
  Star, CheckCircle, Calculator, CalendarDays, Award, ChevronDown, ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function tierBadge(plan: any) {
  const roi = Number(plan.roiPercent);
  if (roi >= 20) return { label: "Premium", color: "bg-yellow-900/40 text-yellow-400 border-yellow-700/40" };
  if (roi >= 10) return { label: "Growth", color: "bg-blue-900/40 text-blue-400 border-blue-700/40" };
  return { label: "Starter", color: "bg-green-900/40 text-green-400 border-green-700/40" };
}

function StakePlanCard({ plan, availableBalance, rank }: { plan: any; availableBalance: number; rank: number }) {
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
  const amountNum = Number(amount);
  const interest = amountNum * (roi / 100);
  const projectedReturn = amountNum + interest;
  const maturityDate = new Date(Date.now() + plan.durationDays * 86400000);
  const canAfford = amountNum <= availableBalance;
  const meetsMin = amountNum >= plan.minAmount;
  const meetsMax = plan.maxAmount === 0 || amountNum <= plan.maxAmount;
  const isValid = amountNum > 0 && canAfford && meetsMin && meetsMax;
  const tier = tierBadge(plan);

  const presets = [plan.minAmount, plan.minAmount * 2, plan.minAmount * 5].filter(p => p <= (plan.maxAmount || Infinity));

  return (
    <Card className={`bg-[#0d1a10] border-green-900/30 hover:border-green-700/50 transition-all hover:shadow-lg hover:shadow-green-900/10 relative overflow-hidden ${rank === 0 ? "ring-1 ring-green-500/30" : ""}`}>
      {rank === 0 && (
        <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl flex items-center gap-1">
          <Star className="w-2.5 h-2.5" /> POPULAR
        </div>
      )}
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
            <Badge className={`mt-1 text-xs border ${tier.color}`}>{tier.label}</Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-green-400">{plan.roiPercent}%</div>
            <div className="text-xs text-gray-500">ROI</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-[#0a1410] rounded-xl p-2.5 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-500">Duration</p>
              <p className="text-white font-medium">{plan.durationDays}d</p>
            </div>
          </div>
          <div className="bg-[#0a1410] rounded-xl p-2.5 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-500">Penalty</p>
              <p className="text-white font-medium">{plan.earlyWithdrawalPenalty}%</p>
            </div>
          </div>
          <div className="bg-[#0a1410] rounded-xl p-2.5 flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-500">Min Stake</p>
              <p className="text-white font-medium">{formatKES(plan.minAmount)}</p>
            </div>
          </div>
          <div className="bg-[#0a1410] rounded-xl p-2.5 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-500">Max Stake</p>
              <p className="text-white font-medium">{plan.maxAmount === 0 ? "No limit" : formatKES(plan.maxAmount)}</p>
            </div>
          </div>
        </div>

        {/* Quick return preview */}
        <div className="bg-[#0a1a0d] border border-green-900/25 rounded-xl p-3 text-xs overflow-hidden">
          <p className="text-gray-400 mb-2 truncate">Min stake: {formatKES(plan.minAmount)}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 shrink-0">You receive</span>
            <span className="text-green-400 font-semibold text-right">{formatKES(plan.minAmount * (1 + roi / 100))}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-gray-500 shrink-0">Profit</span>
            <span className="text-yellow-400 font-semibold text-right">+{formatKES(plan.minAmount * (roi / 100))}</span>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-green-600 hover:bg-green-500 text-white h-10">
              Stake Now <Zap className="w-3.5 h-3.5 ml-1" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Stake in {plan.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <div className="bg-green-900/20 rounded-xl p-4 text-sm space-y-2 border border-green-900/30">
                <div className="flex justify-between text-gray-400">
                  <span>Duration</span><span className="text-white">{plan.durationDays} days</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>ROI</span><span className="text-green-400 font-bold">{plan.roiPercent}%</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Early withdrawal penalty</span><span className="text-orange-400">{plan.earlyWithdrawalPenalty}%</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Available Balance</span><span className="text-white font-medium">{formatKES(availableBalance)}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <Label>Amount to Stake (KES)</Label>
                  <button onClick={() => setAmount(String(Math.min(availableBalance, plan.maxAmount || availableBalance)))} className="text-xs text-green-400 hover:text-green-300">
                    Max available
                  </button>
                </div>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number"
                  placeholder={`Min ${formatKES(plan.minAmount)}`}
                  className="bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 text-lg" />
                {presets.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {presets.map((p) => (
                      <button key={p} onClick={() => setAmount(String(p))}
                        className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                          amount === String(p) ? "border-green-500 bg-green-900/40 text-green-300" : "border-green-900/30 text-gray-500 hover:border-green-700 hover:text-gray-300"
                        }`}>
                        {formatKES(p).replace("KES ", "")}
                      </button>
                    ))}
                  </div>
                )}
                {amountNum > 0 && !canAfford && (
                  <p className="text-red-400 text-xs mt-1">Insufficient balance. Available: {formatKES(availableBalance)}</p>
                )}
                {amountNum > 0 && canAfford && !meetsMin && (
                  <p className="text-yellow-400 text-xs mt-1">Minimum stake is {formatKES(plan.minAmount)}</p>
                )}
              </div>

              {amountNum > 0 && amountNum > 0 && (
                <div className="bg-green-900/20 rounded-xl p-4 border border-green-900/30 text-sm space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-green-400" />
                    <span className="font-medium text-white">Return Calculator</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Principal</span>
                    <span className="text-white">{formatKES(amountNum)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Interest ({plan.roiPercent}%)</span>
                    <span className="text-green-400">+{formatKES(interest)}</span>
                  </div>
                  <div className="border-t border-green-900/20 pt-2 flex justify-between">
                    <span className="font-semibold text-white">Total Return</span>
                    <span className="font-bold text-green-400 text-lg">{formatKES(projectedReturn)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Matures on</span>
                    <span className="text-white">{maturityDate.toLocaleDateString("en-KE")}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between bg-[#0a1410] rounded-xl p-3 border border-green-900/20">
                <div>
                  <Label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Repeat2 className="w-4 h-4 text-green-400" /> Auto-Invest on Maturity
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">Automatically re-stake when plan matures</p>
                </div>
                <Switch checked={autoInvest} onCheckedChange={setAutoInvest} />
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-500 h-11 text-base"
                disabled={!isValid || createStake.isPending}
                onClick={() => createStake.mutate({ data: { planId: plan.id, amount: amountNum, autoInvest } })}>
                {createStake.isPending ? "Staking..." : `Confirm — ${amountNum > 0 ? formatKES(amountNum) : "Enter amount"}`}
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
  const [expanded, setExpanded] = useState(false);
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
  const startDate = new Date(stake.createdAt);
  const now = new Date();
  const totalDays = stake.plan.durationDays;
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));
  const daysElapsed = totalDays - daysLeft;
  const progress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  const penaltyAmount = stake.principalAmount * (stake.plan.earlyWithdrawalPenalty / 100);
  const earlyReturnAmount = stake.principalAmount - penaltyAmount;
  const fullReturn = stake.principalAmount * (1 + stake.plan.roiPercent / 100);

  return (
    <Card className="bg-[#0d1a10] border-green-900/30 hover:border-green-700/30 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-white">{stake.plan.name}</p>
            <p className="text-xs text-gray-400">{formatKES(stake.principalAmount)} staked</p>
          </div>
          <div className="text-right">
            <Badge className="bg-green-900/30 text-green-400 border-green-700/30 text-xs">
              {stake.plan.roiPercent}% ROI
            </Badge>
            {stake.autoInvest && (
              <div className="flex items-center gap-1 mt-1 justify-end">
                <Repeat2 className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-blue-400">Auto-Invest</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{daysElapsed}d elapsed</span>
            <span className="font-medium text-white">{daysLeft} days left</span>
          </div>
          <Progress value={progress} className="h-2 bg-green-900/30" />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>{startDate.toLocaleDateString("en-KE")}</span>
            <span>{endDate.toLocaleDateString("en-KE")}</span>
          </div>
        </div>

        <div className="flex justify-between text-sm bg-[#0a1410] rounded-lg p-2.5 border border-green-900/20">
          <div>
            <p className="text-[10px] text-gray-500">Projected Return</p>
            <p className="text-green-400 font-bold">{formatKES(fullReturn)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Profit</p>
            <p className="text-yellow-400 font-medium">+{formatKES(fullReturn - stake.principalAmount)}</p>
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors py-1">
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide details</> : <><ChevronDown className="w-3.5 h-3.5" /> Show details</>}
        </button>

        {expanded && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full border-red-900/40 text-red-400 hover:bg-red-900/20 gap-1.5 h-9">
                <AlertTriangle className="w-3.5 h-3.5" /> Break Early ({stake.plan.earlyWithdrawalPenalty}% penalty)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#0d1a10] border-red-900/40 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Break Stake Early?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400 space-y-2">
                  <span className="block">You'll lose <strong className="text-red-400">{formatKES(penaltyAmount)}</strong> ({stake.plan.earlyWithdrawalPenalty}%) as an early withdrawal penalty.</span>
                  <span className="block bg-red-900/10 border border-red-900/20 rounded-lg p-3 text-sm">
                    You'll receive back: <strong className="text-white">{formatKES(earlyReturnAmount)}</strong>
                  </span>
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
        )}
      </CardContent>
    </Card>
  );
}

export default function StakingPlansPage() {
  const { data: plans = [], isLoading: plansLoading } = useListStakingPlans();
  const { data: stakes = [], isLoading: stakesLoading } = useListStakes();
  const { data: me } = useGetMe();

  const activeStakes = stakes.filter((s: any) => s.status === "ACTIVE");
  const completedStakes = stakes.filter((s: any) => s.status === "COMPLETED");
  const brokenStakes = stakes.filter((s: any) => s.status === "BROKEN");

  const totalStaked = activeStakes.reduce((sum: number, s: any) => sum + s.principalAmount, 0);
  const totalEarned = completedStakes.reduce((sum: number, s: any) => sum + (s.principalAmount * s.plan.roiPercent / 100), 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Staking Plans</h1>
            <p className="text-gray-400 text-sm mt-1">Choose a plan and grow your money</p>
          </div>
          {activeStakes.length > 0 && (
            <div className="flex gap-3">
              <div className="bg-green-900/20 border border-green-800/30 rounded-xl px-4 py-2 text-center">
                <p className="text-xs text-gray-500">Currently Staked</p>
                <p className="text-sm font-bold text-green-400">{formatKES(totalStaked)}</p>
              </div>
              {totalEarned > 0 && (
                <div className="bg-yellow-900/10 border border-yellow-800/20 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-500">Total Earned</p>
                  <p className="text-sm font-bold text-yellow-400">{formatKES(totalEarned)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Plans */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-white">Available Plans</h2>
            {!plansLoading && plans.length > 0 && (
              <Badge className="bg-green-900/30 text-green-400 border-green-700/30">{plans.length}</Badge>
            )}
          </div>
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
              {plans.map((plan: any, i: number) => (
                <StakePlanCard key={plan.id} plan={plan} availableBalance={me?.availableBalance ?? 0} rank={i} />
              ))}
            </div>
          )}
        </section>

        {/* Active Stakes */}
        {activeStakes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-white">My Active Stakes</h2>
              <Badge className="bg-green-900/30 text-green-400 border-green-700/30">{activeStakes.length}</Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStakes.map((stake: any) => <ActiveStakeCard key={stake.id} stake={stake} />)}
            </div>
          </section>
        )}

        {/* History */}
        {(completedStakes.length > 0 || brokenStakes.length > 0) && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Stake History</h2>
            <Card className="bg-[#0d1a10] border-green-900/30">
              <CardContent className="p-0">
                <div className="divide-y divide-green-900/10">
                  {[...completedStakes, ...brokenStakes].map((stake: any) => (
                    <div key={stake.id} className="flex items-center gap-4 p-4 hover:bg-green-900/5 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        stake.status === "COMPLETED" ? "bg-green-900/30" : "bg-red-900/20"
                      }`}>
                        {stake.status === "COMPLETED"
                          ? <CheckCircle className="w-4 h-4 text-green-400" />
                          : <AlertTriangle className="w-4 h-4 text-red-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{stake.plan.name}</p>
                        <p className="text-xs text-gray-500">{new Date(stake.createdAt).toLocaleDateString("en-KE")} → {new Date(stake.endDate).toLocaleDateString("en-KE")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white font-medium">{formatKES(stake.principalAmount)}</p>
                        <Badge className={stake.status === "COMPLETED" ? "bg-green-900/30 text-green-400 border-0" : "bg-red-900/30 text-red-400 border-0"}>
                          {stake.status}
                        </Badge>
                      </div>
                      {stake.status === "COMPLETED" && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-500">Earned</p>
                          <p className="text-sm text-yellow-400 font-medium">+{formatKES(stake.principalAmount * stake.plan.roiPercent / 100)}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

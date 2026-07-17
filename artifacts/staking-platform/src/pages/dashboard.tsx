import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  useGetDashboard, useGetMe, useInitiateDeposit,
  useRequestWithdrawal, useListStakes,
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet, TrendingUp, DollarSign, Gift,
  ArrowDownLeft, ArrowUpRight, Clock, Users,
  Activity, Zap, Target, ChevronRight, BarChart3,
  CalendarClock, Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

/* ── helpers ─────────────────────────────────────────────────── */
function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtShort(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `KES ${(n / 1_000).toFixed(1)}K`;
  return `KES ${n.toFixed(0)}`;
}
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const TX_CREDIT = new Set(["DEPOSIT","INTEREST","REFERRAL_REWARD","MANUAL_CREDIT","UNSTAKE"]);
const TX_META: Record<string, { sym: string; label: string }> = {
  DEPOSIT:         { sym: "↓", label: "Deposit" },
  WITHDRAWAL:      { sym: "↑", label: "Withdrawal" },
  STAKE:           { sym: "S", label: "Stake" },
  INTEREST:        { sym: "✦", label: "Interest" },
  REFERRAL_REWARD: { sym: "R", label: "Referral" },
  MANUAL_CREDIT:   { sym: "+", label: "Credit" },
  MANUAL_DEBIT:    { sym: "−", label: "Debit" },
  UNSTAKE:         { sym: "↩", label: "Unstake" },
};

/* ── helpers ── */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("stakeke_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type PollState = "idle" | "waiting" | "completed" | "failed" | "timeout";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS  = 120_000; // 2 minutes

/* ── Deposit Dialog ──────────────────────────────────────────── */
function DepositDialog({ phone }: { phone?: string | null }) {
  const [amount, setAmount]     = useState("");
  const [phoneN, setPhoneN]     = useState(phone ?? "");
  const [open, setOpen]         = useState(false);
  const [pollState, setPollState] = useState<PollState>("idle");
  const [externalRef, setExternalRef] = useState("");
  const [countdown, setCountdown]     = useState(0);
  const { toast }               = useToast();
  const presets                 = [500, 1000, 5000, 10000];
  const pollRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef              = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef            = useRef<number>(0);

  const stopPolling = () => {
    if (pollRef.current)    clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollRef.current = null;
    timeoutRef.current = null;
  };

  useEffect(() => {
    if (pollState !== "waiting" || !externalRef) return;

    startedAtRef.current = Date.now();

    const doPoll = async () => {
      try {
        const res = await fetch(`/api/transactions/status/${externalRef}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json() as { status: string };

        const elapsed = Date.now() - startedAtRef.current;
        setCountdown(Math.max(0, Math.round((POLL_TIMEOUT_MS - elapsed) / 1000)));

        if (data.status === "COMPLETED") {
          stopPolling();
          setPollState("completed");
          queryClient.invalidateQueries({ queryKey: ["/api/users/me/dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          toast({ title: "Deposit confirmed!", description: `KES ${Number(amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })} credited to your balance.` });
          setTimeout(() => { setOpen(false); resetForm(); }, 2000);
        } else if (data.status === "FAILED") {
          stopPolling();
          setPollState("failed");
        }
      } catch { /* network error — keep polling */ }
    };

    pollRef.current = setInterval(doPoll, POLL_INTERVAL_MS);
    doPoll(); // immediate first check

    timeoutRef.current = setTimeout(() => {
      stopPolling();
      if (pollState === "waiting") setPollState("timeout");
    }, POLL_TIMEOUT_MS);

    return stopPolling;
  }, [pollState, externalRef]);

  useEffect(() => {
    if (!open) { stopPolling(); resetForm(); }
  }, [open]);

  const resetForm = () => {
    setAmount(""); setPollState("idle"); setExternalRef(""); setCountdown(0);
  };

  const deposit = useInitiateDeposit({
    mutation: {
      onSuccess: (data: any) => {
        const ref = data?.externalReference;
        if (ref) {
          setExternalRef(ref);
          setPollState("waiting");
          setCountdown(Math.round(POLL_TIMEOUT_MS / 1000));
        } else {
          toast({ title: "STK Push sent!", description: "Enter your M-Pesa PIN to complete." });
        }
      },
      onError: (e: any) => {
        toast({ title: "Deposit failed", description: e?.data?.error ?? e?.message, variant: "destructive" });
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-500 gap-2 font-semibold text-sm h-10 px-4">
          <ArrowDownLeft className="w-4 h-4" /> Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ArrowDownLeft className="w-4 h-4 text-green-400" /> Deposit via M-Pesa
          </DialogTitle>
        </DialogHeader>

        {/* ── Waiting for M-Pesa PIN ── */}
        {pollState === "waiting" && (
          <div className="py-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0a2510] border-2 border-green-700/50 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">Waiting for M-Pesa PIN</p>
              <p className="text-gray-400 text-sm">Check your Safaricom prompt and enter your PIN</p>
              <p className="text-gray-600 text-xs mt-2">Times out in {countdown}s</p>
            </div>
            <button onClick={() => { stopPolling(); setPollState("idle"); }}
              className="text-xs text-gray-500 underline">Cancel</button>
          </div>
        )}

        {/* ── Confirmed ── */}
        {pollState === "completed" && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#0a2510] border-2 border-green-500 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-white font-semibold">Deposit Confirmed!</p>
            <p className="text-green-400 text-lg font-black">{fmt(Number(amount))}</p>
            <p className="text-gray-400 text-sm">Added to your balance</p>
          </div>
        )}

        {/* ── Failed ── */}
        {pollState === "failed" && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#1a0808] border-2 border-red-800/50 flex items-center justify-center">
              <span className="text-2xl">✕</span>
            </div>
            <p className="text-white font-semibold">Payment failed</p>
            <p className="text-gray-400 text-sm text-center">
              The M-Pesa payment was cancelled or failed. Please try again.
            </p>
            <Button size="sm" onClick={() => setPollState("idle")} className="bg-green-600 hover:bg-green-500">Try Again</Button>
          </div>
        )}

        {/* ── Timeout ── */}
        {pollState === "timeout" && (
          <div className="py-5 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#1a1000] border-2 border-yellow-800/50 flex items-center justify-center">
              <span className="text-2xl">⏱</span>
            </div>
            <p className="text-white font-semibold">Confirmation timed out</p>
            <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3 w-full text-left space-y-2">
              <p className="text-yellow-300 text-xs font-medium">M-Pesa may still be processing</p>
              <p className="text-gray-400 text-xs">
                If you entered your M-Pesa PIN and were <strong className="text-white">debited but your balance was not credited</strong>,
                your payment may have been received on our end. Your balance will be updated once confirmed.
              </p>
              <p className="text-gray-400 text-xs">
                Please wait a few minutes and refresh the app. If the issue persists, contact support with your M-Pesa message reference.
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button size="sm" variant="outline" className="flex-1 border-yellow-700/40 text-yellow-300 hover:bg-yellow-900/20"
                onClick={() => window.location.reload()}>
                Refresh App
              </Button>
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-500"
                onClick={() => setPollState("idle")}>Try Again</Button>
            </div>
          </div>
        )}

        {/* ── Input form ── */}
        {pollState === "idle" && (
          <div className="space-y-4 pt-1">
            <div>
              <Label className="text-gray-400 text-xs">Amount (KES)</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" type="number"
                className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white text-xl h-12 focus:border-green-500" />
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {presets.map((p) => (
                  <button key={p} onClick={() => setAmount(String(p))}
                    className={`py-2 text-xs rounded-lg border font-medium ${
                      amount === String(p)
                        ? "border-green-500 bg-[#0a2510] text-green-300"
                        : "border-green-900/30 text-gray-500"
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
              <div className="bg-[#0a1a0d] rounded-xl p-3 border border-green-900/30 text-sm">
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
        )}
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
        <Button variant="outline" className="border-green-700/50 text-green-300 hover:bg-green-900/25 gap-2 font-semibold text-sm h-10 px-4">
          <ArrowUpRight className="w-4 h-4" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ArrowUpRight className="w-4 h-4 text-blue-400" /> Request Withdrawal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="flex justify-between items-center bg-[#0a1a0d] border border-green-900/30 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-400">Available</span>
            <span className="text-green-400 font-bold">{fmt(max)}</span>
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <Label className="text-gray-400 text-xs">Amount (KES)</Label>
              <button onClick={() => setAmount(String(max))} className="text-xs text-green-400">Use max</button>
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
          <p className="text-[11px] text-yellow-500/80 bg-[#1a1200] rounded-xl p-3 border border-yellow-900/20">
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

/* ── Transaction Detail Modal ────────────────────────────────── */
function TxDetailModal({ tx, onClose }: { tx: any; onClose: () => void }) {
  const credit = TX_CREDIT.has(tx.type);
  const info   = TX_META[tx.type] ?? { sym: "·", label: tx.type };
  const { toast } = useToast();

  const copyRef = () => {
    if (tx.externalReference) {
      navigator.clipboard.writeText(tx.externalReference).catch(() => {});
      toast({ title: "Reference copied!" });
    }
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${credit ? "bg-[#0a2510] text-green-400" : "bg-[#1a0808] text-red-400"}`}>
              {info.sym}
            </div>
            {info.label}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="rounded-xl border border-green-900/25 bg-[#0a1208] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Amount</p>
            <p className={`text-3xl font-black ${credit ? "text-green-400" : "text-red-400"}`}>
              {credit ? "+" : "−"}{fmt(tx.amount)}
            </p>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { label: "Status", value: tx.status, colored: true },
              { label: "Type", value: tx.type.replace(/_/g, " ") },
              { label: "Description", value: tx.description ?? "—" },
              { label: "Date", value: new Date(tx.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) },
              tx.phoneNumber ? { label: "Phone", value: tx.phoneNumber } : null,
              tx.externalReference ? { label: "M-Pesa Ref", value: tx.externalReference, copy: true } : null,
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-green-900/10 last:border-0">
                <span className="text-gray-500">{row.label}</span>
                <div className="flex items-center gap-1.5">
                  {row.colored ? (
                    <span className={`font-semibold ${
                      tx.status === "COMPLETED" ? "text-green-400" :
                      tx.status === "PENDING"   ? "text-yellow-400" :
                      tx.status === "FAILED"    ? "text-red-400" : "text-gray-400"
                    }`}>{row.value}</span>
                  ) : (
                    <span className="text-white text-right max-w-[160px] truncate">{row.value}</span>
                  )}
                  {row.copy && (
                    <button onClick={copyRef} className="text-gray-600 hover:text-green-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const activeStakes   = (stakes as any[]).filter((s) => s.status === "ACTIVE");
  const totalPortfolio = (dash?.availableBalance ?? 0) + (dash?.totalStaked ?? 0);
  const roi            = dash?.totalStaked ? ((dash.totalEarnings ?? 0) / dash.totalStaked) * 100 : 0;
  const firstName      = me?.fullName?.split(" ")[0] ?? "there";

  /* Daily earnings rate across all active stakes */
  const dailyRate = activeStakes.reduce((sum: number, s: any) => {
    const planRoi = s.plan?.roiPercent ?? 0;
    const days    = s.plan?.durationDays ?? 30;
    return sum + (s.principalAmount * planRoi / 100) / days;
  }, 0);

  /* Nearest maturity */
  const nextMaturity = activeStakes.reduce((nearest: Date | null, s: any) => {
    const d = new Date(s.endDate);
    if (!nearest || d < nearest) return d;
    return nearest;
  }, null as Date | null);
  const daysToNextMaturity = nextMaturity
    ? Math.max(0, Math.ceil((nextMaturity.getTime() - Date.now()) / 86400000))
    : null;

  /* Loading skeleton — static, no animate-pulse (avoids GPU compositing) */
  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="h-36 rounded-2xl bg-[#0d1a10] border border-green-900/20" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-[#0d1a10] border border-green-900/20" />)}
          </div>
          <div className="h-10 rounded-xl bg-[#0d1a10] border border-green-900/20" />
          <div className="h-48 rounded-2xl bg-[#0d1a10] border border-green-900/20" />
          <div className="h-48 rounded-2xl bg-[#0d1a10] border border-green-900/20" />
        </div>
      </AppLayout>
    );
  }

  const stats = [
    { label: "Available",  value: fmt(dash?.availableBalance ?? 0), icon: Wallet,    color: "text-green-400",  border: "border-green-800/30",  iconBg: "bg-[#0a2510]" },
    { label: "Staked",     value: fmt(dash?.totalStaked ?? 0),      icon: TrendingUp, color: "text-sky-400",    border: "border-sky-900/30",    iconBg: "bg-[#0a1a2a]" },
    { label: "Earnings",   value: fmt(dash?.totalEarnings ?? 0),    icon: DollarSign, color: "text-yellow-400", border: "border-yellow-900/30", iconBg: "bg-[#1a1400]" },
    { label: "Referrals",  value: fmt(dash?.referralRewards ?? 0),  icon: Gift,       color: "text-purple-400", border: "border-purple-900/30", iconBg: "bg-[#150a20]" },
  ];

  const quickActions = [
    { label: "Stake",         sub: "Earn returns", href: "/staking",       icon: TrendingUp, color: "text-green-400"  },
    { label: "History",       sub: "Transactions", href: "/transactions",  icon: BarChart3,  color: "text-sky-400"    },
    { label: "Refer",         sub: "Earn 5%",      href: "/referrals",     icon: Users,      color: "text-purple-400" },
    { label: "Notifications", sub: "Alerts",       href: "/notifications", icon: Activity,   color: "text-yellow-400" },
  ];

  return (
    <AppLayout>
      <div className="space-y-4">

        {/* ── Hero card ─────────────────────────────────────────── */}
        <div className="rounded-2xl bg-[#0d2010] border border-green-800/30 p-5">
          <p className="text-gray-400 text-sm mb-0.5">
            {greeting()}, <span className="text-white font-semibold">{firstName}</span> 👋
          </p>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Total Portfolio Value</p>
          <h1 className="text-3xl font-black text-white mb-3">{fmt(totalPortfolio)}</h1>

          {/* Insight pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {roi > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0a2510] border border-green-700/40 text-green-400 text-xs font-bold">
                ↑ {roi.toFixed(1)}% overall ROI
              </span>
            )}
            {dailyRate > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1a1400] border border-yellow-800/40 text-yellow-400 text-xs font-bold">
                <Sparkles className="w-3 h-3" /> +{fmtShort(dailyRate)}/day
              </span>
            )}
            {daysToNextMaturity !== null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0a1a2a] border border-sky-800/40 text-sky-400 text-xs font-bold">
                <CalendarClock className="w-3 h-3" />
                {daysToNextMaturity === 0 ? "Stake matures today!" : `Next payout in ${daysToNextMaturity}d`}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <DepositDialog phone={me?.mpesaNumber} />
            <WithdrawDialog phone={me?.mpesaNumber} max={dash?.availableBalance ?? 0} />
          </div>
        </div>

        {/* ── Stats 2×2 grid ────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`bg-[#0a1208] border ${s.border} rounded-2xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">{s.label}</span>
                <div className={`w-7 h-7 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
              </div>
              <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ──────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}>
              <div className="flex flex-col items-center text-center gap-1.5 py-3 px-1 rounded-2xl bg-[#0a1208] border border-green-900/20 cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-[#060d08] flex items-center justify-center">
                  <a.icon className={`w-4 h-4 ${a.color}`} />
                </div>
                <p className="text-[10px] font-semibold text-gray-300">{a.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Active Stakes ──────────────────────────────────────── */}
        <div className="bg-[#0a1208] border border-green-900/25 rounded-2xl">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-green-900/20">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-white">Active Stakes</span>
              {activeStakes.length > 0 && (
                <span className="bg-[#0a2510] text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-green-800/30">
                  {activeStakes.length}
                </span>
              )}
            </div>
            <Link href="/staking">
              <span className="text-xs text-green-400 font-medium flex items-center gap-0.5">
                + New <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          <div className="p-4">
            {activeStakes.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-[#060d08] border border-green-900/20 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm font-semibold mb-1">No active stakes yet</p>
                <p className="text-gray-600 text-xs mb-4">Deposit funds and start earning today</p>
                <Link href="/staking">
                  <Button size="sm" className="bg-green-600 hover:bg-green-500 gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Browse Plans
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeStakes.slice(0, 5).map((stake: any) => {
                  const end      = new Date(stake.endDate);
                  const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
                  const total    = stake.plan?.durationDays ?? 30;
                  const elapsed  = total - daysLeft;
                  const progress = Math.min(100, Math.round((elapsed / total) * 100));
                  const projected = stake.principalAmount * (1 + (stake.plan?.roiPercent ?? 0) / 100);

                  return (
                    <div key={stake.id} className="bg-[#060d08] border border-green-900/20 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="text-sm font-bold text-white">{stake.plan?.name ?? "Stake"}</p>
                            <span className="text-[10px] bg-[#0a2510] text-green-400 border border-green-800/30 rounded-full px-1.5 py-0.5 font-semibold whitespace-nowrap">
                              {stake.plan?.roiPercent ?? 0}% ROI
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {fmt(stake.principalAmount)} <span className="text-gray-600">→</span> <span className="text-green-400 font-semibold">{fmt(projected)}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-white">{daysLeft}d</p>
                          <p className="text-[10px] text-gray-600">left</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-gray-600">
                          <span>{elapsed}d elapsed</span>
                          <span className="text-green-400 font-semibold">{progress}%</span>
                        </div>
                        {/* Solid progress bar — no gradient, no animation */}
                        <div className="h-1.5 bg-[#0d1a10] rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {activeStakes.length > 5 && (
                  <Link href="/staking">
                    <p className="text-center text-xs text-green-400 py-1">
                      +{activeStakes.length - 5} more → View all
                    </p>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Transactions ────────────────────────────────── */}
        <div className="bg-[#0a1208] border border-green-900/25 rounded-2xl">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-green-900/20">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-bold text-white">Recent Activity</span>
            </div>
            <Link href="/transactions">
              <span className="text-xs text-green-400 font-medium flex items-center gap-0.5">
                All <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <div className="p-2">
            {(dash?.recentTransactions?.length ?? 0) === 0 ? (
              <div className="text-center py-10">
                <Clock className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No transactions yet</p>
                <p className="text-gray-600 text-xs mt-1">Make a deposit to begin</p>
              </div>
            ) : (
              dash?.recentTransactions?.slice(0, 8).map((tx: any) => {
                const credit = TX_CREDIT.has(tx.type);
                const info   = TX_META[tx.type] ?? { sym: "·", label: tx.type };
                return (
                  <button key={tx.id} onClick={() => setSelectedTx(tx)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-green-900/10 text-left">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      credit ? "bg-[#0a2510] text-green-400" : "bg-[#1a0808] text-red-400"
                    }`}>
                      {info.sym}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-200 truncate">{tx.description}</p>
                      <p className="text-[10px] text-gray-600">{info.label} · {timeAgo(tx.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${credit ? "text-green-400" : "text-red-400"}`}>
                        {credit ? "+" : "−"}{fmt(tx.amount)}
                      </p>
                      <span className={`text-[9px] font-semibold ${
                        tx.status === "COMPLETED" ? "text-green-600" :
                        tx.status === "PENDING"   ? "text-yellow-500" : "text-red-500"
                      }`}>{tx.status}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Earnings banner ───────────────────────────────────── */}
        {(dash?.totalEarnings ?? 0) > 0 && (
          <div className="rounded-2xl bg-[#0a1a0d] border border-green-700/25 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Earnings</p>
              <p className="text-xl font-black text-green-400">{fmt(dash?.totalEarnings ?? 0)}</p>
              {roi > 0 && <p className="text-xs text-yellow-400 mt-0.5">+{roi.toFixed(2)}% return</p>}
            </div>
            <Link href="/staking">
              <Button size="sm" className="bg-green-600 hover:bg-green-500 gap-1.5 font-semibold shrink-0">
                <Zap className="w-3.5 h-3.5" /> Stake More
              </Button>
            </Link>
          </div>
        )}

      </div>

      {selectedTx && <TxDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}
    </AppLayout>
  );
}

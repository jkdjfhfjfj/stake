import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminListUsers, useAdminUpdateUser } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Users, Lock, Unlock, Edit, Search, Shield, TrendingUp, Wallet, Phone, Mail, Plus, Minus,
  TrendingDown, Clock, CheckCircle, XCircle, FileCheck, FilePlus, AlertTriangle, ChevronDown, ChevronUp,
  Trash2, ArrowDownCircle, ArrowUpCircle, RefreshCcw, Receipt, Pencil, X, Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function authedFetch(url: string, opts: RequestInit = {}) {
  const token = getToken();
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers ?? {}) },
  });
}

function timeLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Matured";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

const TX_TYPE_COLORS: Record<string, string> = {
  DEPOSIT: "bg-green-900/30 text-green-400",
  WITHDRAWAL: "bg-red-900/30 text-red-400",
  INTEREST: "bg-blue-900/30 text-blue-400",
  MANUAL_CREDIT: "bg-purple-900/30 text-purple-400",
  MANUAL_DEBIT: "bg-orange-900/30 text-orange-400",
  STAKE: "bg-yellow-900/30 text-yellow-400",
  UNSTAKE: "bg-pink-900/30 text-pink-400",
  REFERRAL_REWARD: "bg-teal-900/30 text-teal-400",
};
const TX_STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-900/30 text-green-400",
  PENDING: "bg-yellow-900/30 text-yellow-400",
  FAILED: "bg-red-900/30 text-red-400",
  REJECTED: "bg-gray-700/30 text-gray-400",
};
const TX_CREDIT = new Set(["DEPOSIT", "INTEREST", "MANUAL_CREDIT", "REFERRAL_REWARD", "UNSTAKE"]);

const TX_STATUSES = ["PENDING", "COMPLETED", "FAILED", "REJECTED"];

function TxEditRow({ tx, onSaved }: { tx: any; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    status: tx.status,
    description: tx.description ?? "",
    amount: String(tx.amount),
    createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString().slice(0, 16) : "",
  });
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await authedFetch(`/api/admin/transactions/${tx.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: form.status,
          description: form.description || null,
          amount: form.amount ? Number(form.amount) : undefined,
          createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast({ title: "Transaction updated", variant: "success" });
      setEditing(false);
      onSaved();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isCredit = TX_CREDIT.has(tx.type);

  if (editing) {
    return (
      <div className="bg-[#0a1410] rounded-xl p-3 border border-green-700/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Badge className={`${TX_TYPE_COLORS[tx.type] ?? "bg-gray-700/30 text-gray-400"} border-0 text-[10px] px-1.5`}>
              {tx.type.replace(/_/g, " ")}
            </Badge>
            <span className="text-[10px] text-gray-500">#{tx.id}</span>
          </div>
          <button onClick={() => setEditing(false)} className="text-gray-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="w-full bg-[#060d08] border border-green-900/40 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-500">
              {TX_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Amount (KES)</label>
            <Input value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              type="number" step="0.01" min="0"
              className="bg-[#060d08] border-green-900/40 text-white focus:border-green-500 h-7 text-xs" />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-gray-500 block mb-1">Description</label>
            <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Transaction description…"
              className="bg-[#060d08] border-green-900/40 text-white focus:border-green-500 h-7 text-xs" />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-gray-500 block mb-1">Date & Time</label>
            <Input value={form.createdAt} onChange={e => setForm(p => ({ ...p, createdAt: e.target.value }))}
              type="datetime-local"
              className="bg-[#060d08] border-green-900/40 text-white focus:border-green-500 h-7 text-xs" />
          </div>
        </div>
        <div className="flex gap-2 pt-0.5">
          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-500 h-7 text-xs gap-1"
            onClick={save} disabled={saving}>
            {saving ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
            Save
          </Button>
          <Button size="sm" variant="ghost" className="border border-green-900/30 text-gray-400 hover:text-white h-7 text-xs px-3"
            onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-[#0a1410] rounded-xl p-3 border border-green-900/10 hover:border-green-900/25 group">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCredit ? "bg-green-900/30" : "bg-red-900/20"}`}>
        {isCredit
          ? <ArrowDownCircle className="w-4 h-4 text-green-400" />
          : <ArrowUpCircle className="w-4 h-4 text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={`${TX_TYPE_COLORS[tx.type] ?? "bg-gray-700/30 text-gray-400"} border-0 text-[10px] px-1.5`}>
            {tx.type.replace(/_/g, " ")}
          </Badge>
          <Badge className={`${TX_STATUS_COLORS[tx.status] ?? ""} border-0 text-[10px] px-1.5`}>{tx.status}</Badge>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {new Date(tx.createdAt).toLocaleString("en-KE")}
          {tx.description && ` · ${tx.description}`}
        </p>
        {tx.externalReference && (
          <p className="text-[10px] text-gray-600 font-mono truncate max-w-[200px]">{tx.externalReference}</p>
        )}
      </div>
      <div className="text-right shrink-0 flex items-center gap-2">
        <div>
          <p className={`text-sm font-bold ${isCredit ? "text-green-400" : "text-red-400"}`}>
            {isCredit ? "+" : "-"}KES {tx.amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-600">#{tx.id}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-gray-500 hover:text-green-400 transition-colors p-1 rounded-lg hover:bg-green-900/20"
          title="Edit transaction">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function UserTransactionsDialog({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: txs, isLoading, refetch } = useQuery<any[]>({
    queryKey: [`/api/admin/users/${user.id}/transactions`],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`/api/admin/users/${user.id}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open,
  });

  const filtered = (txs ?? []).filter((t) => {
    const q = search.toLowerCase();
    return !q || t.type.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)
      || (t.externalReference ?? "").toLowerCase().includes(q) || t.status.toLowerCase().includes(q);
  });

  const totalIn  = (txs ?? []).filter(t => TX_CREDIT.has(t.type) && t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);
  const totalOut = (txs ?? []).filter(t => !TX_CREDIT.has(t.type) && t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <Button size="sm" variant="ghost"
        className="text-green-400 hover:text-green-300 hover:bg-green-900/20 h-8 px-2 gap-1 text-xs"
        onClick={() => setOpen(true)}>
        <Receipt className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Txns</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-green-400" />
              Transactions — {user.fullName ?? user.email}
            </DialogTitle>
          </DialogHeader>

          {/* Summary row */}
          {txs && txs.length > 0 && (
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <div className="bg-[#0a1410] rounded-xl p-2.5 border border-green-900/20 text-center">
                <p className="text-[10px] text-gray-500 mb-0.5">Total In</p>
                <p className="text-sm font-bold text-green-400">KES {totalIn.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-[#0a1410] rounded-xl p-2.5 border border-green-900/20 text-center">
                <p className="text-[10px] text-gray-500 mb-0.5">Total Out</p>
                <p className="text-sm font-bold text-red-400">KES {totalOut.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-[#0a1410] rounded-xl p-2.5 border border-green-900/20 text-center">
                <p className="text-[10px] text-gray-500 mb-0.5">Transactions</p>
                <p className="text-sm font-bold text-white">{txs.length}</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by type, status, description…"
              className="pl-8 bg-[#0a0f0d] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500 h-8 text-xs" />
          </div>

          {/* Transaction list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                {search ? "No matching transactions" : "No transactions found"}
              </div>
            ) : (
              <div className="space-y-1.5 pr-1">
                {filtered.map((t) => (
                  <TxEditRow key={t.id} tx={t} onSaved={() => refetch()} />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeleteUserButton({ user, onDeleted }: { user: any; onDeleted: () => void }) {
  const { toast } = useToast();
  const del = useMutation({
    mutationFn: async () => {
      const token = getToken();
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      return data;
    },
    onSuccess: () => {
      toast({ title: "User deleted", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      onDeleted();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (user.role === "ADMIN") return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-gray-500 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0"
          title="Delete user">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-[#0d1a10] border-red-900/40 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {user.fullName ?? user.email}?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            This will permanently delete the user and all their transactions, stakes, and data. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-green-900/40 text-gray-300">Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 hover:bg-red-500"
            onClick={() => del.mutate()} disabled={del.isPending}>
            {del.isPending ? "Deleting…" : "Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function KycBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    NONE: { label: "No KYC", cls: "bg-gray-700/30 text-gray-500" },
    REQUESTED: { label: "KYC Requested", cls: "bg-yellow-900/30 text-yellow-400 border-yellow-700/30" },
    SUBMITTED: { label: "KYC Submitted", cls: "bg-blue-900/30 text-blue-400 border-blue-700/30" },
    APPROVED: { label: "KYC Approved", cls: "bg-green-900/30 text-green-400 border-green-700/30" },
    REJECTED: { label: "KYC Rejected", cls: "bg-red-900/30 text-red-400 border-red-700/30" },
  };
  const v = map[status] ?? map.NONE;
  return <Badge className={`${v.cls} border-0 text-[10px] px-1.5`}>{v.label}</Badge>;
}

function UserStakesDialog({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const { data: stakes, isLoading } = useQuery<any[]>({
    queryKey: [`/api/admin/users/${user.id}/stakes`],
    queryFn: async () => {
      const res = await authedFetch(`/api/admin/users/${user.id}/stakes`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open,
  });

  const activeStakes = (stakes ?? []).filter((s) => s.status === "ACTIVE");
  const historyStakes = (stakes ?? []).filter((s) => s.status !== "ACTIVE");

  return (
    <>
      <Button size="sm" variant="ghost"
        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 h-8 px-2 gap-1 text-xs"
        onClick={() => setOpen(true)}>
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Stakes</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Stakes — {user.fullName ?? user.email}
            </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : !stakes?.length ? (
            <div className="text-center py-8 text-gray-500 text-sm">No stakes found</div>
          ) : (
            <div className="space-y-3">
              {activeStakes.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Active ({activeStakes.length})</p>
                  <div className="space-y-2">
                    {activeStakes.map((s) => {
                      const totalDays = s.durationDays;
                      const daysLeft = Math.max(0, Math.ceil((new Date(s.endDate).getTime() - Date.now()) / 86400000));
                      const elapsed = totalDays - daysLeft;
                      const progress = Math.min(100, (elapsed / totalDays) * 100);
                      const fullReturn = s.principalAmount * (1 + s.roiPercent / 100);
                      return (
                        <div key={s.id} className="bg-[#0a1410] rounded-xl p-3 border border-green-900/20">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-white text-sm font-medium">{s.planName}</p>
                              <p className="text-xs text-gray-500">{formatKES(s.principalAmount)} staked</p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 text-sm font-bold">{s.roiPercent}% ROI</p>
                              <p className="text-[10px] text-gray-500">{s.durationDays}d plan</p>
                            </div>
                          </div>
                          <div className="space-y-1 mb-2">
                            <div className="flex justify-between text-[10px] text-gray-400">
                              <span>{elapsed}d elapsed</span>
                              <span className="text-yellow-400 font-medium">{timeLeft(s.endDate)}</span>
                            </div>
                            <Progress value={progress} className="h-1.5 bg-green-900/30" />
                            <div className="flex justify-between text-[10px] text-gray-600">
                              <span>{new Date(s.startDate).toLocaleDateString("en-KE")}</span>
                              <span>{new Date(s.endDate).toLocaleDateString("en-KE")}</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Returns</span>
                            <span className="text-green-400 font-medium">{formatKES(fullReturn)}</span>
                          </div>
                          {s.autoInvest && (
                            <p className="text-[10px] text-blue-400 mt-1">Auto-invest on maturity</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {historyStakes.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">History ({historyStakes.length})</p>
                  <div className="space-y-1.5">
                    {historyStakes.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0a1410] border border-green-900/10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${s.status === "COMPLETED" ? "bg-green-900/30" : "bg-red-900/20"}`}>
                          {s.status === "COMPLETED"
                            ? <CheckCircle className="w-3 h-3 text-green-400" />
                            : <AlertTriangle className="w-3 h-3 text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium">{s.planName}</p>
                          <p className="text-[10px] text-gray-500">{new Date(s.createdAt).toLocaleDateString("en-KE")} → {new Date(s.endDate).toLocaleDateString("en-KE")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white">{formatKES(s.principalAmount)}</p>
                          <Badge className={`${s.status === "COMPLETED" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"} border-0 text-[10px]`}>
                            {s.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function KycAdminControls({ user, onRefresh }: { user: any; onRefresh: () => void }) {
  const { toast } = useToast();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [docOpen, setDocOpen] = useState(false);

  const requestKyc = useMutation({
    mutationFn: async () => {
      const res = await authedFetch(`/api/admin/users/${user.id}/kyc/request`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "KYC requested", description: "User has been notified.", variant: "success" });
      onRefresh();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const reviewKyc = useMutation({
    mutationFn: async (decision: "APPROVED" | "REJECTED") => {
      const res = await authedFetch(`/api/admin/users/${user.id}/kyc/review`, {
        method: "PATCH",
        body: JSON.stringify({ decision, note: reviewNote }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: (_, decision) => {
      toast({ title: `KYC ${decision}`, variant: "success" });
      setReviewOpen(false);
      setReviewNote("");
      onRefresh();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const kycStatus = user.kycStatus ?? "NONE";

  return (
    <div className="flex items-center gap-1">
      {kycStatus === "NONE" || kycStatus === "APPROVED" ? (
        <Button size="sm" variant="ghost"
          className="h-7 px-2 text-[10px] text-purple-400 hover:bg-purple-900/20 gap-1"
          disabled={requestKyc.isPending}
          onClick={() => requestKyc.mutate()}
          title="Request KYC">
          <FilePlus className="w-3 h-3" />
          <span className="hidden sm:inline">KYC</span>
        </Button>
      ) : kycStatus === "SUBMITTED" ? (
        <>
          <Button size="sm" variant="ghost"
            className="h-7 px-2 text-[10px] text-blue-400 hover:bg-blue-900/20 gap-1"
            onClick={() => setDocOpen(true)}
            title="View submitted document">
            <FileCheck className="w-3 h-3" />
            <span className="hidden sm:inline">Doc</span>
          </Button>
          <Button size="sm" variant="ghost"
            className="h-7 px-2 text-[10px] text-green-400 hover:bg-green-900/20 gap-1"
            onClick={() => setReviewOpen(true)}
            title="Review KYC">
            <CheckCircle className="w-3 h-3" />
            <span className="hidden sm:inline">Review</span>
          </Button>
          <Dialog open={docOpen} onOpenChange={setDocOpen}>
            <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-sm">KYC Document — {user.fullName ?? user.email}</DialogTitle>
              </DialogHeader>
              {user.kycDocumentUrl ? (
                <div className="space-y-3">
                  <img src={user.kycDocumentUrl} alt="KYC Document" className="w-full rounded-xl border border-green-900/30 object-contain max-h-[60vh]" />
                  <a href={user.kycDocumentUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline block text-center">Open in new tab</a>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-500 h-9" onClick={() => { setDocOpen(false); reviewKyc.mutate("APPROVED"); }}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button variant="outline" className="flex-1 border-red-900/40 text-red-400 hover:bg-red-900/20 h-9"
                      onClick={() => { setDocOpen(false); setReviewOpen(true); }}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm py-4 text-center">No document URL stored</p>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-sm">
              <DialogHeader><DialogTitle className="text-sm">Review KYC</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Label className="text-gray-300 text-xs">Rejection reason (optional)</Label>
                <Input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="e.g. Document unclear"
                  className="bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9 text-xs" />
                <div className="flex gap-2">
                  <Button className="flex-1 bg-green-600 hover:bg-green-500 h-9" onClick={() => reviewKyc.mutate("APPROVED")} disabled={reviewKyc.isPending}>
                    Approve
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-900/40 text-red-400 hover:bg-red-900/20 h-9"
                    onClick={() => reviewKyc.mutate("REJECTED")} disabled={reviewKyc.isPending}>
                    Reject
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : kycStatus === "REQUESTED" || kycStatus === "REJECTED" ? (
        <Badge className="bg-yellow-900/20 text-yellow-400 border-0 text-[10px] px-1.5">Awaiting</Badge>
      ) : null}
    </div>
  );
}

function EditUserDialog({ user, onRefresh }: { user: any; onRefresh: () => void }) {
  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState<"profile" | "account">("profile");
  const [role, setRole]           = useState<string>(user.role);
  const [adj, setAdj]             = useState("");
  const [note, setNote]           = useState("");
  const [profileForm, setProfileForm] = useState({
    fullName:          user.fullName ?? "",
    email:             user.email ?? "",
    mpesaNumber:       user.mpesaNumber ?? "",
    location:          user.location ?? "",
    referralCode:      user.referralCode ?? "",
    createdAt:         user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 16) : "",
    onboardingComplete: user.onboardingComplete ?? false,
  });
  const { toast } = useToast();

  const update = useAdminUpdateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Account updated" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        setOpen(false); setAdj(""); setNote("");
        onRefresh();
      },
      onError: (e: any) => toast({ title: "Error", description: e?.data?.error ?? e?.message ?? "Try again", variant: "destructive" }),
    },
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const res = await authedFetch(`/api/admin/users/${user.id}/profile`, {
        method: "PUT",
        body: JSON.stringify({
          fullName:          profileForm.fullName || null,
          email:             profileForm.email,
          mpesaNumber:       profileForm.mpesaNumber || null,
          location:          profileForm.location || null,
          referralCode:      profileForm.referralCode || undefined,
          onboardingComplete: profileForm.onboardingComplete,
          createdAt:         profileForm.createdAt ? new Date(profileForm.createdAt).toISOString() : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      onRefresh();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const adjNum = Number(adj);
  const newBalance = user.availableBalance + adjNum;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-green-900/20 h-8 px-2"
        onClick={() => setOpen(true)}>
        <Edit className="w-3.5 h-3.5" />
      </Button>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-sm font-bold">
              {user.email[0].toUpperCase()}
            </div>
            {user.fullName ?? user.email}
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-[#060d08] border border-green-900/20 p-1 gap-1 mt-1">
          {(["profile", "account"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize ${tab === t ? "bg-green-700 text-white" : "text-gray-400 hover:text-white"}`}>
              {t === "profile" ? "Profile & Details" : "Account & Balance"}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-400 text-xs">Full Name</Label>
                <Input value={profileForm.fullName} onChange={(e) => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Full name"
                  className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Email</Label>
                <Input value={profileForm.email} onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com" type="email"
                  className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">M-Pesa Number</Label>
                <Input value={profileForm.mpesaNumber} onChange={(e) => setProfileForm(p => ({ ...p, mpesaNumber: e.target.value }))}
                  placeholder="07XXXXXXXX"
                  className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Location</Label>
                <Input value={profileForm.location} onChange={(e) => setProfileForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Nairobi"
                  className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Referral Code</Label>
                <Input value={profileForm.referralCode} onChange={(e) => setProfileForm(p => ({ ...p, referralCode: e.target.value.toUpperCase() }))}
                  placeholder="ABCD1234"
                  className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-8 text-xs font-mono uppercase" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Join Date</Label>
                <Input value={profileForm.createdAt} onChange={(e) => setProfileForm(p => ({ ...p, createdAt: e.target.value }))}
                  type="datetime-local"
                  className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-8 text-xs" />
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#0a1410] rounded-xl p-3 border border-green-900/20">
              <input type="checkbox" id="onboarding" checked={profileForm.onboardingComplete}
                onChange={(e) => setProfileForm(p => ({ ...p, onboardingComplete: e.target.checked }))}
                className="w-4 h-4 accent-green-500" />
              <label htmlFor="onboarding" className="text-xs text-gray-300 cursor-pointer">Onboarding complete</label>
            </div>
            <div className="bg-[#0a1410] rounded-xl p-3 border border-green-900/20 text-xs text-gray-400 space-y-1">
              <div className="flex justify-between"><span>User ID</span><span className="text-white">#{user.id}</span></div>
              <div className="flex justify-between"><span>Balance</span><span className="text-green-400 font-semibold">{formatKES(user.availableBalance)}</span></div>
              <div className="flex justify-between"><span>Total Earnings</span><span className="text-yellow-400">{formatKES(user.totalEarnings ?? 0)}</span></div>
              <div className="flex justify-between"><span>Active Stakes</span><span className="text-white">{user.activeStakesCount ?? 0}</span></div>
              <div className="flex justify-between"><span>KYC</span><span className="text-white">{user.kycStatus ?? "NONE"}</span></div>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-500 h-9"
              disabled={saveProfile.isPending}
              onClick={() => saveProfile.mutate()}>
              {saveProfile.isPending ? "Saving…" : "Save Profile Changes"}
            </Button>
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {tab === "account" && (
          <div className="space-y-4 pt-1">
            <div>
              <Label className="text-gray-300">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1a10] border-green-900/40 text-white">
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Balance Adjustment</Label>
              <p className="text-xs text-gray-500 mt-0.5 mb-1.5">Positive = credit, negative = debit</p>
              <div className="flex gap-2">
                <button onClick={() => setAdj(adj.startsWith("-") ? adj.slice(1) : "-" + adj)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${
                    adj.startsWith("-") ? "border-red-700/50 bg-red-900/20 text-red-400" : "border-green-900/40 text-green-400"
                  }`}>
                  {adj.startsWith("-") ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
                <Input value={adj.replace("-", "")} onChange={(e) => setAdj((adj.startsWith("-") ? "-" : "") + e.target.value)}
                  type="number" placeholder="e.g. 500"
                  className="bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
              </div>
              {adj && !isNaN(adjNum) && adjNum !== 0 && (
                <div className="mt-2 text-xs text-gray-400 bg-[#0a1410] rounded-lg p-2 border border-green-900/20">
                  New balance: <strong className={newBalance >= 0 ? "text-green-400" : "text-red-400"}>{formatKES(newBalance)}</strong>
                </div>
              )}
            </div>

            {adj && (
              <div>
                <Label className="text-gray-300">Adjustment Note <span className="text-red-400">*</span></Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for this adjustment"
                  className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button className="flex-1 bg-green-600 hover:bg-green-500"
                disabled={update.isPending || (!!adj && !note)}
                onClick={() => update.mutate({ id: user.id, data: {
                  role: role as any,
                  ...(adj && adjNum !== 0 ? { balanceAdjustment: adjNum, adjustmentNote: note } : {}),
                }})}>
                {update.isPending ? "Saving..." : "Save Account"}
              </Button>
              <Button variant="outline" className={`border-green-900/40 gap-1.5 ${user.isLocked ? "text-green-400 hover:bg-green-900/20" : "text-red-400 hover:bg-red-900/20"}`}
                disabled={update.isPending}
                onClick={() => update.mutate({ id: user.id, data: { isLocked: !user.isLocked } })}>
                {user.isLocked ? <><Unlock className="w-3.5 h-3.5" /> Unlock</> : <><Lock className="w-3.5 h-3.5" /> Lock</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsers() {
  const { data: users = [], isLoading, refetch } = useAdminListUsers();
  const [search, setSearch] = useState("");

  const filtered = (users as any[]).filter((u) => {
    const q = search.toLowerCase();
    return !q || u.email.toLowerCase().includes(q) || (u.fullName ?? "").toLowerCase().includes(q) || (u.mpesaNumber ?? "").includes(q);
  });

  const adminCount = (users as any[]).filter((u) => u.role === "ADMIN").length;
  const activeStakers = (users as any[]).filter((u) => (u.activeStakesCount ?? 0) > 0).length;
  const kycPending = (users as any[]).filter((u) => u.kycStatus === "SUBMITTED").length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-[#0d1a10] rounded-xl border border-green-900/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: (users as any[]).length, icon: Users, color: "text-green-400", iconBg: "bg-green-900/30" },
          { label: "Active Stakers", value: activeStakers, icon: TrendingUp, color: "text-blue-400", iconBg: "bg-blue-900/20" },
          { label: "Admins", value: adminCount, icon: Shield, color: "text-amber-400", iconBg: "bg-amber-900/20" },
          { label: "KYC Pending", value: kycPending, icon: FileCheck, color: "text-purple-400", iconBg: "bg-purple-900/20" },
        ].map((s) => (
          <Card key={s.label} className="bg-[#0d1a10] border-green-900/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-6 h-6 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                  <s.icon className={`w-3 h-3 ${s.color}`} />
                </div>
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search by name, email, or M-Pesa number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-[#0d1a10] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
        />
      </div>

      <p className="text-xs text-gray-500">{filtered.length} of {(users as any[]).length} users</p>

      <div className="space-y-2">
        {filtered.map((user: any) => (
          <div key={user.id} className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-3 flex items-center gap-3 hover:border-green-800/30">
            <div className="w-9 h-9 rounded-full bg-green-900/40 flex items-center justify-center text-green-400 font-bold text-sm shrink-0">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-medium text-white truncate">{user.fullName ?? "—"}</p>
                {user.role === "ADMIN" && (
                  <Badge className="bg-amber-900/40 text-amber-400 border-amber-700/40 text-[10px] px-1.5">Admin</Badge>
                )}
                {user.isLocked && (
                  <Badge className="bg-red-900/40 text-red-400 border-red-700/40 text-[10px] px-1.5">Locked</Badge>
                )}
                {(user.activeStakesCount ?? 0) > 0 && (
                  <Badge className="bg-blue-900/30 text-blue-400 border-blue-700/30 text-[10px] px-1.5">{user.activeStakesCount} stakes</Badge>
                )}
                {user.kycStatus && user.kycStatus !== "NONE" && <KycBadge status={user.kycStatus} />}
              </div>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="text-right hidden sm:block shrink-0">
              <p className="text-sm font-medium text-white">{formatKES(user.availableBalance)}</p>
              <p className="text-xs text-gray-500">balance</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <UserTransactionsDialog user={user} />
              <UserStakesDialog user={user} />
              <KycAdminControls user={user} onRefresh={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })} />
              <EditUserDialog user={user} onRefresh={() => {}} />
              <DeleteUserButton user={user} onDeleted={() => {}} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <Card className="bg-[#0d1a10] border-green-900/20">
            <CardContent className="p-8 text-center">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No users found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownCircle, ArrowUpCircle, RefreshCcw, Search, Edit2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function authedFetch(url: string, opts: RequestInit = {}) {
  const token = getToken();
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
}

type TxRow = {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string | null;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  phoneNumber: string | null;
  externalReference: string | null;
  createdAt: string;
};

const TYPE_COLORS: Record<string, string> = {
  DEPOSIT: "bg-green-900/30 text-green-400",
  WITHDRAWAL: "bg-red-900/30 text-red-400",
  INTEREST: "bg-blue-900/30 text-blue-400",
  MANUAL_CREDIT: "bg-purple-900/30 text-purple-400",
  MANUAL_DEBIT: "bg-orange-900/30 text-orange-400",
  STAKE: "bg-yellow-900/30 text-yellow-400",
  UNSTAKE: "bg-pink-900/30 text-pink-400",
  REFERRAL_REWARD: "bg-teal-900/30 text-teal-400",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-900/30 text-green-400",
  PENDING: "bg-yellow-900/30 text-yellow-400",
  FAILED: "bg-red-900/30 text-red-400",
  REJECTED: "bg-gray-700/30 text-gray-400",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  DEPOSIT: <ArrowDownCircle className="w-3.5 h-3.5 text-green-400" />,
  WITHDRAWAL: <ArrowUpCircle className="w-3.5 h-3.5 text-red-400" />,
  INTEREST: <RefreshCcw className="w-3.5 h-3.5 text-blue-400" />,
};

function EditTxDialog({ tx, onDone }: { tx: TxRow; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(tx.status);
  const [description, setDescription] = useState(tx.description ?? "");
  const { toast } = useToast();
  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: async () => {
      const res = await authedFetch(`/api/admin/transactions/${tx.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, description: description || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Transaction updated", variant: "success" });
      qc.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      setOpen(false);
      onDone();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusChanged = status !== tx.status;
  const descChanged = description !== (tx.description ?? "");
  const hasChanges = statusChanged || descChanged;

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-gray-400 hover:text-white hover:bg-green-900/20 h-7 w-7 p-0"
        onClick={() => setOpen(true)}
        title="Edit transaction"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Transaction #{tx.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="bg-[#0a1410] rounded-xl p-3 border border-green-900/20 space-y-1.5 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>User</span>
                <span className="text-white">{tx.userFullName ?? tx.userEmail.split("@")[0]}</span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span className="text-white">{tx.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount</span>
                <span className={tx.type === "DEPOSIT" || tx.type === "INTEREST" || tx.type === "MANUAL_CREDIT"
                  ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                  {formatKES(tx.amount)}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1a10] border-green-900/40 text-white">
                  {["PENDING", "COMPLETED", "FAILED", "REJECTED"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {statusChanged && status === "COMPLETED" && tx.type === "DEPOSIT" && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Balance will be credited to user
                </p>
              )}
              {statusChanged && status === "REJECTED" && tx.type === "WITHDRAWAL" && (
                <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Funds will be returned to user balance
                </p>
              )}
            </div>

            <div>
              <Label className="text-gray-300 text-xs">Description / Note</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional admin note"
                className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-500 h-9"
                disabled={!hasChanges || update.isPending}
                onClick={() => update.mutate()}
              >
                {update.isPending ? "Saving…" : "Save Changes"}
              </Button>
              <Button variant="outline" className="border-green-900/40 text-gray-400 h-9" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminTransactions() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: txs = [], isLoading } = useQuery<TxRow[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: async () => {
      const res = await authedFetch("/api/admin/transactions");
      if (!res.ok) throw new Error("Failed to load transactions");
      return res.json();
    },
  });

  const quickUpdate = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await authedFetch(`/api/admin/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast({ title: `Transaction ${vars.status.toLowerCase()}`, variant: "success" });
      qc.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = txs.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.userEmail.toLowerCase().includes(q) ||
      (t.userFullName ?? "").toLowerCase().includes(q) ||
      (t.externalReference ?? "").toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q);
    const matchType = typeFilter === "ALL" || t.type === typeFilter;
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const types = ["ALL", "DEPOSIT", "WITHDRAWAL", "INTEREST", "MANUAL_CREDIT", "MANUAL_DEBIT", "STAKE", "UNSTAKE", "REFERRAL_REWARD"];
  const statuses = ["ALL", "COMPLETED", "PENDING", "FAILED", "REJECTED"];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by user, reference, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#0d1a10] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#0d1a10] border border-green-900/40 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-green-500"
        >
          {types.map((t) => <option key={t} value={t}>{t === "ALL" ? "All Types" : t.replace("_", " ")}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0d1a10] border border-green-900/40 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-green-500"
        >
          {statuses.map((s) => <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</option>)}
        </select>
      </div>

      <p className="text-xs text-gray-500">{filtered.length} of {txs.length} transactions</p>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-8 text-center text-gray-400">No transactions found.</CardContent>
        </Card>
      ) : (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-900/20">
                    <th className="text-left text-xs text-gray-400 px-4 py-3">User</th>
                    <th className="text-left text-xs text-gray-400 px-4 py-3">Type</th>
                    <th className="text-right text-xs text-gray-400 px-4 py-3">Amount</th>
                    <th className="text-left text-xs text-gray-400 px-4 py-3">Status</th>
                    <th className="text-left text-xs text-gray-400 px-4 py-3 hidden sm:table-cell">Reference</th>
                    <th className="text-left text-xs text-gray-400 px-4 py-3 hidden md:table-cell">Date</th>
                    <th className="text-left text-xs text-gray-400 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-green-900/10 hover:bg-green-900/5">
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium">{t.userFullName ?? t.userEmail.split("@")[0]}</p>
                        <p className="text-gray-500 text-[10px]">{t.userEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${TYPE_COLORS[t.type] ?? "bg-gray-700/30 text-gray-400"} border-0 gap-1 text-[10px]`}>
                          {TYPE_ICONS[t.type]}
                          {t.type.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={t.type === "DEPOSIT" || t.type === "INTEREST" || t.type === "MANUAL_CREDIT" || t.type === "REFERRAL_REWARD"
                          ? "text-green-400 font-medium text-xs" : "text-red-400 font-medium text-xs"}>
                          {formatKES(t.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_COLORS[t.status] ?? ""} border-0 text-[10px]`}>{t.status}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-gray-400 text-[10px] font-mono truncate max-w-[100px]">
                          {t.externalReference ?? "-"}
                        </p>
                        {t.description && (
                          <p className="text-gray-600 text-[10px] truncate max-w-[100px]">{t.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-gray-500 text-xs">{new Date(t.createdAt).toLocaleDateString("en-KE")}</p>
                        <p className="text-gray-600 text-[10px]">{new Date(t.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {t.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-[10px] text-green-400 hover:bg-green-900/20 gap-1"
                                disabled={quickUpdate.isPending}
                                onClick={() => quickUpdate.mutate({ id: t.id, status: "COMPLETED" })}
                                title="Mark Completed"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">Complete</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-[10px] text-red-400 hover:bg-red-900/20 gap-1"
                                disabled={quickUpdate.isPending}
                                onClick={() => quickUpdate.mutate({ id: t.id, status: "REJECTED" })}
                                title="Reject"
                              >
                                <XCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">Reject</span>
                              </Button>
                            </>
                          )}
                          {t.status === "FAILED" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[10px] text-yellow-400 hover:bg-yellow-900/20 gap-1"
                              disabled={quickUpdate.isPending}
                              onClick={() => quickUpdate.mutate({ id: t.id, status: "PENDING" })}
                              title="Retry (set Pending)"
                            >
                              <RefreshCcw className="w-3 h-3" />
                              <span className="hidden sm:inline">Retry</span>
                            </Button>
                          )}
                          <EditTxDialog tx={t} onDone={() => {}} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

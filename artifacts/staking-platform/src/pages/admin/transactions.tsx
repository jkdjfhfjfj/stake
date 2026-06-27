import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownCircle, ArrowUpCircle, RefreshCcw, Search, PlayCircle } from "lucide-react";
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

  const simulateComplete = useMutation({
    mutationFn: async (id: number) => {
      const res = await authedFetch(`/api/admin/transactions/${id}/simulate-complete`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Deposit marked complete", description: "Balance updated.", variant: "success" });
      qc.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
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

  const types = ["ALL", "DEPOSIT", "WITHDRAWAL", "INTEREST", "MANUAL_CREDIT", "MANUAL_DEBIT", "STAKE"];
  const statuses = ["ALL", "COMPLETED", "PENDING", "FAILED", "REJECTED"];

  return (
    <div className="mt-4 space-y-4">
      {/* Filters */}
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
          {types.map((t) => <option key={t} value={t}>{t === "ALL" ? "All Types" : t}</option>)}
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
                    <th className="text-left text-xs text-gray-400 px-4 py-3">Reference</th>
                    <th className="text-left text-xs text-gray-400 px-4 py-3">Date</th>
                    <th className="text-left text-xs text-gray-400 px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-green-900/10 hover:bg-green-900/5 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium">{t.userFullName ?? t.userEmail.split("@")[0]}</p>
                        <p className="text-gray-500 text-xs">{t.userEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${TYPE_COLORS[t.type] ?? "bg-gray-700/30 text-gray-400"} border-0 gap-1`}>
                          {TYPE_ICONS[t.type]}
                          {t.type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={t.type === "DEPOSIT" || t.type === "INTEREST" || t.type === "MANUAL_CREDIT"
                          ? "text-green-400 font-medium"
                          : "text-red-400 font-medium"}>
                          {formatKES(t.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_COLORS[t.status] ?? ""} border-0`}>{t.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-400 text-xs font-mono truncate max-w-[120px]">
                          {t.externalReference ?? "-"}
                        </p>
                        {t.description && (
                          <p className="text-gray-600 text-xs truncate max-w-[120px]">{t.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(t.createdAt).toLocaleDateString("en-KE")}
                        <br />
                        <span className="text-gray-600">{new Date(t.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="px-4 py-3">
                        {t.type === "DEPOSIT" && t.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-green-900/40 text-green-400 hover:bg-green-900/20 gap-1"
                            disabled={simulateComplete.isPending}
                            onClick={() => simulateComplete.mutate(t.id)}
                            title="Simulate deposit completion (dev testing)"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Complete
                          </Button>
                        )}
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

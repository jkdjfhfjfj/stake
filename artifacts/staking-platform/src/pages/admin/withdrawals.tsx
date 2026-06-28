import { useAdminListWithdrawals, useDisburseWithdrawal, useRejectWithdrawal } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, ArrowUpRight, Clock, AlertCircle, Phone, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:   { color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-800/30", label: "Pending" },
  COMPLETED: { color: "text-green-400",  bg: "bg-green-900/20 border-green-800/30",   label: "Completed" },
  FAILED:    { color: "text-red-400",    bg: "bg-red-900/20 border-red-800/30",       label: "Failed" },
  REJECTED:  { color: "text-red-400",    bg: "bg-red-900/20 border-red-800/30",       label: "Rejected" },
};

function RejectDialog({ id, onReject }: { id: number; onReject: (id: number, reason: string) => void }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-red-900/40 text-red-400 hover:bg-red-900/20 gap-1.5 h-8">
          <XCircle className="w-3.5 h-3.5" /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1a10] border-red-900/40 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" /> Reject Withdrawal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-400">Funds will be returned to the user's balance.</p>
          <div>
            <Label className="text-gray-300">Rejection Reason <span className="text-red-400">*</span></Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Invalid phone number, suspected fraud"
              className="mt-1.5 bg-[#0a0f0d] border-red-900/40 text-white focus:border-red-500" />
          </div>
          <Button className="w-full bg-red-600 hover:bg-red-500"
            disabled={!reason.trim()}
            onClick={() => { onReject(id, reason); setOpen(false); setReason(""); }}>
            Confirm Rejection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminWithdrawals() {
  const { data: withdrawals = [], isLoading } = useAdminListWithdrawals();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("ALL");

  const disburse = useDisburseWithdrawal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Disbursed!", description: "B2C payment sent via PayHero." });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      },
      onError: (e: any) => {
        toast({ title: "Disburse failed", description: e?.data?.error ?? e?.message ?? "Check PayHero settings", variant: "destructive" });
      },
    },
  });

  const reject = useRejectWithdrawal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Rejected", description: "Funds returned to user balance." });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      },
      onError: (e: any) => {
        toast({ title: "Error", description: e?.data?.error ?? e?.message ?? "Try again", variant: "destructive" });
      },
    },
  });

  const pending = withdrawals.filter((w: any) => w.status === "PENDING");
  const filtered = filter === "ALL" ? withdrawals : withdrawals.filter((w: any) => w.status === filter);
  const totalPending = pending.reduce((s: number, w: any) => s + w.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-[#0d1a10] rounded-xl border border-green-900/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: pending.length, color: "text-yellow-400", bg: "bg-yellow-900/10 border-yellow-800/20" },
          { label: "Pending Value", value: formatKES(totalPending), color: "text-orange-400", bg: "bg-orange-900/10 border-orange-800/20" },
          { label: "Total", value: withdrawals.length, color: "text-gray-300", bg: "bg-[#0d1a10] border-green-900/20" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-3 ${s.bg}`}>
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {["ALL", "PENDING", "COMPLETED", "REJECTED", "FAILED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f ? "bg-green-600 text-white" : "bg-[#0d1a10] text-gray-400 hover:text-white border border-green-900/30"
            }`}>
            {f === "ALL" ? "All" : f}
            {f === "PENDING" && pending.length > 0 && ` (${pending.length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-10 text-center">
            <ArrowUpRight className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No withdrawal requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((w: any) => {
            const sc = statusConfig[w.status] ?? statusConfig.PENDING;
            return (
              <div key={w.id} className={`border rounded-xl p-4 transition-colors ${
                w.status === "PENDING" ? "bg-[#0d1a10] border-yellow-900/20 hover:border-yellow-800/30" : "bg-[#0d1a10] border-green-900/20"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-white">{w.userFullName ?? w.userEmail?.split("@")[0]}</p>
                      <Badge className={`text-[10px] border ${sc.bg} ${sc.color} px-1.5`}>{sc.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{w.userEmail}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{w.phoneNumber}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(w.createdAt).toLocaleString("en-KE")}</span>
                    </div>
                    {w.note && <p className="text-xs text-red-400 mt-1">Note: {w.note}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-white">{formatKES(w.amount)}</p>
                    {w.status === "PENDING" && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-500 gap-1.5 h-8"
                          disabled={disburse.isPending}
                          onClick={() => disburse.mutate({ id: w.id })}>
                          <CheckCircle className="w-3.5 h-3.5" /> Disburse
                        </Button>
                        <RejectDialog id={w.id} onReject={(id, reason) => reject.mutate({ id, data: { reason } })} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

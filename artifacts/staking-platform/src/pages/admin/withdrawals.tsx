import { useAdminListWithdrawals, useDisburseWithdrawal, useRejectWithdrawal } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

const statusColors: Record<string, string> = {
  PENDING:   "bg-yellow-900/30 text-yellow-400",
  COMPLETED: "bg-green-900/30 text-green-400",
  FAILED:    "bg-red-900/30 text-red-400",
  REJECTED:  "bg-red-900/30 text-red-400",
};

export default function AdminWithdrawals() {
  const { data: withdrawals = [], isLoading } = useAdminListWithdrawals();
  const { toast } = useToast();

  const disburse = useDisburseWithdrawal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Disbursed!", description: "B2C payment sent via PayHero." });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      },
      onError: (e: any) => {
        toast({ title: "Disburse failed", description: e?.response?.data?.error ?? "Check PayHero settings", variant: "destructive" });
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
        toast({ title: "Error", description: e?.response?.data?.error ?? "Try again", variant: "destructive" });
      },
    },
  });

  function RejectDialog({ id }: { id: number }) {
    const [reason, setReason] = useState("");
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="border-red-900/40 text-red-400 hover:bg-red-900/20 gap-1">
            <XCircle className="w-3.5 h-3.5" /> Reject
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#0d1a10] border-red-900/40 text-white max-w-sm">
          <DialogHeader><DialogTitle>Reject Withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Invalid phone number"
                className="mt-1.5 bg-[#0a0f0d] border-red-900/40 text-white focus:border-red-500" />
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-500"
              disabled={!reason || reject.isPending}
              onClick={() => { reject.mutate({ id, data: { reason } }); setOpen(false); }}>
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-gray-400">
        {withdrawals.filter(w => w.status === "PENDING").length} pending, {withdrawals.length} total
      </p>
      {withdrawals.length === 0 ? (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-10 text-center">
            <ArrowUpRight className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No withdrawal requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {withdrawals.map((w) => (
            <div key={w.id} className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{w.userFullName ?? w.userEmail}</p>
                  <Badge className={`text-xs ${statusColors[w.status] ?? ""}`}>{w.status}</Badge>
                </div>
                <p className="text-xs text-gray-500">{w.phoneNumber} • {new Date(w.createdAt).toLocaleString("en-KE")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-white">{formatKES(w.amount)}</p>
              </div>
              {w.status === "PENDING" && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" className="bg-green-600 hover:bg-green-500 gap-1"
                    disabled={disburse.isPending}
                    onClick={() => disburse.mutate({ id: w.id })}>
                    <CheckCircle className="w-3.5 h-3.5" /> Disburse
                  </Button>
                  <RejectDialog id={w.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

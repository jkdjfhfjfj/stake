import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Layers, Plus, Edit, Trash2, TrendingUp, Clock, Shield, Wallet, Award, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

type Plan = {
  id: number;
  name: string;
  roiPercent: string;
  durationDays: number;
  minAmount: number;
  maxAmount: number;
  earlyWithdrawalPenalty: string;
  lockPeriodDays: number;
  isActive: boolean;
};

const defaultForm = {
  name: "",
  roiPercent: "",
  durationDays: "",
  minAmount: "",
  maxAmount: "",
  earlyWithdrawalPenalty: "",
  lockPeriodDays: "0",
};

function PlanForm({ plan, onClose }: { plan?: Plan; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState(plan ? {
    name: plan.name,
    roiPercent: plan.roiPercent,
    durationDays: String(plan.durationDays),
    minAmount: String(plan.minAmount),
    maxAmount: String(plan.maxAmount),
    earlyWithdrawalPenalty: plan.earlyWithdrawalPenalty,
    lockPeriodDays: String(plan.lockPeriodDays ?? 0),
  } : defaultForm);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        roiPercent: Number(form.roiPercent),
        durationDays: Number(form.durationDays),
        minAmount: Number(form.minAmount),
        maxAmount: Number(form.maxAmount) || 0,
        earlyWithdrawalPenalty: Number(form.earlyWithdrawalPenalty),
        lockPeriodDays: Number(form.lockPeriodDays) || 0,
      };
      const url = plan ? `/api/staking-plans/${plan.id}` : "/api/staking-plans";
      const method = plan ? "PATCH" : "POST";
      const res = await authedFetch(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: plan ? "Plan updated!" : "Plan created!" });
      qc.invalidateQueries({ queryKey: ["/api/admin/staking-plans"] });
      onClose();
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const f = (key: keyof typeof form) => (e: any) => setForm(p => ({ ...p, [key]: e.target.value }));
  const isValid = form.name && form.roiPercent && form.durationDays && form.minAmount && form.earlyWithdrawalPenalty;

  const projectedReturn = Number(form.minAmount) * (1 + Number(form.roiPercent) / 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-gray-300">Plan Name</Label>
          <Input value={form.name} onChange={f("name")} placeholder="e.g. Starter Plan"
            className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
        </div>
        <div>
          <Label className="text-gray-300">ROI % <span className="text-green-400">(total return)</span></Label>
          <Input value={form.roiPercent} onChange={f("roiPercent")} type="number" min="0" step="0.1" placeholder="e.g. 15"
            className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
        </div>
        <div>
          <Label className="text-gray-300">Duration (days)</Label>
          <Input value={form.durationDays} onChange={f("durationDays")} type="number" min="1" placeholder="e.g. 30"
            className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
        </div>
        <div>
          <Label className="text-gray-300">Min Stake (KES)</Label>
          <Input value={form.minAmount} onChange={f("minAmount")} type="number" min="0" placeholder="e.g. 1000"
            className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
        </div>
        <div>
          <Label className="text-gray-300">Max Stake (KES) <span className="text-gray-500">(0 = unlimited)</span></Label>
          <Input value={form.maxAmount} onChange={f("maxAmount")} type="number" min="0" placeholder="0 for no limit"
            className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
        </div>
        <div>
          <Label className="text-gray-300">Early Withdrawal Penalty %</Label>
          <Input value={form.earlyWithdrawalPenalty} onChange={f("earlyWithdrawalPenalty")} type="number" min="0" max="100" placeholder="e.g. 10"
            className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
        </div>
        <div>
          <Label className="text-gray-300">Principal Lock Period <span className="text-gray-500">(days)</span></Label>
          <Input value={form.lockPeriodDays} onChange={f("lockPeriodDays")} type="number" min="0" placeholder="0 = no lock"
            className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
          <p className="text-[10px] text-gray-500 mt-1">Days before principal can be withdrawn. 0 = no lock.</p>
        </div>
      </div>

      {isValid && Number(form.minAmount) > 0 && (
        <div className="bg-green-900/10 border border-green-900/20 rounded-xl p-3 text-xs space-y-1">
          <p className="text-gray-400 font-medium mb-2">Preview (on min stake):</p>
          <div className="flex justify-between"><span className="text-gray-500">Min stake</span><span className="text-white">{formatKES(Number(form.minAmount))}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Return after {form.durationDays}d</span><span className="text-green-400 font-semibold">{formatKES(projectedReturn)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Profit</span><span className="text-yellow-400">+{formatKES(projectedReturn - Number(form.minAmount))}</span></div>
        </div>
      )}

      <Button className="w-full bg-green-600 hover:bg-green-500" disabled={!isValid || save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? "Saving..." : plan ? "Update Plan" : "Create Plan"}
      </Button>
    </div>
  );
}

export default function AdminPlans() {
  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/admin/staking-plans"],
    queryFn: async () => {
      const res = await authedFetch("/api/admin/staking-plans");
      if (!res.ok) throw new Error("Failed to load plans");
      return res.json();
    },
  });
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  const toggleActive = useMutation({
    mutationFn: async (plan: Plan) => {
      const res = await authedFetch(`/api/staking-plans/${plan.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/staking-plans"] });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: number) => {
      const res = await authedFetch(`/api/staking-plans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plan deleted" });
      qc.invalidateQueries({ queryKey: ["/api/admin/staking-plans"] });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteAllPlans = useMutation({
    mutationFn: async () => {
      const res = await authedFetch("/api/staking-plans/all", { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "All plans deleted" });
      qc.invalidateQueries({ queryKey: ["/api/admin/staking-plans"] });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-[#0d1a10] rounded-xl border border-green-900/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-gray-400">{plans.length} staking plan{plans.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          {plans.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-900/30">
                  <Trash2 className="w-4 h-4" /> Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#0d1a10] border-red-900/40 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all {plans.length} plans?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    This will permanently delete every staking plan. Active stakes won't be removed, but no new stakes can be created until you add plans again. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-green-900/40 text-gray-300">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-500"
                    onClick={() => deleteAllPlans.mutate()}>
                    Delete All Plans
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-500 gap-2 h-9">
                <Plus className="w-4 h-4" /> Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" /> Create Staking Plan
                </DialogTitle>
              </DialogHeader>
              <PlanForm onClose={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {plans.length === 0 ? (
        <Card className="bg-[#0d1a10] border-green-900/30">
          <CardContent className="p-10 text-center">
            <Layers className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No staking plans created yet.</p>
            <p className="text-xs text-gray-500 mt-1">Create your first plan to let users start staking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map((plan: any) => (
            <div key={plan.id} className={`bg-[#0d1a10] border rounded-xl p-4 transition-colors ${plan.isActive ? "border-green-900/30" : "border-gray-800/30 opacity-60"}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="font-semibold text-white">{plan.name}</p>
                    <Badge className={`text-[10px] border ${plan.isActive ? "bg-green-900/40 text-green-400 border-green-700/40" : "bg-gray-800/40 text-gray-500 border-gray-700/40"}`}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span><strong className="text-green-400">{plan.roiPercent}%</strong> ROI</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span><strong className="text-white">{plan.durationDays}</strong> days</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Wallet className="w-3 h-3 text-yellow-400" />
                      <span>Min <strong className="text-white">{formatKES(plan.minAmount)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Shield className="w-3 h-3 text-orange-400" />
                      <span><strong className="text-orange-400">{plan.earlyWithdrawalPenalty}%</strong> penalty</span>
                    </div>
                    {(plan.lockPeriodDays ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Award className="w-3 h-3 text-red-400" />
                        <span>Locked <strong className="text-red-400">{plan.lockPeriodDays}d</strong></span>
                      </div>
                    )}
                  </div>
                  {plan.maxAmount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Max: {formatKES(plan.maxAmount)}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive.mutate(plan)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
                      plan.isActive ? "border-green-800/40 text-green-400 hover:bg-red-900/20 hover:text-red-400 hover:border-red-800/40"
                      : "border-gray-700/40 text-gray-500 hover:bg-green-900/20 hover:text-green-400 hover:border-green-800/40"
                    }`}
                  >
                    {plan.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {plan.isActive ? "Disable" : "Enable"}
                  </button>

                  <Dialog open={editPlan?.id === plan.id} onOpenChange={(o) => !o && setEditPlan(null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-green-900/20"
                        onClick={() => setEditPlan(plan)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Edit className="w-4 h-4 text-cyan-400" /> Edit Plan
                        </DialogTitle>
                      </DialogHeader>
                      {editPlan && <PlanForm plan={editPlan} onClose={() => setEditPlan(null)} />}
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 hover:bg-red-900/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#0d1a10] border-red-900/40 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{plan.name}"?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          This action cannot be undone. Active stakes in this plan will not be affected, but no new stakes can be created.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-green-900/40 text-gray-300">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-500"
                          onClick={() => deletePlan.mutate(plan.id)}>
                          Delete Plan
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

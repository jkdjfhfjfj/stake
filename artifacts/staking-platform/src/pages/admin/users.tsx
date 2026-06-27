import { useState } from "react";
import { useAdminListUsers, useAdminUpdateUser } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Lock, Unlock, Edit, Search, UserCheck, Shield, TrendingUp, Wallet, Phone, Mail, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function EditUserDialog({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>(user.role);
  const [adj, setAdj] = useState("");
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const update = useAdminUpdateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "User updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        setOpen(false);
        setAdj("");
        setNote("");
      },
      onError: (e: any) => {
        toast({ title: "Error", description: e?.data?.error ?? e?.message ?? "Try again", variant: "destructive" });
      },
    },
  });

  const adjNum = Number(adj);
  const newBalance = user.availableBalance + adjNum;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-green-900/20 h-8 px-2">
          <Edit className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-sm font-bold">
              {user.email[0].toUpperCase()}
            </div>
            {user.fullName ?? user.email}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* User info */}
          <div className="bg-[#0a1410] rounded-xl p-3 border border-green-900/20 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="w-3.5 h-3.5" /><span className="truncate">{user.email}</span>
            </div>
            {user.mpesaNumber && (
              <div className="flex items-center gap-2 text-gray-400">
                <Phone className="w-3.5 h-3.5" /><span>{user.mpesaNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-400">
              <Wallet className="w-3.5 h-3.5" />
              <span>Balance: <strong className="text-green-400">{formatKES(user.availableBalance)}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{user.activeStakesCount ?? 0} active stakes</span>
            </div>
          </div>

          {/* Role */}
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

          {/* Balance adjustment */}
          <div>
            <Label className="text-gray-300">Balance Adjustment</Label>
            <p className="text-xs text-gray-500 mt-0.5 mb-1.5">Use positive numbers to credit, negative to debit</p>
            <div className="flex gap-2">
              <button onClick={() => setAdj(adj.startsWith("-") ? adj.slice(1) : "-" + adj)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
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
              {update.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" className={`border-green-900/40 gap-1.5 ${user.isLocked ? "text-green-400 hover:bg-green-900/20" : "text-red-400 hover:bg-red-900/20"}`}
              disabled={update.isPending}
              onClick={() => update.mutate({ id: user.id, data: { isLocked: !user.isLocked } })}>
              {user.isLocked ? <><Unlock className="w-3.5 h-3.5" /> Unlock</> : <><Lock className="w-3.5 h-3.5" /> Lock</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsers() {
  const { data: users = [], isLoading } = useAdminListUsers();
  const [search, setSearch] = useState("");

  const filtered = users.filter((u: any) => {
    const q = search.toLowerCase();
    return !q || u.email.toLowerCase().includes(q) || (u.fullName ?? "").toLowerCase().includes(q) || (u.mpesaNumber ?? "").includes(q);
  });

  const adminCount = users.filter((u: any) => u.role === "ADMIN").length;
  const lockedCount = users.filter((u: any) => u.isLocked).length;
  const activeStakers = users.filter((u: any) => (u.activeStakesCount ?? 0) > 0).length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-[#0d1a10] rounded-xl border border-green-900/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "text-green-400", iconBg: "bg-green-900/30" },
          { label: "Active Stakers", value: activeStakers, icon: TrendingUp, color: "text-blue-400", iconBg: "bg-blue-900/20" },
          { label: "Admins", value: adminCount, icon: Shield, color: "text-amber-400", iconBg: "bg-amber-900/20" },
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search by name, email, or M-Pesa number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-[#0d1a10] border-green-900/40 text-white placeholder:text-gray-600 focus:border-green-500"
        />
      </div>

      <p className="text-xs text-gray-500">{filtered.length} of {users.length} users</p>

      {/* User list */}
      <div className="space-y-2">
        {filtered.map((user: any) => (
          <div key={user.id} className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-3 flex items-center gap-3 hover:border-green-800/30 transition-colors">
            <div className="w-9 h-9 rounded-full bg-green-900/40 flex items-center justify-center text-green-400 font-bold text-sm shrink-0">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
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
              </div>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="text-right hidden sm:block shrink-0">
              <p className="text-sm font-medium text-white">{formatKES(user.availableBalance)}</p>
              <p className="text-xs text-gray-500">balance</p>
            </div>
            <EditUserDialog user={user} />
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

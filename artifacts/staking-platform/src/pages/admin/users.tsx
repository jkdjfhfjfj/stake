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
import { Users, Lock, Unlock, Edit } from "lucide-react";
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
        toast({ title: "User updated" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        setOpen(false);
      },
      onError: (e: any) => {
        toast({ title: "Error", description: e?.data?.error ?? e?.message ?? "Try again", variant: "destructive" });
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white"><Edit className="w-4 h-4" /></Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1a10] border-green-900/40 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User: {user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-400">Balance: <span className="text-green-400">{formatKES(user.availableBalance)}</span></p>

          <div>
            <Label>Role</Label>
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
            <Label>Balance Adjustment (+ credit, - debit)</Label>
            <Input value={adj} onChange={(e) => setAdj(e.target.value)} type="number" placeholder="e.g. 500 or -200"
              className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
          </div>
          {adj && (
            <div>
              <Label>Adjustment Note</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for adjustment"
                className="mt-1.5 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500" />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button className="flex-1 bg-green-600 hover:bg-green-500"
              disabled={update.isPending}
              onClick={() => update.mutate({ id: user.id, data: {
                role: role as any,
                ...(adj ? { balanceAdjustment: Number(adj), adjustmentNote: note } : {}),
              }})}>
              Save Changes
            </Button>
            <Button variant="outline" className={`border-green-900/40 ${user.isLocked ? "text-green-400" : "text-red-400"}`}
              disabled={update.isPending}
              onClick={() => update.mutate({ id: user.id, data: { isLocked: !user.isLocked } })}>
              {user.isLocked ? <><Unlock className="w-4 h-4 mr-1" /> Unlock</> : <><Lock className="w-4 h-4 mr-1" /> Lock</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsers() {
  const { data: users = [], isLoading } = useAdminListUsers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-gray-400">{users.length} registered users</p>
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="bg-[#0d1a10] border border-green-900/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-green-900/40 flex items-center justify-center text-green-400 font-semibold text-sm shrink-0">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">{user.fullName ?? "—"}</p>
                {user.role === "ADMIN" && <Badge className="bg-green-900/40 text-green-400 border-green-700/50 text-xs">Admin</Badge>}
                {user.isLocked && <Badge className="bg-red-900/40 text-red-400 border-red-700/50 text-xs">Locked</Badge>}
              </div>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-white">{formatKES(user.availableBalance)}</p>
              <p className="text-xs text-gray-500">{user.activeStakesCount ?? 0} stakes</p>
            </div>
            <EditUserDialog user={user} />
          </div>
        ))}
      </div>
    </div>
  );
}

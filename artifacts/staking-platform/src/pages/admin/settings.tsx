import { useEffect, useState } from "react";
import { useGetAdminSettings, useUpdateAdminSettings } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff, Save, Wifi, WifiOff, Loader2, PlayCircle, CreditCard, GitBranch, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";

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

export default function AdminSettings() {
  const { data, isLoading } = useGetAdminSettings();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [form, setForm] = useState({
    payheroUsername: "",
    payheroPassword: "",
    payheroChannelId: "",
    tier1ReferralPercent: 5,
    tier2ReferralPercent: 2,
  });

  useEffect(() => {
    if (data) {
      setForm({
        payheroUsername: data.payheroUsername ?? "",
        payheroPassword: data.payheroPassword ?? "",
        payheroChannelId: data.payheroChannelId ?? "",
        tier1ReferralPercent: data.tier1ReferralPercent ?? 5,
        tier2ReferralPercent: data.tier2ReferralPercent ?? 2,
      });
    }
  }, [data]);

  const update = useUpdateAdminSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "Settings saved!", variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      },
      onError: (e: any) => {
        toast({ title: "Error saving", description: e?.data?.error ?? e?.message ?? "Try again", variant: "destructive" });
      },
    },
  });

  const testPayhero = async () => {
    setTestStatus("loading");
    setTestMsg("");
    try {
      const res = await authedFetch("/api/admin/settings/test-payhero", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestStatus("ok");
        setTestMsg(data.message ?? "Connection successful!");
        toast({ title: "PayHero connected!", description: data.message, variant: "success" });
      } else {
        setTestStatus("fail");
        setTestMsg(data.error ?? "Connection failed");
        toast({ title: "PayHero test failed", description: data.error ?? "Check your credentials", variant: "destructive" });
      }
    } catch (e: any) {
      setTestStatus("fail");
      setTestMsg(e.message ?? "Network error");
      toast({ title: "Connection error", description: e.message, variant: "destructive" });
    }
  };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: key.includes("Percent") ? Number(e.target.value) : e.target.value }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-[#0d1a10] rounded-xl border border-green-900/20 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* PayHero */}
      <Card className="bg-[#0d1a10] border-green-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            </div>
            PayHero API Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-900/10 border border-blue-900/20 rounded-xl p-3 text-xs text-blue-300/80 flex gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Enter your PayHero credentials from <strong>backend.payhero.co.ke</strong>. These are used for M-Pesa STK Push (deposits) and B2C disbursement (withdrawals).</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-gray-300 text-xs">Username</Label>
              <Input value={form.payheroUsername} onChange={f("payheroUsername")} placeholder="PayHero username"
                className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-gray-300 text-xs">Channel ID (M-Pesa)</Label>
              <Input value={form.payheroChannelId} onChange={f("payheroChannelId")} placeholder="e.g. 12345"
                className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9" />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300 text-xs">Password</Label>
              <div className="relative mt-1">
                <Input value={form.payheroPassword} onChange={f("payheroPassword")}
                  type={showPass ? "text" : "password"} placeholder="PayHero password"
                  className="bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 pr-10 h-9" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="button" variant="outline" size="sm"
              className="border-green-900/40 text-green-400 hover:bg-green-900/20 gap-2"
              onClick={testPayhero} disabled={testStatus === "loading"}>
              {testStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" />
                : testStatus === "ok" ? <Wifi className="w-4 h-4 text-green-400" />
                : testStatus === "fail" ? <WifiOff className="w-4 h-4 text-red-400" />
                : <PlayCircle className="w-4 h-4" />}
              Test Connection
            </Button>
            {testMsg && (
              <span className={`text-xs ${testStatus === "ok" ? "text-green-400" : "text-red-400"}`}>
                {testMsg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referral Rates */}
      <Card className="bg-[#0d1a10] border-green-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-900/30 flex items-center justify-center">
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
            </div>
            Referral Commission Rates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-400">
            Commission percentages applied when a referred user makes their first stake.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 text-xs">Tier 1 Rate (%)</Label>
              <Input value={form.tier1ReferralPercent} type="number" min={0} max={100}
                onChange={f("tier1ReferralPercent")}
                className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9" />
              <p className="text-[10px] text-gray-500 mt-1">Direct referrals</p>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Tier 2 Rate (%)</Label>
              <Input value={form.tier2ReferralPercent} type="number" min={0} max={100}
                onChange={f("tier2ReferralPercent")}
                className="mt-1 bg-[#0a0f0d] border-green-900/40 text-white focus:border-green-500 h-9" />
              <p className="text-[10px] text-gray-500 mt-1">Second-level referrals</p>
            </div>
          </div>
          <div className="bg-purple-900/10 border border-purple-900/20 rounded-xl p-3 text-xs text-gray-400">
            <p className="font-medium text-purple-300 mb-2">Example: User stakes KES 10,000</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Tier 1 earns:</span>
                <span className="text-purple-400 font-medium">KES {(10000 * form.tier1ReferralPercent / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tier 2 earns:</span>
                <span className="text-blue-400 font-medium">KES {(10000 * form.tier2ReferralPercent / 100).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="bg-green-600 hover:bg-green-500 gap-2 w-full sm:w-auto h-10"
        disabled={update.isPending}
        onClick={() => update.mutate({ data: form })}>
        <Save className="w-4 h-4" />
        {update.isPending ? "Saving…" : "Save All Settings"}
      </Button>
    </div>
  );
}
